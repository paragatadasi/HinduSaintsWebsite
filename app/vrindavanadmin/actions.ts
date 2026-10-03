"use server";
import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import {z} from "zod";
import {assertMuseumMutation} from "@/lib/museum-access";
import {assertCapability} from "@/lib/admin-access";
import {MuseumConflict} from "@/lib/museum-service";
import {saveVrindavanProposal,moveVrindavanFamily,saveVrindavanArrangement} from "@/lib/vrindavan-proposal-service";
import {requestMuseumRelationshipCorrection} from "@/lib/museum-display-membership";
async function actor(){await assertCapability("view_full_saint_catalog");return assertMuseumMutation();}
function errorResult(error:unknown){if(error instanceof MuseumConflict)return {error:error.message};if(error instanceof z.ZodError)return {error:error.issues[0]?.message||"Check the fields."};throw error;}
export async function saveVrindavanProposalAction(form:FormData):Promise<{error:string}>{const user=await actor();let name:string;try{name=await saveVrindavanProposal(Object.fromEntries(form),user.id);}catch(error){return errorResult(error);}revalidatePath("/vrindavanadmin","layout");redirect(`/vrindavanadmin/sections?q=${encodeURIComponent(name)}&saved=1`);}
export async function moveVrindavanFamilyAction(form:FormData):Promise<{error:string}>{const user=await actor();let slug:string;try{slug=await moveVrindavanFamily(Object.fromEntries(form),user.id);}catch(error){return errorResult(error);}revalidatePath("/vrindavanadmin","layout");redirect(`/vrindavanadmin/sections?section=${encodeURIComponent(slug)}&saved=1`);}
export async function saveVrindavanArrangementAction(form:FormData):Promise<{error:string}>{return arrangement(form,false);}
export async function saveVrindavanFamilyArrangementAction(form:FormData):Promise<{error:string}>{return arrangement(form,true);}
async function arrangement(form:FormData,family:boolean):Promise<{error:string}>{const user=await actor();let name:string;try{name=await saveVrindavanArrangement({...Object.fromEntries(form),...(family?{placementId:"family"}:{})},user.id,family);}catch(error){return errorResult(error);}revalidatePath("/vrindavanadmin","layout");redirect(`/vrindavanadmin/sections?q=${encodeURIComponent(name)}&saved=1`);}
export async function requestVrindavanRelationshipCorrectionAction(form:FormData):Promise<{error:string}>{const user=await actor();let name:string;try{const input=z.object({saintId:z.string().min(1).max(200),note:z.string().trim().min(10).max(2000)}).parse(Object.fromEntries(form));name=await requestMuseumRelationshipCorrection({...input,actorId:user.id});}catch(error){return errorResult(error);}redirect(`/vrindavanadmin/sections?q=${encodeURIComponent(name)}&correctionRequested=1`);}
