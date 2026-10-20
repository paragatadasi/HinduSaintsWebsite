import {createHash} from "node:crypto";
import {z} from "zod";
import {db} from "@/lib/db";
import {Prisma} from "@/lib/generated/prisma/client";
import {countryName,normalizedCountry,usableKeyLocalities,type KeyLocalityRecord} from "@/lib/key-locality-domain";
import {keyLocalityResearch,keyLocalityResearchHash} from "@/lib/key-locality-research";
import {toSlug} from "@/lib/slugs";
type Client=Prisma.TransactionClient;
const sourceType="reviewed_key_localities";
const json=(v:unknown):Prisma.InputJsonValue=>JSON.parse(JSON.stringify(v));
const hash=(v:unknown)=>createHash("sha256").update(JSON.stringify(v)).digest("hex");
const appliedKey=(r:KeyLocalityRecord)=>`${keyLocalityResearch.review_version}:${r.external_id}`;
async function candidates(tx:Client,locality:string,country:string){
 const rows=await tx.place.findMany({where:{OR:[{name:{equals:locality,mode:"insensitive"}},{alternateNames:{has:locality}}],placeScope:"locality",placeKind:{in:["locality","city","town","village","neighborhood","unknown"]}},orderBy:{id:"asc"}});
 return rows.filter(p=>normalizedCountry(p.country)===country||!normalizedCountry(p.country));
}
export async function previewKeyLocality(record:KeyLocalityRecord,tx:Client=db){
 const slug=record.external_id.replace("hindu-saints:saint:","");
 const links=await tx.externalRecord.findMany({where:{externalId:record.external_id,entityType:"Saint"},select:{entityId:true}});
 const bySlug=await tx.saint.findUnique({where:{slug},select:{id:true}});
 const ids=[...new Set([...links.flatMap(l=>l.entityId?[l.entityId]:[]),...(bySlug?[bySlug.id]:[])])];
 const saint=ids.length===1?await tx.saint.findUnique({where:{id:ids[0]},include:{places:{include:{place:true},orderBy:{id:"asc"}}}}):null;
 const applied=await tx.externalRecord.findUnique({where:{sourceType_externalId:{sourceType,externalId:appliedKey(record)}}});
 const usable=usableKeyLocalities(record);
 const localities=[];
 let blocked=ids.length!==1?"Saint identity is missing or conflicting.":!saint||saint.status!=="published"||saint.publicationStatus!=="published"?"Saint is not currently published.":applied?"This research version was already applied; later edits are preserved.":!usable.length||usable[0].display_order!==1?"Representative locality is unresolved.":"";
 for(const locality of usable){
  const matches=await candidates(tx,locality.locality,locality.country);
  if(!blocked&&matches.length>1)blocked="Multiple locality records match; resolve place identity first.";
  else if(!blocked&&matches[0]&&!normalizedCountry(matches[0].country))blocked="A matching locality has no country. Confirm its geography before reusing it.";
  if(!blocked&&matches.some(p=>p.publicationStatus==="archived"||(p.publicationStatus!=="published"&&Boolean(p.overviewMarkdown?.trim()))))blocked="A matching place is archived or contains unpublished editorial content.";
  localities.push({research:locality,place:matches.length===1?matches[0]:null});
 }
 const revision=hash({research:keyLocalityResearchHash,record,ids,saint,applied,localities});
 return {record,saint,applied,localities,blocked,selection:`${record.external_id}:${revision}`};
}
export async function readKeyLocalityPreview(tx:Client=db){
 const plans=[];for(const record of keyLocalityResearch.records)plans.push(await previewKeyLocality(record,tx));
 const counts=new Map<string,number>();for(const plan of plans)if(plan.saint)counts.set(plan.saint.id,(counts.get(plan.saint.id)||0)+1);
 for(const plan of plans)if(plan.saint&&(counts.get(plan.saint.id)||0)>1)plan.blocked="Multiple research records identify this saint. Reconcile the recommendations first.";
 const published=await tx.saint.findMany({where:{status:"published",publicationStatus:"published"},select:{id:true,displayName:true,slug:true},orderBy:{displayName:"asc"}});
 const covered=new Set(plans.flatMap(p=>p.saint?[p.saint.id]:[]));
 return {plans,published,uncovered:published.filter(s=>!covered.has(s.id))};
}
const requestSchema=z.object({selections:z.array(z.string().regex(/^hindu-saints:saint:[a-z0-9-]+:[a-f0-9]{64}$/)).min(1).max(214),confirm:z.literal("on")}).refine(r=>new Set(r.selections).size===r.selections.length,"Duplicate selections");
export async function applyKeyLocalityUpdates(actorId:string,input:unknown){
 const request=requestSchema.parse(input);
 return db.$transaction(async tx=>{
  await tx.$queryRaw`SELECT true AS locked FROM pg_advisory_xact_lock(8496221)`;
  const plans=[];
  for(const selection of [...request.selections].sort()){
   const externalId=selection.slice(0,selection.lastIndexOf(":"));
   const record=keyLocalityResearch.records.find(r=>r.external_id===externalId);if(!record)throw Error("Unknown research record.");
   let plan=await previewKeyLocality(record,tx);
   if(plan.saint){await tx.$queryRaw(Prisma.sql`SELECT id FROM "Saint" WHERE id=${plan.saint.id} FOR UPDATE`);plan=await previewKeyLocality(record,tx);}
   if(plan.selection!==selection||plan.blocked||!plan.saint)throw Error("Research or website data changed. Reload the preview; no selected changes were saved.");
   plans.push(plan);
  }
  if(new Set(plans.map(p=>p.saint!.id)).size!==plans.length)throw Error("Multiple research records identify the same saint.");
  for(const plan of plans){
   const saint=plan.saint!;
   await tx.saintPlace.updateMany({where:{saintId:saint.id},data:{keyLocalityOrder:null}});
   await tx.saintPlace.updateMany({where:{saintId:saint.id,placeType:"primary"},data:{placeType:"associated"}});
   let order=0;
   for(const item of plan.localities){
    // Re-resolve inside the transaction to reuse places shared by this batch.
    const matches=await candidates(tx,item.research.locality,item.research.country);
    if(matches.length>1)throw Error("Locality identity changed.");
    let place=matches[0];
    if(!place){
     const base=toSlug(`${item.research.locality} ${item.research.country}`)||"researched-locality";let slug=base;let n=2;
     while(await tx.place.findUnique({where:{slug}}))slug=`${base}-${n++}`;
     place=await tx.place.create({data:{name:item.research.locality,slug,country:countryName(item.research.country),alternateNames:[],placeScope:"locality",placeKind:"locality",teamVisibility:"public",publicationStatus:"published"}});
     await tx.auditEvent.create({data:{userId:actorId,entityType:"Place",entityId:place.id,action:"research_locality_created",afterJson:json(place)}});
    }
    order++;
    const existing=await tx.saintPlace.findFirst({where:{saintId:saint.id,placeId:place.id,placeType:"associated"},orderBy:{id:"asc"}});
    const data={placeType:order===1?"primary" as const:"associated" as const,keyLocalityOrder:order};
    if(existing)await tx.saintPlace.update({where:{id:existing.id},data});
    else await tx.saintPlace.create({data:{saintId:saint.id,placeId:place.id,...data}});
   }
   await tx.saint.update({where:{id:saint.id},data:{version:{increment:1}}});
   const after=await tx.saintPlace.findMany({where:{saintId:saint.id},include:{place:true},orderBy:{id:"asc"}});
   await tx.externalRecord.create({data:{sourceType,externalId:appliedKey(plan.record),entityType:"Saint",entityId:saint.id,rawPayloadJson:json({version:keyLocalityResearch.review_version,researchHash:keyLocalityResearchHash,policy:keyLocalityResearch.policy,record:plan.record,before:saint.places,after,actorId,appliedAt:new Date().toISOString()})}});
   await tx.auditEvent.create({data:{userId:actorId,entityType:"Saint",entityId:saint.id,action:"reviewed_key_localities_applied",beforeJson:json(saint.places),afterJson:json({places:after,research:plan.record.external_id,version:keyLocalityResearch.review_version})}});
  }
  return {updated:plans.length,slugs:plans.map(p=>p.saint!.slug)};
 },{isolationLevel:"Serializable",timeout:180000});
}
