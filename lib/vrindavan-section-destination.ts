import {createHash} from "node:crypto";
import {z} from "zod";
import {db} from "./db";
import {Prisma} from "./generated/prisma/client";
import {readVrindavanWorkingData} from "./vrindavan-working-data";
import {readVrindavanMuseumInventory} from "./vrindavan-museum-inventory";
import {sectionDestination,sectionDestinationGuard,type DestinationRow} from "./vrindavan-section-destination-domain";
import {MuseumConflict} from "./museum-service";
import {arrangementInput} from "./museum-arrangement-domain";
import {writeMuseumArrangement} from "./museum-arrangement";
import {flexibleRecords} from "./museum-move-planner-domain";
const museumId="museum-vrindavan";
const json=(value:unknown):Prisma.InputJsonValue=>JSON.parse(JSON.stringify(value));
export async function sectionDestinationContext(tx:Prisma.TransactionClient){
 const [working,savedAreas,inventory]=await Promise.all([readVrindavanWorkingData(tx),tx.museumSectionSpacePlan.findMany({where:{museumId},orderBy:{section:"asc"}}),readVrindavanMuseumInventory({},tx)]);
 const areas=savedAreas.map(area=>({...area,needsReview:flexibleRecords(area.flexiblePlacements).some(member=>{const row=working.placements.find(row=>row.id===member.id);return !row||row.arrangement?.status==="Proposed"&&(row.section!==area.section||row.arrangement.revision!==member.revision);})}));
 const placements=working.placements.map(row=>({...row,flexibleVitrines:areas.filter(area=>!area.needsReview&&area.section===row.section&&flexibleRecords(area.flexiblePlacements).some(member=>member.id===row.id&&member.revision===row.arrangement?.revision)).flatMap(area=>area.vitrines)}));
 return {working:{...working,placements},areas,shared:inventory.entries.filter(entry=>entry.saintIds.length>1).map(entry=>({id:entry.observationId,saintIds:entry.saintIds})),snapshotHash:inventory.snapshotHash};
}
export type SectionDestinationContext=Awaited<ReturnType<typeof sectionDestinationContext>>;
export function previewSectionDestinations(context:SectionDestinationContext,moving:DestinationRow[],section:string,groupKey?:string){
 const blockedReason=sectionDestinationGuard(context.working.placements,moving,section,context.areas,context.shared,groupKey);
 const rows=moving.filter(row=>row.section!==section).map(row=>sectionDestination(row,section,context.areas));
 const revision=createHash("sha256").update(JSON.stringify({section,groupKey,rows,moving:moving.map(row=>row.id),areas:context.areas,shared:context.shared,snapshot:context.snapshotHash,working:context.working.placements.map(row=>[row.id,row.saintId,row.section,row.familyId,row.curatorProposalRevision,row.arrangement?.revision])})).digest("hex");
 return {revision,rows,...(blockedReason?{blockedReason}:{})};
}
export const sectionDestinationPreviewInput=z.object({saintId:z.string().max(200).optional(),familyKey:z.string().max(300).optional(),groupKey:z.string().max(300).optional(),section:z.string().min(1).max(200)}).strict().refine(v=>!!v.saintId!==!!v.familyKey,"Choose one saint or display family.");
export async function readVrindavanSectionDestinationPreview(raw:unknown){
 const input=sectionDestinationPreviewInput.parse(raw),context=await sectionDestinationContext(db);
 if(!context.working.sections.some(section=>section.name===input.section&&section.slug!=="needs-section-proposal"))throw new MuseumConflict("Choose an available museum section.");
 const moving=context.working.placements.filter(row=>input.saintId?row.saintId===input.saintId:row.familyId===input.familyKey);
 if(!moving.length)throw new MuseumConflict("This saint or family is no longer available.");
 return previewSectionDestinations(context,moving,input.section,input.groupKey);
}
export async function synchronizeSectionDestinations(tx:Prisma.TransactionClient,before:DestinationRow[],section:string,actorId:string,context:SectionDestinationContext){
 const changed=before.filter(row=>row.section!==section);if(!changed.length)return;
 const refreshed=await readVrindavanWorkingData(tx);
 const ids=new Set(changed.map(row=>row.id));
 const flexible=new Map<string,{id:string;revision:string}[]>();
 for(const old of changed){
  const row=refreshed.placements.find(row=>row.id===old.id);if(!row?.arrangement||row.section!==section)throw new MuseumConflict("The destination could not be refreshed. Reload before saving.");
  const target=sectionDestination(old,section,context.areas);
  await writeMuseumArrangement(tx,museumId,row,arrangementInput.parse({placementId:row.id,revision:row.arrangement.revision,familyKey:row.familyId||"",status:target.mode==="exact"?"Planned":"Proposed",vitrine:target.mode==="exact"?target.vitrines[0]:"",shelf:target.shelf}),actorId);
  if(target.mode==="flexible")flexible.set(row.id,[]);
 }
 // Arrangement versions changed; flexible members must bind to the final revision.
 const final=flexible.size?await readVrindavanWorkingData(tx):null;
 for(const area of context.areas){
  const old=flexibleRecords(area.flexiblePlacements),next=old.filter(member=>!ids.has(member.id));
  if(area.section===section)for(const row of final?.placements??[])if(flexible.has(row.id))next.push({id:row.id,revision:row.arrangement!.revision});
  if(JSON.stringify(old)===JSON.stringify(next))continue;
  const after=await tx.museumSectionSpacePlan.update({where:{museumId_section:{museumId,section:area.section}},data:{flexiblePlacements:json(next),version:{increment:1},updatedById:actorId}});
  await tx.auditEvent.create({data:{userId:actorId,action:"museum.section_destination.synchronized",entityType:"MuseumSectionSpacePlan",entityId:museumId+":"+area.section,beforeJson:json(area),afterJson:json(after)}});
 }
}