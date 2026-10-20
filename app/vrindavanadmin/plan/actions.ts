"use server";
import {revalidatePath} from "next/cache";
import {z} from "zod";
import {assertCapability} from "@/lib/admin-access";
import {assertMuseumMutation} from "@/lib/museum-access";
import {MuseumConflict} from "@/lib/museum-service";
import {assignVrindavanPlan,saveVrindavanPhotoSetup} from "@/lib/museum-move-planner";

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
export async function savePhotoVitrinesAction(input:unknown){return save(actorId=>saveVrindavanPhotoSetup(input,actorId));}
export async function assignMovePlanAction(input:unknown){return save(actorId=>assignVrindavanPlan(input,actorId));}
