import {db} from "./db";
import type {Prisma} from "./generated/prisma/client";
import {REVIEWED_MUSEUM_BATCH,reviewedSaints,reviewedDecisionSchema} from "./reviewed-museum-correction-domain";
const json=(v:unknown):Prisma.InputJsonValue=>JSON.parse(JSON.stringify(v));
export async function readReviewedMuseumDecisions(client:Prisma.TransactionClient=db) {
 const records=await client.externalRecord.findMany({where:{sourceType:"manual_review",entityType:"MuseumGeographyDecision"}});
 return records.flatMap(record=>{const parsed=reviewedDecisionSchema.safeParse(record.rawPayloadJson);return parsed.success&&record.entityId===parsed.data.saintId?[parsed.data]:[];});
}
// Explicit maintenance operation only, never called during imports/build/rendering.
export async function applyReviewedMuseumCorrections(actorId:string) {
 return db.$transaction(async tx=>{
  await tx.$queryRaw`SELECT true AS locked FROM pg_advisory_xact_lock(8496240)`;
  const applied=await tx.externalRecord.findUnique({where:{sourceType_externalId:{sourceType:"manual_review",externalId:REVIEWED_MUSEUM_BATCH}}});
  if(applied)return {applied:false,message:"This reviewed batch has already been applied."};
  const saints=await tx.saint.findMany({where:{id:{in:reviewedSaints.map(s=>s.id)}},include:{places:{include:{place:true}}}});
  for(const target of reviewedSaints){const saint=saints.find(s=>s.id===target.id);if(!saint||saint.status==="archived"||saint.slug!==target.slug)throw Error("A reviewed canonical saint is unavailable or has changed identity.");}
  const madhu=saints.find(s=>s.id===reviewedSaints[1].id)!;
  async function place(name:string,alternatives:string[],kind:"locality"|"neighborhood") {
   const candidates=await tx.place.findMany({where:{name:{in:[name,...alternatives],mode:"insensitive"},placeKind:{not:"spiritual_region"},OR:[{country:"India"},{country:null},{country:""}]},orderBy:{id:"asc"}});
   const exact=candidates.filter(p=>p.name.toLowerCase()===name.toLowerCase());
   const eligible=exact.length?exact:candidates;
   if(eligible.length>1)throw Error("Multiple locality identities require resolution before this batch.");
   if(eligible[0]){
    const p=eligible[0];if(p.publicationStatus==="archived")throw Error("Reviewed locality is archived.");
    if(madhu.status==="published"&&p.publicationStatus!=="published"&&p.overviewMarkdown?.trim())throw Error("Locality has unpublished editorial content; review before exposing it.");
    return p;
   }
   return tx.place.create({data:{name,slug:name==="Vrindavan"?"vrindavan-reviewed-locality":"vamshi-vat-reviewed-locality",alternateNames:alternatives,country:"India",region:"Uttar Pradesh",placeKind:kind,placeScope:"locality",teamVisibility:madhu.status==="published"?"public":"private",publicationStatus:madhu.status==="published"?"published":"unpublished"}});
  }
  const locality=await place("Vrindavan",["Vrindavan, India","Brindavan"],"locality");
  const specific=await place("Vamshi Vat",["Vamshi Vatt","Vamshi Vatt, Vraj Bhoomi, near Vrindavan","Vamshivat"],"neighborhood");
  await tx.saintPlace.updateMany({where:{saintId:madhu.id,placeType:"primary",placeId:{not:locality.id}},data:{placeType:"associated"}});
  const existing=await tx.saintPlace.findFirst({where:{saintId:madhu.id,placeId:locality.id},orderBy:{id:"asc"}});
  if(existing)await tx.saintPlace.update({where:{id:existing.id},data:{placeType:"primary"}});
  else await tx.saintPlace.create({data:{saintId:madhu.id,placeId:locality.id,placeType:"primary"}});
  const destination=await tx.saintPlace.findFirst({where:{saintId:madhu.id,placeId:specific.id}});
  if(!destination)await tx.saintPlace.create({data:{saintId:madhu.id,placeId:specific.id,placeType:"associated",notes:reviewedSaints[1].note}});
  for(const link of madhu.places.filter(p=>/jaipur/i.test(p.place.name)))await tx.saintPlace.update({where:{id:link.id},data:{placeType:"associated",notes:[link.notes,reviewedSaints[1].note].filter(Boolean).join(" ")}});
  await tx.saint.update({where:{id:madhu.id},data:{version:{increment:1}}});
  for(const target of reviewedSaints){
   const decision={batch:REVIEWED_MUSEUM_BATCH,saintId:target.id,section:target.section,note:target.note,sourcePlaceError:target.id===reviewedSaints[2].id?"Mayapur":null};
   await tx.externalRecord.create({data:{sourceType:"manual_review",externalId:`${REVIEWED_MUSEUM_BATCH}:${target.id}`,entityType:"MuseumGeographyDecision",entityId:target.id,rawPayloadJson:json(decision)}});
  }
  const afterPlaces=await tx.saintPlace.findMany({where:{saintId:madhu.id},include:{place:true}});
  await tx.auditEvent.create({data:{userId:actorId,action:"museum.reviewed_geography_applied",entityType:"Saint",entityId:madhu.id,beforeJson:json(madhu.places),afterJson:json({places:afterPlaces,decisions:reviewedSaints,provenance:"Direct user decisions in Museum Data Integration, October 3 2026"})}});
  await tx.externalRecord.create({data:{sourceType:"manual_review",externalId:REVIEWED_MUSEUM_BATCH,entityType:"ReviewedMuseumCorrectionBatch",rawPayloadJson:json({actorId,decisions:reviewedSaints,appliedAt:new Date().toISOString()})}});
  return {applied:true,message:"Website locality and reviewed museum proposal decisions applied."};
 },{isolationLevel:"Serializable",timeout:30000});
}