import { createHash } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { toSlug } from "@/lib/slugs";
import { visitPlaceSchema } from "@/lib/visit-place-domain";

type Client = Prisma.TransactionClient;
const json=(value:unknown):Prisma.InputJsonValue=>JSON.parse(JSON.stringify(value));
const fingerprint=(value:unknown)=>createHash("sha256").update(JSON.stringify(value)).digest("hex");
export const acceptanceSchema=z.object({
 selections:z.array(z.string().regex(/^c[a-z0-9]+:[a-f0-9]{64}$/)).min(1).max(300),
 confirm:z.literal("on"), updatePrimary:z.boolean(), note:z.string().trim().max(5000).default("")
}).refine(v=>new Set(v.selections.map(s=>s.split(":")[0])).size===v.selections.length,"Duplicate selections");

async function localityCandidates(client:Client,data:{locality:string;country:string;state_or_region:string}) {
 if(!data.locality) return [];
 // Reuse a unique compatible locality with incomplete old geography; never rename it or overwrite its coordinates.
 return client.place.findMany({where:{name:{equals:data.locality,mode:"insensitive" as const},placeScope:"locality",placeKind:{in:["locality","city","town","village","neighborhood","unknown"]},AND:[{OR:[{country:null},{country:""},{country:{equals:data.country,mode:"insensitive" as const}}]},...(data.state_or_region?[{OR:[{region:null},{region:""},{region:{equals:data.state_or_region,mode:"insensitive" as const}}]}]:[])]},orderBy:{id:"asc"}});
}

export async function previewVisitAcceptance(id:string, client:Client=db) {
 const row=await client.visitPlaceProposal.findUniqueOrThrow({where:{id},include:{saint:{include:{places:{include:{place:true},orderBy:{id:"asc"}}}},acceptedVisitPlace:true}});
 const data=visitPlaceSchema.parse(row.normalizedJson);
 const latest=await client.visitPlaceProposal.findFirst({where:{sourceKey:row.sourceKey},orderBy:[{observedAt:"desc"},{id:"desc"}]});
 const accepted=await client.saintVisitPlace.findUnique({where:{sourceKey:row.sourceKey}});
 const candidates=await localityCandidates(client,data);
 let blocked="";
 if(!row.saint || row.saint.status==="archived") blocked="Saint identity needs review.";
 else if(latest?.id!==row.id || !["pending","deferred","approved"].includes(row.status)) blocked="This proposal is no longer available for acceptance.";
 else if(row.acceptedVisitPlace) blocked="Already accepted; edit the saint or reopen through a later correction review.";
 else if(accepted) blocked="New research conflicts with an accepted destination. Review the correction separately.";
 else if(/pushpa/i.test(data.visit_place_name)&&/burial/i.test(data.research_notes)) blocked="Correct the memorial versus burial research wording before acceptance.";
 else if(candidates.length>1) blocked="Multiple localities match this geography. Resolve the place identity before acceptance.";
 if(!blocked && candidates[0]?.publicationStatus==="archived") blocked="The matching locality is archived. Review the place before connecting it.";
 if(!blocked && row.saint?.status==="published" && candidates[0]?.publicationStatus!=="published" && candidates[0]?.overviewMarkdown?.trim()) {
  const alreadyPublic=await client.saintPlace.count({where:{placeId:candidates[0].id,saint:{status:"published"}}});
  if(!alreadyPublic) blocked="This locality contains unpublished editorial content. Review its publication before connecting a public saint.";
 }
 const revision=fingerprint({row,latest:latest?.id,accepted,candidates});
 return {id:row.id,selection:row.id+":"+revision,row,data,candidate:candidates[0]??null,blocked,
 currentPrimary:row.saint?.places.filter(p=>p.placeType==="primary").map(p=>p.place.name).join("; ")||"None",
 primaryBlocked:!data.locality?"Locality is missing; review it before changing the primary place.":""};
}

