"use server";
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
