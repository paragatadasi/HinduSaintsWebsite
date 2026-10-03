"use server";
import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import {assertMuseumMutation} from "@/lib/museum-access";
import {arrangementInput} from "@/lib/museum-arrangement-domain";
import {saveMuseumArrangement,saveMuseumFamilyArrangement} from "@/lib/museum-arrangement";
import {MuseumConflict} from "@/lib/museum-service";
export async function saveArrangementAction(form:FormData):Promise<{error:string}> {
 const actor=await assertMuseumMutation();const parsed=arrangementInput.safeParse(Object.fromEntries(form));
 if(!parsed.success)return {error:parsed.error.issues[0]?.message||"Check the arrangement fields."};
 let name:string;try{name=await saveMuseumArrangement(parsed.data,actor.id);}catch(error){if(error instanceof MuseumConflict)return {error:error.message};throw error;}
 revalidatePath("/museumadmin","layout");redirect(`/museumadmin?q=${encodeURIComponent(name)}&arrangementSaved=1`);
}

export async function saveFamilyArrangementAction(form:FormData):Promise<{error:string}> {
 const actor=await assertMuseumMutation();const parsed=arrangementInput.safeParse({...Object.fromEntries(form),placementId:"family"});
 if(!parsed.success)return {error:parsed.error.issues[0]?.message||"Check the family arrangement."};
 let name:string;try{name=(await saveMuseumFamilyArrangement(parsed.data,actor.id)).name;}catch(error){if(error instanceof MuseumConflict)return {error:error.message};throw error;}
 revalidatePath("/museumadmin","layout");redirect(`/museumadmin?q=${encodeURIComponent(name)}&arrangementSaved=1`);
}
