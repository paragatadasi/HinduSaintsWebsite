"use server";
import {readMuseumPlanVariants,importMuseumPlanTemplate,saveMuseumPlanVariant,previewMuseumPlanVariant,activateMuseumPlanVariant} from "@/lib/museum-plan-variants";
import minimalMovePlan from "@/data/museum/vrindavan-minimal-move-plan.json";
import {readVrindavanMovePlanner} from "@/lib/museum-move-planner";
import {revalidatePath} from "next/cache";
import {z} from "zod";
import {assertCapability} from "@/lib/admin-access";
import {assertMuseumMutation} from "@/lib/museum-access";
import {MuseumConflict} from "@/lib/museum-service";
import {assignVrindavanPlan,completeVrindavanPlan,saveVrindavanSectionArea,saveVrindavanFlexiblePlan} from "@/lib/museum-move-planner";
import {readVrindavanWorkingData} from "@/lib/vrindavan-working-data";
import {readMuseumSaintProfiles} from "@/lib/museum-saint-profiles";
import {saveVrindavanProposal} from "@/lib/vrindavan-proposal-service";
import {hasCapability} from "@/lib/permissions";
import {readMuseumDiagramLayouts,saveMuseumDiagramLayout,deleteMuseumDiagramLayout} from "@/lib/museum-diagram-layouts";
import {readMuseumCuratorReview,saveMuseumCuratorReview} from "@/lib/museum-curator-review";
import {previewVrindavanSuggestedPlan,applyVrindavanSuggestedPlan,clearVrindavanSuggestedPlan} from "@/lib/museum-move-planner";

async function save(work:(actorId:string)=>Promise<unknown>){
 await assertCapability("access_museum");
 await assertCapability("view_full_saint_catalog");
 const user=await assertMuseumMutation();
 try{
  await work(user.id);
  revalidatePath("/vrindavanadmin","layout");
  return {error:""};
 }catch(error){
  if(error instanceof MuseumConflict)return {error:error.message};
  if(error instanceof z.ZodError)return {error:error.issues[0]?.message||"Check the selected saints and destination."};
  throw error;
 }
}
export async function assignMovePlanAction(input:unknown){return save(actorId=>assignVrindavanPlan(input,actorId));}
export async function completeMovePlanAction(input:unknown){return save(actorId=>completeVrindavanPlan(input,actorId));}
export async function loadMoveSaintAction(saintId:string){
 await assertCapability("access_museum");await assertCapability("view_full_saint_catalog");
 z.string().min(1).max(200).parse(saintId);
 const row=(await readVrindavanWorkingData()).placements.find(row=>row.saintId===saintId);
 if(!row)throw new MuseumConflict("This saint is no longer in the reviewed Vrindavan inventory.");
 return {profile:(await readMuseumSaintProfiles([saintId]))[saintId]??null,familyKey:row.familyId};
}

export async function loadPlanSaintOverviewAction(saintId:string){
 await assertCapability("access_museum");await assertCapability("view_full_saint_catalog");
 z.string().min(1).max(200).parse(saintId);
 const data=await readVrindavanWorkingData();const row=data.placements.find(item=>item.saintId===saintId);
 if(!row)throw new MuseumConflict("This saint is no longer in the reviewed inventory. Reload the plan.");
 return {row,profile:(await readMuseumSaintProfiles([saintId]))[saintId]??null,sectionSlug:data.sections.find(section=>section.name===row.section)?.slug||""};
}

export async function saveSectionAreaAction(input:unknown){return save(actorId=>saveVrindavanSectionArea(input,actorId));}
export async function loadMoveProposalAction(saintId:string){
 const user=await assertCapability("access_museum");await assertCapability("view_full_saint_catalog");
 z.string().min(1).max(200).parse(saintId);
 const data=await readVrindavanWorkingData();const row=data.placements.find(p=>p.saintId===saintId);
 if(!row)throw new MuseumConflict("This saint is no longer in the reviewed inventory. Reload the plan.");
 return {row,options:{sections:data.sections.filter(s=>s.slug!=="needs-section-proposal").map(s=>s.name),groups:data.groupOptions},canEditRelationships:hasCapability(user.roles,"edit_structured_content")};
}
export async function saveMoveProposalAction(form:FormData){return save(actorId=>saveVrindavanProposal(Object.fromEntries(form),actorId,true));}
export async function saveFlexiblePlanAction(input:unknown){return save(actorId=>saveVrindavanFlexiblePlan(input,actorId));}
export async function previewSuggestedPlanAction(){
 await assertCapability("access_museum");await assertCapability("view_full_saint_catalog");
 return previewVrindavanSuggestedPlan();
}
export async function applySuggestedPlanAction(input:unknown){return save(actorId=>applyVrindavanSuggestedPlan(input,actorId));}
export async function clearSuggestedPlanAction(input:unknown){return save(actorId=>clearVrindavanSuggestedPlan(input,actorId));}

