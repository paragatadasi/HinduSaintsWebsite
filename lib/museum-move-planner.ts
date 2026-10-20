import {createHash} from "node:crypto";
import {db} from "./db";
import {Prisma} from "./generated/prisma/client";
import {readVrindavanWorkingData} from "./vrindavan-working-data";
import {readVrindavanMuseumInventory} from "./vrindavan-museum-inventory";
import {buildMuseumView} from "./museum-proposals";
import {MuseumConflict} from "./museum-service";
import {writeMuseumArrangement} from "./museum-arrangement";
import {arrangementInput} from "./museum-arrangement-domain";
import {photoSaintsInVitrines,plannerPhotoInput,plannerAssignmentInput,plannerCompletionInput,plannerConfirmation,vitrineNumber,type PlannerData,type PlannerConfirmation} from "./museum-move-planner-domain";

const museumId="museum-vrindavan";
// Read/mutation callers enforce access_museum + full catalog, and manage_museum for writes.
async function context(tx:Prisma.TransactionClient){
 const [working,inventory,setup]=await Promise.all([
  readVrindavanWorkingData(tx),readVrindavanMuseumInventory({},tx),
  tx.museumPlanningSetup.findUnique({where:{museumId}})
 ]);
 const revision=createHash("sha256").update(JSON.stringify({
  arrangements:working.placements.map(p=>[p.id,p.arrangement?.revision]).sort(),
  inventory:inventory.entries.map(e=>[e.observationId,e.saintIds,e.displayText,e.positionText]),
  setup:setup?.version??0
 })).digest("hex");
 const confirmations=await tx.auditEvent.findMany({where:{entityType:"MuseumArrangement",action:{in:["museum.arrangement.updated","museum.move.confirmed"]},
  entityId:{in:working.placements.map(p=>p.id)},afterJson:{path:["status"],equals:"Implemented"}},orderBy:[{createdAt:"desc"},{id:"desc"}],select:{entityId:true,afterJson:true}});
 const lastConfirmed=new Map<string,PlannerConfirmation>();
 for(const event of confirmations){
  const confirmation=plannerConfirmation(event.afterJson),previous=lastConfirmed.get(event.entityId);
  if(confirmation&&(!previous||confirmation.confirmedAt>previous.confirmedAt||(confirmation.confirmedAt===previous.confirmedAt&&confirmation.note&&!previous.note)))lastConfirmed.set(event.entityId,confirmation);
 }
 return {working,inventory,setup,revision,lastConfirmed};
}
export async function readVrindavanMovePlanner(tx:Prisma.TransactionClient=db):Promise<PlannerData>{
 const {working,inventory,setup,revision,lastConfirmed}=await context(tx);
 const photos=new Set(setup?.photoSaintIds??[]);
 const view=buildMuseumView(working.placements);
 return {revision,photoVitrines:setup?.photoVitrines??[],photosConfigured:!!setup,
  photoUpdatedAt:setup?.updatedAt.toISOString()??null,
  awaitingIdentityReview:inventory.counts.awaitingIdentityReview,
  unmappedLocations:inventory.displays.filter(d=>vitrineNumber(d)===null),
  sections:view.sections.map(s=>({name:s.name,slug:s.slug,idea:s.idea})),
  rows:working.placements.flatMap(p=>p.saintId&&p.arrangement?[{
   id:p.id,saintId:p.saintId,name:p.name,section:p.section,family:p.groupLabel||"",tier:p.tier,needsResearch:p.needsResearch,
   photo:photos.has(p.saintId),status:p.arrangement.status,vitrine:p.arrangement.vitrine,shelf:p.arrangement.shelf,
   revision:p.arrangement.revision,lastConfirmed:lastConfirmed.get(p.id)??null,
   sources:(inventory.entriesBySaintId.get(p.saintId)??[]).map(e=>({id:e.observationId,
    vitrine:e.displayText,shelf:e.positionText,relics:e.relicDescription,quantity:e.quantityText,shared:e.saintIds.length>1}))
  }]:[])};
}
async function transaction<T>(work:(tx:Prisma.TransactionClient)=>Promise<T>){
 try{return await db.$transaction(async tx=>{
  await tx.$queryRaw(Prisma.sql`SELECT true FROM pg_advisory_xact_lock(hashtextextended(${"museum-curator:"+museumId},0))`);
  return work(tx);
 },{isolationLevel:"Serializable",timeout:60000});}
 catch(error){if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==="P2034")throw new MuseumConflict("The plan changed while saving. Reload and try again.");throw error;}
}
export async function saveVrindavanPhotoSetup(raw:unknown,actorId:string){
 const input=plannerPhotoInput.parse(raw);
 return transaction(async tx=>{
  const data=await context(tx);
  if(input.revision!==data.revision)throw new MuseumConflict("The inventory or plan changed. Reload before updating photo saints.");
  // Use current curator-confirmed location where available; otherwise retain source locations.
  const implemented=new Map(data.working.placements.flatMap(p=>{const confirmed=data.lastConfirmed.get(p.id);return confirmed?[[p.saintId!,confirmed.vitrine] as const]:[];}));
  const locations=data.inventory.entries.flatMap(e=>e.saintIds.map(id=>({saintIds:[id],displayText:implemented.has(id)?implemented.get(id)!:e.displayText})));
  const values={photoVitrines:[...new Set(input.vitrines)].sort((a,b)=>Number(a)-Number(b)),photoSaintIds:photoSaintsInVitrines(locations,input.vitrines),updatedById:actorId};
  const after=await tx.museumPlanningSetup.upsert({where:{museumId},create:{museumId,...values},update:{...values,version:{increment:1}}});
  await tx.auditEvent.create({data:{userId:actorId,action:"museum.planning.photos.saved",entityType:"MuseumPlanningSetup",entityId:museumId,
   beforeJson:data.setup?JSON.parse(JSON.stringify(data.setup)):Prisma.JsonNull,afterJson:JSON.parse(JSON.stringify(after))}});
 });
}
export async function assignVrindavanPlan(raw:unknown,actorId:string){
 const input=plannerAssignmentInput.parse(raw);
 return transaction(async tx=>{
  const data=await context(tx);
  if(input.revision!==data.revision)throw new MuseumConflict("The plan or proposals changed. Reload before assigning these saints.");
  const ids=[...new Set(input.placementIds)];
  const rows=ids.map(id=>data.working.placements.find(p=>p.id===id));
  if(rows.some(row=>!row?.saintId||!row.arrangement||row.section==="Needs section proposal"))throw new MuseumConflict("Choose a section proposal for each selected saint first.");
  if(!input.replaceExisting&&rows.some(row=>row!.arrangement!.status!=="Proposed"))throw new MuseumConflict("Some selected saints already have a plan or implemented arrangement. Confirm replacement, or select only unplanned saints.");
  for(const row of rows){
   const inputRow=arrangementInput.parse({placementId:row!.id,revision:row!.arrangement!.revision,familyKey:row!.familyId,status:"Planned",vitrine:input.vitrine,shelf:input.shelf});
   await writeMuseumArrangement(tx,museumId,row!,inputRow,actorId);
  }
  return ids.length;
 });
}
export async function completeVrindavanPlan(raw:unknown,actorId:string){
 const input=plannerCompletionInput.parse(raw);
 return transaction(async tx=>{
  const data=await context(tx),row=data.working.placements.find(p=>p.id===input.placementId);
  if(!row?.saintId||!row.arrangement||row.arrangement.revision!==input.revision||row.arrangement.status!=="Planned"||vitrineNumber(row.arrangement.vitrine)===null)
   throw new MuseumConflict("This destination or proposal changed. Reload and review the current plan before confirming.");
  const entries=data.inventory.entriesBySaintId.get(row.saintId)??[];
  const expected=entries.map(entry=>entry.observationId).sort(),checked=[...new Set(input.checkedSourceIds)].sort();
  if(JSON.stringify(expected)!==JSON.stringify(checked))throw new MuseumConflict("Check every listed inventory entry before confirming this saint's arrangement.");
  await writeMuseumArrangement(tx,museumId,row,arrangementInput.parse({placementId:row.id,revision:row.arrangement.revision,familyKey:row.familyId,
   status:"Implemented",vitrine:row.arrangement.vitrine,shelf:input.shelf,physicalConfirmation:"yes",inventoryAcknowledged:"yes"}),actorId);
  await tx.auditEvent.create({data:{userId:actorId,action:"museum.move.confirmed",entityType:"MuseumArrangement",entityId:row.id,
   afterJson:{museumId,status:"Implemented",confirmedAt:new Date().toISOString(),saintId:row.saintId,proposalRevision:row.arrangement.proposalRevision,vitrine:row.arrangement.vitrine,shelf:input.shelf,note:input.note,
    checkedSourceIds:expected,inventoryCompleteness:"unverified",scope:"saint_arrangement"}}});
 });
}
