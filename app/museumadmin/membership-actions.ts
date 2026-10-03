"use server";
import {z} from "zod";
import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import {assertMuseumMutation} from "@/lib/museum-access";
import {MuseumConflict} from "@/lib/museum-service";
import {changeMuseumDisplayMembership,requestMuseumRelationshipCorrection} from "@/lib/museum-display-membership";
const membership=z.object({placementId:z.string().min(1).max(200),familyKey:z.string().min(1).max(200),revision:z.string().regex(/^[a-f0-9]{64}$/),action:z.enum(["detach","restore"])});
export async function changeDisplayMembershipAction(form:FormData):Promise<{error:string}> {
 const actor=await assertMuseumMutation();const parsed=membership.safeParse(Object.fromEntries(form));
 if(!parsed.success)return {error:"Reload this saint and try again."};
 let name:string;
 try{name=(await changeMuseumDisplayMembership({...parsed.data,actorId:actor.id})).saintName;}catch(error){if(error instanceof MuseumConflict)return {error:error.message};throw error;}
 revalidatePath("/museumadmin","layout");redirect(`/museumadmin?q=${encodeURIComponent(name)}&membershipSaved=1`);
}
export async function requestRelationshipCorrectionAction(form:FormData):Promise<{error:string}> {
 const actor=await assertMuseumMutation();const parsed=z.object({saintId:z.string().min(1).max(200),note:z.string().trim().min(10).max(2000)}).safeParse(Object.fromEntries(form));
 if(!parsed.success)return {error:"Describe the mistaken relationship and the correction needed (at least 10 characters)."};
 let name:string;
 try{name=await requestMuseumRelationshipCorrection({...parsed.data,actorId:actor.id});}catch(error){if(error instanceof MuseumConflict)return {error:error.message};throw error;}
 revalidatePath("/admin/source-data/reconciliation");redirect(`/museumadmin?q=${encodeURIComponent(name)}&correctionRequested=1`);
}