export async function loadDiagramLayoutsAction(){
 const user=await assertCapability("access_museum");await assertCapability("view_full_saint_catalog");
 return readMuseumDiagramLayouts("museum-vrindavan",user.id);
}
async function changeDiagram(input:unknown,remove:boolean){
 await assertCapability("access_museum");await assertCapability("view_full_saint_catalog");const user=await assertMuseumMutation();
 try{return {data:await (remove?deleteMuseumDiagramLayout:saveMuseumDiagramLayout)(input,user.id),error:""};}
 catch(error){if(error instanceof MuseumConflict)return {data:null,error:error.message};if(error instanceof z.ZodError)return {data:null,error:error.issues[0]?.message||"Check this diagram view."};throw error;}
}
export async function saveDiagramLayoutAction(input:unknown){return changeDiagram(input,false);}
export async function deleteDiagramLayoutAction(input:unknown){return changeDiagram(input,true);}

export async function loadCuratorReviewAction(){
 const user=await assertCapability("access_museum");await assertCapability("view_full_saint_catalog");
 const queue=await readMuseumCuratorReview("museum-vrindavan");
 return {...queue,cases:queue.cases.map(item=>({...item,options:item.options.map(option=>({...option,
  ...(!hasCapability(user.roles,"resolve_reconciliation")&&option.requiresIdentityLink?{unavailableReason:"An identity reviewer must approve this source-link change."}:{})
 }))}))};
}
export async function loadCuratorReviewProfileAction(caseId:string,revision:string){
 await assertCapability("access_museum");await assertCapability("view_full_saint_catalog");
 z.string().min(1).max(200).parse(caseId);z.string().min(1).max(200).parse(revision);
 const item=(await readMuseumCuratorReview("museum-vrindavan")).cases.find(item=>item.caseId===caseId);
 if(!item||item.revision!==revision)throw new MuseumConflict("This case changed. Reload the review list.");
 return item.saintId?(await readMuseumSaintProfiles([item.saintId]))[item.saintId]??null:null;
}
export async function saveCuratorReviewAction(input:unknown){
 return save(async actorId=>{
  // Resolve permissions from the server-owned choice, never from a client flag.
  const selection=z.object({caseId:z.string().min(1).max(200),decision:z.enum(["confirm_supported","different","unsure"]),explicitChoiceId:z.string().max(200).optional()}).parse(input);
  if(selection.decision==="confirm_supported"){
   const queue=await readMuseumCuratorReview("museum-vrindavan");
   const option=queue.cases.find(item=>item.caseId===selection.caseId)?.options.find(value=>value.id===selection.explicitChoiceId);
   if(option?.requiresIdentityLink)await assertCapability("resolve_reconciliation");
  }
  await saveMuseumCuratorReview(input,actorId);
 });
}

export async function saveMoveVariantAction(input:unknown){return save(actorId=>saveMuseumPlanVariant(input,actorId));}
export async function activateMoveVariantAction(input:unknown){return save(actorId=>activateMuseumPlanVariant(input,actorId));}
export async function previewMoveVariantAction(input:unknown){
 const user=await assertCapability("access_museum");await assertCapability("view_full_saint_catalog");
 return previewMuseumPlanVariant(input,user.id);
}

export async function prepareMinimalMoveVariantAction(input:{revision:string;planRevision:string}){
 await assertCapability("access_museum");await assertCapability("view_full_saint_catalog");const user=await assertMuseumMutation();
 try{
  const id=await importMuseumPlanTemplate(minimalMovePlan,input,user.id);
  const [registry,data]=await Promise.all([readMuseumPlanVariants(user.id),readVrindavanMovePlanner()]);
  const control={revision:registry.revision,planRevision:data.revision};
  const preview=await previewMuseumPlanVariant({...control,id},user.id);
  revalidatePath("/vrindavanadmin/plan");
  return {error:"",data:{preview,control,description:minimalMovePlan.description}};
 }catch(error){
  if(error instanceof MuseumConflict)return {error:error.message,data:null};
  if(error instanceof z.ZodError)return {error:error.issues[0]?.message||"Check this proposal.",data:null};
  throw error;
 }
}
