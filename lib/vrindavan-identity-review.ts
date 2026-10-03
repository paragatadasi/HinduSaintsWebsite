import {createHash} from "node:crypto";
import {db} from "@/lib/db";
import type {Prisma} from "@/lib/generated/prisma/client";
import {stableCollectionJson} from "@/lib/museum-collection-domain";
import {vrindavanBundleSchema,inventoryRows,VRINDAVAN_MAPPING,buildWebsiteIdentityMatcher,identityObservationSchema,identityDecisionSchema} from "@/lib/vrindavan-identity-domain";
const museumId="museum-vrindavan",prefix="vrindavan-workbook:";
const json=(v:unknown):Prisma.InputJsonValue=>JSON.parse(JSON.stringify(v));
const hash=(v:unknown)=>createHash("sha256").update(stableCollectionJson(v)).digest("hex");
type Client=Prisma.TransactionClient;
const lock=(tx:Client)=>tx.$executeRaw`SELECT pg_advisory_xact_lock(8496233)`;
export async function stageVrindavanInventory(actorId:string,input:unknown){
  const bundle=vrindavanBundleSchema.parse(input),rows=inventoryRows(bundle),externalId=prefix+bundle.sha256;
  if(!rows.length)throw Error("No inventory rows");
  return db.$transaction(async tx=>{
    await lock(tx);
    if(!await tx.museum.findFirst({where:{id:museumId,archivedAt:null}}))throw Error("Museum unavailable");
    const prior=await tx.externalRecord.findUnique({where:{sourceType_externalId:{sourceType:"vrindavan_workbook",externalId}}});
    if(prior){if(hash(prior.rawPayloadJson)!==hash(bundle))throw Error("Snapshot content differs for the same file identity");return {staged:0,unchanged:rows.length,batch:bundle.sha256};}
    await tx.externalRecord.create({data:{sourceType:"vrindavan_workbook",externalId,entityType:"VrindavanInventorySnapshot",rawPayloadJson:json(bundle)}});
    for(const row of rows){const {raw,...data}=row;
      await tx.museumCollectionImport.create({data:{museumId,sourceKey:`${externalId}:Sheet1:${row.sourceRow}`,fingerprint:hash(raw),rawJson:json(raw),normalizedJson:json({...data,mappingVersion:VRINDAVAN_MAPPING,sourceName:bundle.sourceName,saintIds:[],note:null}),status:"pending"}});
    }
    await tx.auditEvent.create({data:{userId:actorId,action:"vrindavan.inventory.staged",entityType:"Museum",entityId:museumId,afterJson:{sourceName:bundle.sourceName,fileHash:bundle.sha256,rows:rows.length}}});
    return {staged:rows.length,unchanged:0,batch:bundle.sha256};
  },{isolationLevel:"Serializable",timeout:120000});
}
export async function readVrindavanIdentityReview(client:Client=db){
  const [observations,saints]=await Promise.all([
    client.museumCollectionImport.findMany({where:{museumId,sourceKey:{startsWith:prefix}},orderBy:[{observedAt:"desc"},{sourceKey:"asc"}]}),
    client.saint.findMany({where:{status:{not:"archived"}},select:{id:true,displayName:true,canonicalName:true,slug:true,status:true,aliases:{select:{alias:true}}},orderBy:{id:"asc"}})
  ]);
  const contextHash=hash(saints.map(s=>({...s,aliases:[...s.aliases].sort((a,b)=>a.alias.localeCompare(b.alias))})));
  const match=buildWebsiteIdentityMatcher(saints);
  const rows=observations.flatMap(row=>{
    const parsed=identityObservationSchema.safeParse(row.normalizedJson);if(!parsed.success)return [];
    const data=parsed.data,identity=match(data.name);
    const missingReviewedTarget=data.saintIds.some(id=>!saints.some(s=>s.id===id));
    return [{row,data,identity,missingReviewedTarget,version:hash({id:row.id,status:row.status,reviewedAt:row.reviewedAt,normalized:row.normalizedJson,sourceKey:row.sourceKey,fingerprint:row.fingerprint,contextHash})}];
  });
  return {rows,saints};
}
export async function decideVrindavanIdentity(actorId:string,input:unknown){
  const decisions=identityDecisionSchema.array().min(1).max(500).parse(input);
  if(new Set(decisions.map(d=>d.id)).size!==decisions.length)throw Error("Duplicate selection");
  return db.$transaction(async tx=>{
    await lock(tx);if(!await tx.museum.findFirst({where:{id:museumId,archivedAt:null}}))throw Error("Museum unavailable");const current=await readVrindavanIdentityReview(tx);
    const selected=decisions.map(d=>{
      const plan=current.rows.find(r=>r.row.id===d.id);
      if(!plan||plan.version!==d.version||!["pending","deferred"].includes(plan.row.status)||plan.row.itemId)throw Error("Review changed; reload before deciding");
      if(d.saintIds.some(id=>!current.saints.some(s=>s.id===id)))throw Error("Saint no longer available");
      return {d,plan};
    });
    for(const {d,plan} of selected){
      const after={...plan.data,saintIds:d.action==="link"?d.saintIds:[],note:d.note||null};
      await tx.museumCollectionImport.update({where:{id:d.id},data:{status:d.action==="link"?"identity_linked":"deferred",normalizedJson:json(after),reviewedAt:new Date(),reviewedById:actorId}});
      await tx.auditEvent.create({data:{userId:actorId,action:`vrindavan.identity.${d.action}`,entityType:"MuseumCollectionImport",entityId:d.id,beforeJson:json({status:plan.row.status,data:plan.data}),afterJson:json({status:d.action==="link"?"identity_linked":"deferred",data:after})}});
    }
    return {saved:selected.length};
  },{isolationLevel:"Serializable",timeout:120000});
}
// Recompute every automatic suggestion server-side. A client cannot force an uncertain match into a batch.
export async function confirmClearVrindavanMatches(actorId:string,selections:unknown,confirm:unknown){
  const tokens=zTokens(selections);if(confirm!=="on")throw Error("Confirmation required");
  // One transaction must cover preview validation and all writes.
  return db.$transaction(async tx=>{
    await lock(tx);if(!await tx.museum.findFirst({where:{id:museumId,archivedAt:null}}))throw Error("Museum unavailable");const current=await readVrindavanIdentityReview(tx);
    const plans=tokens.map(token=>{const [id,version]=token.split(":");const p=current.rows.find(r=>r.row.id===id);
      if(!p||p.version!==version||p.row.status!=="pending"||p.identity.category!=="clear"||p.row.itemId)throw Error("Suggestions changed");return p;});
    for(const p of plans){const after={...p.data,saintIds:[p.identity.candidates[0].id],note:null};
      await tx.museumCollectionImport.update({where:{id:p.row.id},data:{status:"identity_linked",normalizedJson:json(after),reviewedAt:new Date(),reviewedById:actorId}});
      await tx.auditEvent.create({data:{userId:actorId,action:"vrindavan.identity.link",entityType:"MuseumCollectionImport",entityId:p.row.id,beforeJson:json({status:p.row.status,data:p.data}),afterJson:json({status:"identity_linked",data:after})}});
    }
    return {saved:plans.length};
  },{isolationLevel:"Serializable",timeout:120000});
}
function zTokens(value:unknown):string[]{
  if(!Array.isArray(value)||!value.length||value.length>500||value.some(t=>typeof t!=="string"||! /^[a-z0-9]+:[a-f0-9]{64}$/.test(t))||new Set(value).size!==value.length)throw Error("Choose valid distinct proposals");
  return value as string[];
}
