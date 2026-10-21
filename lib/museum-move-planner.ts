import {readVrindavanTreeAvailability} from "./museum-tree-availability-service";
import {createHash} from "node:crypto";
import {planningVitrineAllowed,requiredPlanningVitrine} from "./museum-planning-constraints";
import {z} from "zod";
import {buildSuggestedPlan} from "./museum-suggested-plan";
import suggestionGuide from "../data/museum/vrindavan-suggested-plan.json";
import {db} from "./db";
import {Prisma} from "./generated/prisma/client";
import {readVrindavanWorkingData} from "./vrindavan-working-data";
import {readVrindavanMuseumInventory} from "./vrindavan-museum-inventory";
import {buildMuseumView} from "./museum-proposals";
import {MuseumConflict} from "./museum-service";
import {writeMuseumArrangement} from "./museum-arrangement";
import {arrangementInput} from "./museum-arrangement-domain";
import {photoSaintsInVitrines,plannerPhotoInput,plannerAssignmentInput,plannerCompletionInput,plannerConfirmation,plannerAreaInput,plannerFlexibleInput,flexibleRecords,flexibleDestinations,vitrineNumber,type PlannerData,type PlannerConfirmation} from "./museum-move-planner-domain";

const museumId="museum-vrindavan";
const activeSuggestionGuide={...suggestionGuide,version:createHash("sha256").update(JSON.stringify(suggestionGuide)).digest("hex")};
// Read/mutation callers enforce access_museum + full catalog, and manage_museum for writes.
async function context(tx:Prisma.TransactionClient){
 const [working,inventory,setup,spacePlans,affiliations]=await Promise.all([
  readVrindavanWorkingData(tx),readVrindavanMuseumInventory({},tx),
  tx.museumPlanningSetup.findUnique({where:{museumId}}),
  tx.museumSectionSpacePlan.findMany({where:{museumId},orderBy:{section:"asc"}}),
  tx.saintTradition.findMany({where:{isPrimary:true,tradition:{status:{not:"archived"}}},select:{saintId:true,traditionId:true},orderBy:{id:"asc"}})
 ]);
 const revision=createHash("sha256").update(JSON.stringify({
  arrangements:working.placements.map(p=>[p.id,p.arrangement?.revision]).sort(),
  inventory:inventory.entries.map(e=>[e.observationId,e.saintIds,e.displayText,e.positionText,e.packaging]),
  setup:setup?.version??0,areas:spacePlans.map(area=>[area.section,area.version]),affiliations
 })).digest("hex");
 const confirmations=await tx.auditEvent.findMany({where:{entityType:"MuseumArrangement",action:{in:["museum.arrangement.updated","museum.move.confirmed"]},
  entityId:{in:working.placements.map(p=>p.id)},afterJson:{path:["status"],equals:"Implemented"}},orderBy:[{createdAt:"desc"},{id:"desc"}],select:{entityId:true,afterJson:true}});
 const lastConfirmed=new Map<string,PlannerConfirmation>();
 for(const event of confirmations){
  const confirmation=plannerConfirmation(event.afterJson),previous=lastConfirmed.get(event.entityId);
  if(confirmation&&(!previous||confirmation.confirmedAt>previous.confirmedAt||(confirmation.confirmedAt===previous.confirmedAt&&confirmation.note&&!previous.note)))lastConfirmed.set(event.entityId,confirmation);
 }
 return {working,inventory,setup,revision,lastConfirmed,affiliations,areas:spacePlans.map(area=>({version:area.version,section:area.section,vitrines:area.vitrines,placements:flexibleRecords(area.flexiblePlacements)}))};
}
export async function readVrindavanMovePlanner(tx:Prisma.TransactionClient=db):Promise<PlannerData>{
 const {working,inventory,setup,revision,lastConfirmed,areas,affiliations}=await context(tx);
 const suggestion=await latestSuggestion(tx);
 const photos=new Set(setup?.photoSaintIds??[]);
 const view=buildMuseumView(working.placements);
 const hasTree=await readVrindavanTreeAvailability(working.placements.flatMap(p=>p.familyId?[p.familyId]:[]),tx);
 return {revision,areas,suggestionId:suggestion?.action==="museum.plan.suggested"?suggestion.id:null,photoVitrines:setup?.photoVitrines??[],photosConfigured:!!setup,
  photoUpdatedAt:setup?.updatedAt.toISOString()??null,
  awaitingIdentityReview:inventory.counts.awaitingIdentityReview,
  unmappedLocations:inventory.displays.filter(d=>vitrineNumber(d)===null),
  sections:working.sections.map(s=>({name:s.name,slug:s.slug,idea:view.sections.find(summary=>summary.name===s.name)?.idea??""})),
  rows:working.placements.flatMap(p=>p.saintId&&p.arrangement?[{
   hasTree:hasTree(p.saintId,p.familyId),id:p.id,saintId:p.saintId,name:p.name,section:p.section,family:p.groupLabel||"",tier:p.tier,needsResearch:p.needsResearch,
   traditionIds:affiliations.filter(a=>a.saintId===p.saintId).map(a=>a.traditionId),
   arrangementNeedsReview:"arrangementNeedsReview" in p&&p.arrangementNeedsReview===true,
   familyKey:p.familyId||undefined,flexibleVitrines:flexibleDestinations({id:p.id,section:p.section,status:p.arrangement.status,revision:p.arrangement.revision},areas),
   photo:photos.has(p.saintId),status:p.arrangement.status,vitrine:p.arrangement.vitrine,shelf:p.arrangement.shelf,
   revision:p.arrangement.revision,lastConfirmed:lastConfirmed.get(p.id)??null,
   sources:(inventory.entriesBySaintId.get(p.saintId)??[]).map(e=>({id:e.observationId,
    vitrine:e.displayText,shelf:e.positionText,relics:e.relicDescription,quantity:e.quantityText,sourceShelfPosition:e.sourceShelfPosition,shared:e.saintIds.length>1,packagingText:e.packagingText,packaging:e.packaging}))
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
  if(!row?.saintId||!row.arrangement||row.arrangement.revision!==input.revision)
   throw new MuseumConflict("This destination or proposal changed. Reload and review the current plan before confirming.");
  const flexible=flexibleDestinations({id:row.id,section:row.section,status:row.arrangement.status,revision:row.arrangement.revision},data.areas);
  const destination=flexible.length?(input.vitrine??""):row.arrangement.vitrine;
  if(flexible.length?(input.planRevision!==data.revision||!destination||!flexible.includes(destination)):(row.arrangement.status!=="Planned"||vitrineNumber(destination)===null))
   throw new MuseumConflict("Choose a current destination in this section's saved area. Reload if the plan changed.");
  const entries=data.inventory.entriesBySaintId.get(row.saintId)??[];
  const expected=entries.map(entry=>entry.observationId).sort(),checked=[...new Set(input.checkedSourceIds)].sort();
  if(JSON.stringify(expected)!==JSON.stringify(checked))throw new MuseumConflict("Check every listed inventory entry before confirming this saint's arrangement.");
  await writeMuseumArrangement(tx,museumId,row,arrangementInput.parse({placementId:row.id,revision:row.arrangement.revision,familyKey:row.familyId,
   status:"Implemented",vitrine:destination,shelf:input.shelf,physicalConfirmation:"yes",inventoryAcknowledged:"yes"}),actorId);
  await tx.auditEvent.create({data:{userId:actorId,action:"museum.move.confirmed",entityType:"MuseumArrangement",entityId:row.id,
   afterJson:{museumId,status:"Implemented",confirmedAt:new Date().toISOString(),saintId:row.saintId,proposalRevision:row.arrangement.proposalRevision,vitrine:destination,shelf:input.shelf,note:input.note,
    checkedSourceIds:expected,inventoryCompleteness:"unverified",scope:"saint_arrangement"}}});
 });
}

export async function saveVrindavanSectionArea(raw:unknown,actorId:string){
 const input=plannerAreaInput.parse(raw);
 const required=requiredPlanningVitrine(museumId,input.section);
 if(required && (input.vitrines.length!==1 || input.vitrines[0]!==required))throw new MuseumConflict("The Sikh section must keep Vitrine 11 as its area because a relic is permanently fixed there.");
 return transaction(async tx=>{
  const data=await context(tx);
  if(input.revision!==data.revision)throw new MuseumConflict("The plan changed. Reload before changing a section area.");
  if(input.section==="Needs section proposal"||!data.working.placements.some(row=>row.section===input.section))throw new MuseumConflict("Choose a current section proposal first.");
  const before=await tx.museumSectionSpacePlan.findUnique({where:{museumId_section:{museumId,section:input.section}}});
  if((before?.version??0)!==input.areaVersion)throw new MuseumConflict("This section area changed since you began editing. Discard the area changes and review the saved area before trying again.");
  const values={vitrines:[...new Set(input.vitrines)].sort((a,b)=>Number(a)-Number(b)),updatedById:actorId,...(!input.vitrines.length?{flexiblePlacements:[]}: {})};
  const after=await tx.museumSectionSpacePlan.upsert({where:{museumId_section:{museumId,section:input.section}},create:{museumId,section:input.section,...values},update:{...values,version:{increment:1}}});
  await tx.auditEvent.create({data:{userId:actorId,action:"museum.section.area.saved",entityType:"MuseumSectionSpacePlan",entityId:input.section,beforeJson:before?JSON.parse(JSON.stringify(before)):Prisma.JsonNull,afterJson:JSON.parse(JSON.stringify(after))}});
 });
}
export async function saveVrindavanFlexiblePlan(raw:unknown,actorId:string){
 const input=plannerFlexibleInput.parse(raw);
 return transaction(async tx=>{
  const data=await context(tx);
  if(input.revision!==data.revision)throw new MuseumConflict("The plan changed. Reload before updating flexible placements.");
  const before=await tx.museumSectionSpacePlan.findUnique({where:{museumId_section:{museumId,section:input.section}}});
  if(!before?.vitrines.length)throw new MuseumConflict("Save at least one vitrine for this section first.");
  if(before.vitrines.some(v=>!planningVitrineAllowed(museumId,input.section,v)))throw new MuseumConflict("Update this section's area to the fixed Vitrine 11 before assigning saints.");
  const ids=new Set(input.placementIds),rows=data.working.placements.filter(row=>ids.has(row.id));
  if(rows.length!==ids.size||rows.some(row=>row.section!==input.section||!row.saintId||!row.arrangement||(!input.remove&&row.arrangement.status!=="Proposed")))throw new MuseumConflict("Choose unassigned saints from this section. Existing individual destinations are kept.");
  const retained=flexibleRecords(before.flexiblePlacements).filter(p=>!ids.has(p.id));
  const after=await tx.museumSectionSpacePlan.update({where:{museumId_section:{museumId,section:input.section}},data:{flexiblePlacements:[...retained,...(input.remove?[]:rows.map(row=>({id:row.id,revision:row.arrangement!.revision})))],version:{increment:1},updatedById:actorId}});
  await tx.auditEvent.create({data:{userId:actorId,action:"museum.section.flexible.saved",entityType:"MuseumSectionSpacePlan",entityId:input.section,beforeJson:JSON.parse(JSON.stringify(before)),afterJson:JSON.parse(JSON.stringify(after))}});
 });
}

function latestSuggestion(tx:Prisma.TransactionClient){
 return tx.auditEvent.findFirst({where:{entityType:"MuseumSuggestedPlan",entityId:museumId},orderBy:[{createdAt:"desc"},{id:"desc"}]});
}
const suggestionInput=z.object({revision:z.string().regex(/^[a-f0-9]{64}$/),version:z.string().max(100)});
const suggestionUndo=z.object({
 arrangements:z.array(z.object({id:z.string(),version:z.number().int(),proposalRevision:z.string(),vitrine:z.string()})),
 areas:z.array(z.object({section:z.string(),version:z.number().int()}))
});
export async function previewVrindavanSuggestedPlan(){
 return buildSuggestedPlan(await readVrindavanMovePlanner(),activeSuggestionGuide);
}
export async function applyVrindavanSuggestedPlan(raw:unknown,actorId:string){
 const input=suggestionInput.parse(raw);
 return transaction(async tx=>{
  const data=await readVrindavanMovePlanner(tx);
  if(input.revision!==data.revision||input.version!==activeSuggestionGuide.version)throw new MuseumConflict("The plan, inventory, or suggestion changed. Open a fresh preview.");
  if(data.suggestionId)throw new MuseumConflict("A suggested plan is already loaded. Clear its remaining suggestions before creating another.");
  const plan=buildSuggestedPlan(data,activeSuggestionGuide);
  if(!plan.assignments.length)throw new MuseumConflict("There are no unplanned groups with a suitable shared destination.");
  const working=await readVrindavanWorkingData(tx);
  const arrangements:{id:string;version:number;proposalRevision:string;vitrine:string}[]=[];
  const areas:{section:string;version:number}[]=[];
  for(const item of plan.assignments){
   const row=working.placements.find(p=>p.id===item.id)!;
   // The generator excludes existing plans and previously confirmed physical placements.
   await writeMuseumArrangement(tx,museumId,row,arrangementInput.parse({placementId:row.id,revision:row.arrangement!.revision,familyKey:row.familyId||"",status:"Planned",vitrine:item.vitrine}),actorId);
   const after=await tx.museumArrangement.findUniqueOrThrow({where:{museumId_placementId:{museumId,placementId:row.id}}});
   arrangements.push({id:row.id,version:after.version,proposalRevision:after.proposalRevision,vitrine:item.vitrine});
  }
  for(const area of plan.areas.filter(a=>!a.preserved&&plan.groups.some(g=>g.sections.includes(a.section)))){
   // Empty existing areas are versioned too; clearing returns them to the empty state.
   const after=await tx.museumSectionSpacePlan.upsert({where:{museumId_section:{museumId,section:area.section}},
    create:{museumId,section:area.section,vitrines:area.vitrines,updatedById:actorId},
    update:{vitrines:area.vitrines,version:{increment:1},updatedById:actorId}});
   areas.push({section:area.section,version:after.version});
  }
  await tx.auditEvent.create({data:{userId:actorId,action:"museum.plan.suggested",entityType:"MuseumSuggestedPlan",entityId:museumId,
   afterJson:{version:plan.version,guideVersion:suggestionGuide.version,arrangements,areas,upperDisplayPreference:"Primary and secondary saints near the top; shelves remain undecided."}}});
 });
}
export async function clearVrindavanSuggestedPlan(raw:unknown,actorId:string){
 const input=z.object({revision:z.string().regex(/^[a-f0-9]{64}$/),suggestionId:z.string().min(1).max(200)}).parse(raw);
 return transaction(async tx=>{
  const data=await context(tx);
  if(input.revision!==data.revision)throw new MuseumConflict("The plan changed. Reload before clearing suggestions.");
  const event=await latestSuggestion(tx);
  if(event?.id!==input.suggestionId||event.action!=="museum.plan.suggested")throw new MuseumConflict("This suggested plan is no longer active. Reload to see the current plan.");
  const undo=suggestionUndo.parse(event.afterJson);
  let cleared=0;
  for(const item of undo.arrangements){
   const current=await tx.museumArrangement.findUnique({where:{museumId_placementId:{museumId,placementId:item.id}}});
   const row=data.working.placements.find(p=>p.id===item.id);
   // Never undo a later edit, changed proposal, or implementation—even if its location matches.
   if(!row?.arrangement||current?.version!==item.version||current.status!=="Planned"||row.arrangement.proposalRevision!==item.proposalRevision)continue;
   await writeMuseumArrangement(tx,museumId,row,arrangementInput.parse({placementId:row.id,revision:row.arrangement.revision,familyKey:row.familyId||"",status:"Proposed"}),actorId);
   cleared++;
  }
  for(const item of undo.areas){
   const area=await tx.museumSectionSpacePlan.findUnique({where:{museumId_section:{museumId,section:item.section}}});
   if(area?.version!==item.version)continue;
   // Keep an area if a curator retained/changed a destination inside it.
   const ids=data.working.placements.filter(p=>p.section===item.section).map(p=>p.id);
   const retained=await tx.museumArrangement.count({where:{museumId,placementId:{in:ids},status:{in:["Planned","Implemented"]}}});
   if(retained)continue;
   await tx.museumSectionSpacePlan.update({where:{museumId_section:{museumId,section:item.section}},data:{vitrines:[],version:{increment:1},updatedById:actorId}});
  }
  await tx.auditEvent.create({data:{userId:actorId,action:"museum.plan.suggestion.cleared",entityType:"MuseumSuggestedPlan",entityId:museumId,afterJson:{suggestionId:event.id,cleared,preserved:undo.arrangements.length-cleared}}});
 });
}
