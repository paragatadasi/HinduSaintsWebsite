import {assertVrindavanHierarchyApplyReady} from "./vrindavan-lineage-catalogue";
import {createHash} from "node:crypto";
import {z} from "zod";
import {db} from "./db";
import {Prisma} from "./generated/prisma/client";
import {readVrindavanCurrentState} from "./vrindavan-current-state";
import {buildLineagePreview,LINEAGE_RULES,LINEAGE_VERSION,type ReviewedFamilyAnchor} from "./vrindavan-lineage-domain";
import {MuseumConflict} from "./museum-service";
const json=(v:unknown)=>JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue;
const digest=(v:unknown)=>createHash("sha256").update(JSON.stringify(v)).digest("hex");
const anchorSchema=z.object({familyKey:z.string().min(1).max(300),ruleGroup:z.string().refine(v=>LINEAGE_RULES.some(r=>r.group===v)),memberIds:z.array(z.string()).min(1),evidence:z.string().trim().min(1).max(4000)});
export async function readVrindavanLineageReview(client:Prisma.TransactionClient=db){
 const state=await readVrindavanCurrentState(client);
 const records=await client.externalRecord.findMany({where:{sourceType:"vrindavan_lineage_family_anchor"},orderBy:[{importedAt:"desc"},{id:"desc"}]});
 const anchors:ReviewedFamilyAnchor[]=[];const seen=new Set<string>();
 for(const record of records){const value=anchorSchema.safeParse(record.rawPayloadJson);if(value.success&&!seen.has(value.data.familyKey)){seen.add(value.data.familyKey);anchors.push(value.data);}}
 const preview=buildLineagePreview(state.rows.map(r=>({saintId:r.saintId,name:r.name,section:r.current.section,tier:r.current.tier,familyKey:r.current.familyKey,familyLabel:r.current.familyLabel||"",subgroups:r.originalSubgroups.length?r.originalSubgroups:r.inheritedSubgroups,alternatives:r.current.alternatives,curatorOverride:Boolean(r.curatorOverride)})),anchors);
 // Guard every relevant source, membership, override and arrangement version.
 return {...preview,rows:preview.rows.map(r=>({...r,afterSection:r.beforeSection,proposedRegionalParent:r.proposedSection})),revision:digest({state:state.revision,preview:preview.revision}),stateRevision:state.revision,summary:state.summary,anchors,currentFamilies:state.families,applyEnabled:false,hierarchy:"region > existing subsection > reviewed display family > saints"};
}
async function edit<T>(work:(tx:Prisma.TransactionClient)=>Promise<T>){
 return db.$transaction(async tx=>{await tx.$queryRaw(Prisma.sql`SELECT true FROM pg_advisory_xact_lock(hashtextextended(${"museum-curator:museum-vrindavan"},0))`);return work(tx);},{isolationLevel:"Serializable",timeout:60000});
}
export async function saveVrindavanLineageAnchor(actorId:string,raw:unknown){
 const input=z.object({revision:z.string().regex(/^[a-f0-9]{64}$/),familyKey:z.string().min(1),ruleGroup:z.string(),evidence:z.string().trim().min(1).max(4000),confirm:z.literal("on")}).parse(raw);
 return edit(async tx=>{
  const review=await readVrindavanLineageReview(tx);if(review.revision!==input.revision)throw new MuseumConflict("The family or proposals changed. Reload before confirming.");
  const family=review.currentFamilies.find(f=>f.key===input.familyKey);if(!family)throw new MuseumConflict("Family no longer available.");
  const payload=anchorSchema.parse({...input,memberIds:family.memberIds});
  const record=await tx.externalRecord.create({data:{sourceType:"vrindavan_lineage_family_anchor",externalId:digest({payload,revision:review.revision}),entityType:"Museum",entityId:"museum-vrindavan",rawPayloadJson:json(payload)}});
  await tx.auditEvent.create({data:{userId:actorId,action:"museum.lineage_family_anchor.reviewed",entityType:"ExternalRecord",entityId:record.id,afterJson:json(payload)}});
 });
}
// The v2 region-only writer is retired. Never execute old forms or old revisions.
export async function applyVrindavanLineage(_actorId:string,_raw:unknown):Promise<{updated:number}>{
 assertVrindavanHierarchyApplyReady();
}
