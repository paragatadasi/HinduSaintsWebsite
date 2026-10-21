import {z} from "zod";
import {db} from "./db";
import {Prisma} from "./generated/prisma/client";
import {readVrindavanWorkingData} from "./vrindavan-working-data";
import {MuseumConflict} from "./museum-service";
import {arrangementInput,familyArrangementControl} from "./museum-arrangement-domain";
import {writeMuseumArrangement} from "./museum-arrangement";
import {retainPlannedDestination} from "./museum-proposal-edit-domain";
import {sectionDestinationContext,previewSectionDestinations,synchronizeSectionDestinations} from "./vrindavan-section-destination";
const museumId="museum-vrindavan";
export const vrindavanProposalInput=z.object({saintId:z.string().min(1).max(200),revision:z.string().regex(/^[a-f0-9]{64}$/),section:z.string().trim().min(1).max(200),tier:z.enum(["Featured","Secondary","Tertiary"]),groupKey:z.string().max(300).default(""),destinationRevision:z.string().regex(/^[a-f0-9]{64}$/).optional()});
export const vrindavanFamilyInput=z.object({familyKey:z.string().min(1).max(300),revision:z.string().regex(/^[a-f0-9]{64}$/),section:z.string().min(1).max(200),destinationRevision:z.string().regex(/^[a-f0-9]{64}$/).optional()});
// One museum-wide edit lock covers family membership, individual edits and bulk
// planning. Other museums and physical inventory remain independent.
async function transaction<T>(work:(tx:Prisma.TransactionClient)=>Promise<T>) {
 try{return await db.$transaction(async tx=>{await tx.$queryRaw(Prisma.sql`SELECT true FROM pg_advisory_xact_lock(hashtextextended(${"museum-curator:"+museumId},0))`);return work(tx);},{isolationLevel:"Serializable",timeout:60000});}
 catch(error){if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==="P2034")throw new MuseumConflict("The inventory or proposal changed while saving. Reload and try again.");throw error;}
}
async function writeProposal(tx:Prisma.TransactionClient,input:{saintId:string;section:string;tier:string;groupKey:string;groupLabel:string},actorId:string) {
 const key={museumId,saintId:input.saintId};const before=await tx.museumCuratorProposal.findUnique({where:{museumId_saintId:key}});
 const after=await tx.museumCuratorProposal.upsert({where:{museumId_saintId:key},create:{...key,...input,updatedById:actorId},update:{...input,version:{increment:1},updatedById:actorId}});
 await tx.auditEvent.create({data:{userId:actorId,action:"museum.curator_proposal.saved",entityType:"MuseumCuratorProposal",entityId:museumId+":"+input.saintId,beforeJson:before?JSON.parse(JSON.stringify(before)):Prisma.JsonNull,afterJson:JSON.parse(JSON.stringify(after))}});
}
export async function saveVrindavanProposal(raw:unknown,actorId:string,preservePlanned=false) {
 const input=vrindavanProposalInput.parse(raw);return transaction(async tx=>{
 const data=await readVrindavanWorkingData(tx);const row=data.placements.find(p=>p.saintId===input.saintId);
 if(!row||row.curatorProposalRevision!==input.revision)throw new MuseumConflict("This saint's proposal or source identity changed. Reload before saving.");
 if(!data.sections.some(s=>s.name===input.section&&s.slug!=="needs-section-proposal"))throw new MuseumConflict("Choose an available museum section.");
 const group=input.groupKey?data.groupOptions.find(g=>g.key===input.groupKey):null;if(input.groupKey&&!group)throw new MuseumConflict("This display family is no longer available.");
 if(row.section===input.section&&row.tier===input.tier&&(row.familyId||"")===input.groupKey)return row.name;
 const destinationContext=row.section!==input.section?await sectionDestinationContext(tx):null;
 if(destinationContext){const preview=previewSectionDestinations(destinationContext,[row],input.section,input.groupKey);if(preview.blockedReason)throw new MuseumConflict(preview.blockedReason);if(input.destinationRevision!==preview.revision)throw new MuseumConflict("Review the new destination before saving; the section area or proposal may have changed.");}
 await writeProposal(tx,{saintId:input.saintId,section:input.section,tier:input.tier,groupKey:group?.key||"",groupLabel:group?.label||""},actorId);
 if(destinationContext)await synchronizeSectionDestinations(tx,[row],input.section,actorId,destinationContext);
 else if(preservePlanned&&retainPlannedDestination(row.arrangement?.status,row.section,input.section)){
  const refreshed=(await readVrindavanWorkingData(tx)).placements.find(p=>p.saintId===input.saintId)!;
  await writeMuseumArrangement(tx,museumId,refreshed,arrangementInput.parse({placementId:refreshed.id,revision:refreshed.arrangement!.revision,familyKey:refreshed.familyId||"",status:"Planned",vitrine:row.arrangement!.vitrine,shelf:row.arrangement!.shelf}),actorId);
 }
 return row.name;
 });
}
export async function moveVrindavanFamily(raw:unknown,actorId:string) {
 const input=vrindavanFamilyInput.parse(raw);return transaction(async tx=>{
 const data=await readVrindavanWorkingData(tx);const family=data.families.find(f=>f.key===input.familyKey);
 if(!family||family.revision!==input.revision)throw new MuseumConflict("This family's proposals or membership changed. Reload before moving it.");
 if(!data.sections.some(s=>s.name===input.section&&s.slug!=="needs-section-proposal"))throw new MuseumConflict("Choose an available museum section.");
 const members=data.placements.filter(p=>p.familyId===family.key);
 const destinationContext=members.some(row=>row.section!==input.section)?await sectionDestinationContext(tx):null;
 if(destinationContext){const preview=previewSectionDestinations(destinationContext,members,input.section);if(preview.blockedReason)throw new MuseumConflict(preview.blockedReason);if(input.destinationRevision!==preview.revision)throw new MuseumConflict("Review the family destination before saving; its section area or membership may have changed.");}
 for(const row of members.filter(row=>row.section!==input.section))await writeProposal(tx,{saintId:row.saintId!,section:input.section,tier:row.tier,groupKey:family.key,groupLabel:family.label},actorId);
 if(destinationContext)await synchronizeSectionDestinations(tx,members,input.section,actorId,destinationContext);
 return data.sections.find(s=>s.name===input.section)!.slug;
 });
}
export async function saveVrindavanArrangement(raw:unknown,actorId:string,family=false) {
 const input=arrangementInput.parse(raw);if(family&&!input.familyKey)throw new MuseumConflict("Choose a display family.");return transaction(async tx=>{
 const data=await readVrindavanWorkingData(tx);const rows=family?data.placements.filter(p=>p.familyId===input.familyKey):data.placements.filter(p=>p.id===input.placementId);
 const control=family?familyArrangementControl(rows):rows[0]?.arrangement;
 if(!control||!rows.length||control.revision!==input.revision)throw new MuseumConflict("This arrangement or membership changed. Reload before saving.");
 if(rows.some(r=>r.section==="Needs section proposal"))throw new MuseumConflict("Choose a section proposal for each saint before planning the arrangement.");
 for(const row of rows)await writeMuseumArrangement(tx,museumId,row,input,actorId);
 return rows[0].name;
 });
}
