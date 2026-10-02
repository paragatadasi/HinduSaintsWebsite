import { z } from "zod";
import { db } from "./db";
import { Prisma } from "./generated/prisma/client";
import { fingerprint, sourceKey } from "./museum-update-domain";
import { SPN_WEBSITE_AIRTABLE_BASE_ID as base } from "./museum-vitrine-source";
import { proposeRelic } from "./museum-relic-proposal";
import { collectionObservationSchema } from "./museum-collection-domain";
const museumId = "museum-spn";
const lock = (tx: Prisma.TransactionClient) => tx.$queryRaw`SELECT pg_advisory_xact_lock(8496220)::text`;
async function context(tx: Prisma.TransactionClient) {
  const [rows, links, saints] = await Promise.all([
    tx.airtableMirrorRecord.findMany({where:{baseId:base,tableIdOrName:{in:["Saints","Relics"]}}}),
    tx.externalRecord.findMany({where:{sourceType:"airtable",externalId:{startsWith:base+":Saints:"}}}),
    tx.saint.findMany({where:{status:{not:"archived"}},select:{id:true}})
  ]);
  const map = (table:string) => rows.filter(r=>r.tableIdOrName===table).map(r=>({id:r.recordId,fields:r.rawFieldsJson as Record<string,unknown>}));
  return { relics:map("Relics"), saints:map("Saints"), links, active:new Set(saints.map(s=>s.id)) };
}
// Callers enforce Source Data + run_imports + manage_museum. The museum is the initial baseline;
// subsequent differences are reviewed, never silently applied to established inventory.
export async function stageMirroredRelics(actorId:string) {
  return db.$transaction(async tx=>{
    await lock(tx);
    if (!await tx.museum.findFirst({where:{id:museumId,archivedAt:null}})) throw Error("SPN is unavailable");
    const c=await context(tx); if(!c.relics.length) throw Error("Refresh the Saints and Relics mirror first");
    let imported=0, pending=0, unchanged=0;
    for(const row of c.relics) {
      const proposal=proposeRelic(row,c.saints,c.links,c.active);
      const key=sourceKey("Relics",row.id);
      const latest=await tx.museumCollectionImport.findFirst({where:{museumId,sourceKey:key},orderBy:[{observedAt:"desc"},{id:"desc"}]});
      if(latest && fingerprint({raw:latest.rawJson,normalized:latest.normalizedJson})===proposal.hash) {unchanged++; continue;}
      if(latest && ["pending","deferred"].includes(latest.status)) await tx.museumCollectionImport.update({where:{id:latest.id},data:{status:"superseded"}});
      let itemId=latest?.itemId ?? null;
      let status="pending";
      if(!itemId && !proposal.blockers.length) {
        const item=await tx.museumCollectionItem.create({data:{catalogMuseumId:museumId,label:proposal.normalized.label,status:"verified",
          saints:{create:proposal.normalized.saintIds.map(saintId=>({saintId}))}}});
        itemId=item.id;
        const l=proposal.normalized.location;
        if(l) {
          const location=await tx.museumLocation.upsert({where:{museumId_code:{museumId,code:l.code}},create:{museumId,...l},update:{}});
          if(location.archivedAt) throw Error("Source location is archived; review before import");
          await tx.museumItemPlacement.create({data:{itemId,locationId:location.id,note:"Initial museum source baseline"}});
        }
        status=proposal.locationIssue?"pending":"imported";
        imported++;
        await tx.auditEvent.create({data:{userId:actorId,action:"museum.relic.baseline",entityType:"MuseumCollectionItem",entityId:itemId,afterJson:{sourceKey:key,label:item.label,saintIds:proposal.normalized.saintIds,location:l}}});
      }
      if(status==="pending") pending++;
      await tx.museumCollectionImport.create({data:{museumId,sourceKey:key,rawJson:proposal.raw as Prisma.InputJsonValue,normalizedJson:proposal.normalized,
        fingerprint:fingerprint({previous:latest?.id,hash:proposal.hash}),itemId,status}});
    }
    await tx.auditEvent.create({data:{userId:actorId,action:"museum.relics.synced",entityType:"Museum",entityId:museumId,afterJson:{read:c.relics.length,imported,pending,unchanged}}});
    return {imported,pending,unchanged};
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,timeout:120000});
}
export const relicDecisionSchema=z.object({
  id:z.string().cuid(), version:z.string(), action:z.enum(["accept","keep","defer","reopen"]), note:z.string().trim().min(1).max(2000),
  item:z.string().max(150).optional(), label:z.string().trim().max(500).optional(), vitrine:z.string().trim().regex(/^$|^[1-9][0-9]{0,5}$/).optional(),
  shelf:z.string().trim().toUpperCase().regex(/^[A-Z0-9]{0,8}$/).optional(), confirm:z.literal("on").optional(), unknown:z.literal("on").optional()
});
// Callers enforce Source Data + manage_museum. No new saints, automatic item splits or merges.
export async function decideRelic(actorId:string,input:z.infer<typeof relicDecisionSchema>) {
  input=relicDecisionSchema.parse(input);
  return db.$transaction(async tx=>{
    await lock(tx);
    const row=await tx.museumCollectionImport.findUniqueOrThrow({where:{id:input.id}});
    if(row.museumId!==museumId || !row.sourceKey.startsWith(sourceKey("Relics",""))) throw Error("Wrong source");
    const version=`${row.status}:${row.reviewedAt?.toISOString() || ""}`;
    if(version!==input.version) throw Error("Review changed");
    const latest=await tx.museumCollectionImport.findFirst({where:{museumId,sourceKey:row.sourceKey},orderBy:[{observedAt:"desc"},{id:"desc"}]});
    if(latest?.id!==row.id) throw Error("Newer source evidence exists");
    const c=await context(tx); const source=c.relics.find(r=>sourceKey("Relics",r.id)===row.sourceKey);
    if(!source) throw Error("Source missing");
    const proposal=proposeRelic(source,c.saints,c.links,c.active);
    if(proposal.hash!==fingerprint({raw:row.rawJson,normalized:row.normalizedJson})) throw Error("Stage current source evidence first");
    let itemId=row.itemId;
    let before:Prisma.InputJsonValue={status:row.status,itemId};
    if(input.action==="accept" || input.action==="keep") {
      if(!["pending","deferred"].includes(row.status)) throw Error("Reopen before another decision");
      const [selected,versionText]= (input.item || "").split(":");
      if(itemId && selected!==itemId) throw Error("An established source-item link cannot be reassigned here");
      const item=selected ? await tx.museumCollectionItem.findFirst({where:{id:selected,catalogMuseumId:museumId,status:{not:"archived"}},include:{placements:{where:{endedAt:null},include:{location:true}},saints:true}}) : null;
      if(selected && (!item || item.version!==Number(versionText))) throw Error("Item changed");
      if(input.action==="keep") {
        if(!item || !itemId) throw Error("No accepted item to keep");
      } else {
        if(input.confirm!=="on" || !input.label || proposal.blockers.length) throw Error("Confirm one physical item and resolve saint identities first");
        if(!input.vitrine && input.unknown!=="on") throw Error("Confirm unknown location explicitly");
        if(input.shelf && !input.vitrine) throw Error("Shelf needs a vitrine");
        if(input.vitrine && input.unknown) throw Error("Choose a location or unknown, not both");
        const normalized=collectionObservationSchema.parse(row.normalizedJson);
        before={status:row.status,itemId:item?.id ?? null,label:item?.label ?? null,placements:item?.placements.map(p=>({id:p.id,locationId:p.locationId})) ?? []};
        let locationId:string|null=null;
        if(input.vitrine) {
          const code=input.vitrine+(input.shelf?"/"+input.shelf:"");
          const location=await tx.museumLocation.upsert({where:{museumId_code:{museumId,code}},create:{museumId,code,label:"Vitrine "+input.vitrine+(input.shelf?" / Shelf "+input.shelf:""),kind:input.shelf?"shelf":"vitrine"},update:{}});
          if(location.archivedAt) throw Error("Location is archived");
          locationId=location.id;
        }
        const updated=item ? await tx.museumCollectionItem.update({where:{id:item.id,version:item.version},data:{label:input.label,status:"verified",version:{increment:1}}})
          : await tx.museumCollectionItem.create({data:{catalogMuseumId:museumId,label:input.label,status:"verified"}});
        itemId=updated.id;
        for(const saintId of normalized.saintIds) await tx.museumItemSaint.upsert({where:{itemId_saintId:{itemId,saintId}},create:{itemId,saintId},update:{}});
        const current=item?.placements[0];
        if((current?.locationId ?? null)!==locationId) {
          if(current) await tx.museumItemPlacement.update({where:{id:current.id},data:{endedAt:new Date()}});
          if(locationId) await tx.museumItemPlacement.create({data:{itemId,locationId,note:input.note}});
        }
      }
    }
    const status={accept:"accepted",keep:"kept",defer:"deferred",reopen:"pending"}[input.action];
    await tx.museumCollectionImport.update({where:{id:row.id},data:{status,itemId,reviewedAt:new Date(),reviewedById:actorId}});
    await tx.auditEvent.create({data:{userId:actorId,action:"museum.relic."+input.action,entityType:"MuseumCollectionImport",entityId:row.id,beforeJson:before,afterJson:{status,itemId,note:input.note,label:input.label ?? null,vitrine:input.vitrine ?? null,shelf:input.shelf ?? null}}});
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,timeout:30000});
}
