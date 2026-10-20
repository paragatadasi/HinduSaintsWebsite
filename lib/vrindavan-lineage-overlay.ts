import {z} from "zod";
import {createHash} from "node:crypto";
import type {Prisma} from "./generated/prisma/client";
import type {readBaseVrindavanWorkingData} from "./vrindavan-working-data";
import {arrangementControl,familyArrangementControl} from "./museum-arrangement-domain";
import {LINEAGE_QUEUE,LINEAGE_REGIONS,LINEAGE_SUPPLEMENT,isLineageTarget} from "./vrindavan-lineage-catalogue";
export const lineageRecordSchema=z.object({policyVersion:z.string(),saintId:z.string(),afterSection:z.string().refine(isLineageTarget),tier:z.enum(["Featured","Secondary","Tertiary"]),familyKey:z.string(),familyLabel:z.string(),originalSubgroups:z.array(z.string()),mappedAlternatives:z.array(z.string()),basis:z.string()}).passthrough();
export async function overlayVrindavanLineage(base:Awaited<ReturnType<typeof readBaseVrindavanWorkingData>>,client:Prisma.TransactionClient){
 const records=await client.externalRecord.findMany({where:{sourceType:"vrindavan_lineage_proposal",entityType:"Saint",entityId:{in:base.placements.flatMap(p=>p.saintId?[p.saintId]:[])}},orderBy:[{importedAt:"desc"},{id:"desc"}]});
 const overrides=await client.museumCuratorProposal.findMany({where:{museumId:"museum-vrindavan"}});
 const saved=await client.museumArrangement.findMany({where:{museumId:"museum-vrindavan"}});
 const seen=new Set<string>();
 for(const record of records){
  const parsed=lineageRecordSchema.safeParse(record.rawPayloadJson);if(!parsed.success||parsed.data.saintId!==record.entityId||seen.has(parsed.data.saintId))continue;const value=parsed.data;seen.add(value.saintId);
  const row=base.placements.find(p=>p.saintId===value.saintId);if(!row||overrides.some(o=>o.saintId===value.saintId))continue;
  const changedContext=row.familyId!==value.familyKey||row.tier!==value.tier;
  row.section=value.afterSection;row.tier=value.tier;row.familyId=value.familyKey;row.groupLabel=value.familyLabel;row.alternatives=value.mappedAlternatives.filter(s=>s!==row.section);
  row.note+=` Reviewed lineage proposal (${value.policyVersion}). Preserved subgroups: ${value.originalSubgroups.join("; ")}. ${value.basis}.`;
  row.needsResearch ||= changedContext;if(changedContext)row.note+=" Later source family/tier context differs; reviewed proposal retained for reconciliation.";
  row.curatorProposalRevision=createHash("sha256").update(JSON.stringify({base:row.curatorProposalRevision,record:record.id,proposal:value})).digest("hex");
  const previous=saved.find(p=>p.placementId===row.id);row.arrangement=arrangementControl(row,previous,row.curatorProposalRevision);
  if(previous&&["Planned","Implemented"].includes(previous.status)&&previous.proposalRevision!==row.arrangement.proposalRevision){
   // Grouping does not erase recorded exact arrangements or claim a physical move.
   row.arrangement={...row.arrangement,status:previous.status as "Planned"|"Implemented",vitrine:previous.vitrine||"",shelf:previous.shelf||"",confirmedAt:previous.confirmedAt?.toISOString()||null,inventoryAcknowledged:previous.inventoryAcknowledged};
   row.note+=" Existing arrangement retained; curator should review it after section regrouping.";row.needsResearch=true;row.arrangementNeedsReview=true;
  }
 }
 const catalogue=[...LINEAGE_REGIONS,...(base.placements.some(r=>r.section===LINEAGE_SUPPLEMENT.name)?[LINEAGE_SUPPLEMENT]:[]),...base.sections.filter(s=>!isLineageTarget(s.name)&&s.name!==LINEAGE_QUEUE),{name:LINEAGE_QUEUE,slug:"needs-section-proposal"}];
 const sections=[...new Map(catalogue.map(s=>[s.name,s])).values()].map(s=>({...s,count:base.placements.filter(p=>p.section===s.name).length}));
 // Rebuild summaries from effective membership, retaining stable group and placement IDs.
 const groupOptions=[...new Map([...base.groupOptions,...base.placements.filter(r=>r.familyId).map(r=>({key:r.familyId,label:r.groupLabel||r.curatorialFamily||r.familyId}))].map(g=>[g.key,g])).values()];
 const families=groupOptions.flatMap(g=>{
  const members=base.placements.filter(r=>r.familyId===g.key);if(!members.length)return [];
  return [{...g,count:members.length,revision:createHash("sha256").update(JSON.stringify(members.map(r=>[r.id,r.curatorProposalRevision]).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))))).digest("hex"),arrangement:familyArrangementControl(members)}];
 });
 return {...base,sections,families,groupOptions};
}