export async function acceptVisitPlaces(actorId:string,input:unknown) {
 const request=acceptanceSchema.parse(input);
 return db.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(8496221)`;
  const ordered=[...request.selections].sort();
  // Lock canonical saints before reading the final preview; museum reviewers use the same row lock.
  const rows=await tx.visitPlaceProposal.findMany({where:{id:{in:ordered.map(s=>s.split(":")[0])}},select:{saintId:true}});
  for(const id of [...new Set(rows.flatMap(r=>r.saintId?[r.saintId]:[]))].sort()) await tx.$queryRaw(Prisma.sql`SELECT id FROM "Saint" WHERE id = ${id} FOR UPDATE`);
  const plans=[];
  for(const token of ordered) {
   const plan=await previewVisitAcceptance(token.split(":")[0],tx);
   if(plan.selection!==token || plan.blocked || (request.updatePrimary&&plan.primaryBlocked)) throw Error("A selected proposal or website place changed. Reload the batch preview; no changes were applied.");
   plans.push(plan);
  }
  if(new Set(plans.map(p=>p.row.saintId)).size!==plans.length) throw Error("Review multiple destinations for one saint separately before changing its primary locality.");
  for(const plan of plans) {
   const saint=plan.row.saint!;const data=plan.data;
   let localityId:string|null=plan.candidate?.id??null;
   if(request.updatePrimary) {
    // Re-read inside the batch so saints sharing a locality reuse the same Place.
    const existing=await localityCandidates(tx,data);
    if(existing.length>1) throw Error("Ambiguous locality identity.");
    localityId=existing[0]?.id??null;
    if(!localityId) {
     const base=toSlug([data.locality,data.state_or_region,data.country].filter(Boolean).join(" "))||"visit-locality";
     let slug=base;let n=2;while(await tx.place.findUnique({where:{slug}})) slug=base+"-"+n++;
     const place=await tx.place.create({data:{slug,name:data.locality,country:data.country,region:data.state_or_region||null,placeScope:"locality",placeKind:"locality",alternateNames:[],teamVisibility:saint.status==="published"?"public":"private",publicationStatus:saint.status==="published"?"published":"unpublished"}});
     localityId=place.id;
     await tx.auditEvent.create({data:{userId:actorId,entityType:"Place",entityId:place.id,action:"visit_locality_created",afterJson:json(place)}});
    }
    await tx.saintPlace.updateMany({where:{saintId:saint.id,placeType:"primary",placeId:{not:localityId}},data:{placeType:"associated"}});
    const attached=await tx.saintPlace.findFirst({where:{saintId:saint.id,placeId:localityId,placeType:"primary"}});
    if(!attached) {
     const associated=await tx.saintPlace.findFirst({where:{saintId:saint.id,placeId:localityId,placeType:"associated"},orderBy:{id:"asc"}});
     if(associated) await tx.saintPlace.update({where:{id:associated.id},data:{placeType:"primary"}});
     else await tx.saintPlace.create({data:{saintId:saint.id,placeId:localityId,placeType:"primary"}});
    }
   }
   const visit=await tx.saintVisitPlace.create({data:{saintId:saint.id,proposalId:plan.id,sourceKey:plan.row.sourceKey,destinationName:data.visit_place_name,kind:data.visit_place_kind,locality:data.locality,region:data.state_or_region||null,country:data.country,localityPlaceId:request.updatePrimary?localityId:null,acceptedById:actorId}});
   await tx.visitPlaceProposal.update({where:{id:plan.id},data:{status:"approved",reviewedBy:actorId,reviewedAt:new Date(),decisionNote:request.note||null,version:{increment:1}}});
   await tx.saint.update({where:{id:saint.id},data:{version:{increment:1}}});
   const after=await tx.saintPlace.findMany({where:{saintId:saint.id},orderBy:{id:"asc"}});
   await tx.auditEvent.create({data:{userId:actorId,entityType:"Saint",entityId:saint.id,action:"visit_place_accepted",beforeJson:json({places:saint.places,proposal:plan.row}),afterJson:json({visit,places:after,updatePrimary:request.updatePrimary,note:request.note,coordinatePolicy:"No unverified coordinates published"})}});
  }
  return {accepted:plans.length,slugs:plans.map(p=>p.row.saint!.slug)};
 },{isolationLevel:"Serializable",timeout:120000});
}
