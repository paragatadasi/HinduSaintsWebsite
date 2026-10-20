"use server";
import {redirect} from "next/navigation";
import {ZodError} from "zod";
import type {Route} from "next";
import {revalidatePath} from "next/cache";
import {assertCapability} from "@/lib/admin-access";
import {stageVrindavanInventory,decideVrindavanIdentity,confirmClearVrindavanMatches} from "@/lib/vrindavan-identity-review";
const path="/admin/source-data/museum/vrindavan";
async function authorize(capability:"run_imports"|"resolve_reconciliation"){
  await assertCapability("view_source_data");await assertCapability("view_full_saint_catalog");return assertCapability(capability);
}
export async function uploadVrindavan(form:FormData){
  const actor=await authorize("run_imports");let result;
  try{const file=form.get("inventoryFile");if(!(file instanceof File)||!file.size||file.size>1000000)throw Error("Choose the prepared inventory under 1 MB");result=await stageVrindavanInventory(actor.id,JSON.parse(await file.text()));}
  catch{redirect(`${path}?error=upload` as Route);}
  revalidatePath(path);redirect(`${path}?batch=${result.batch}&staged=${result.staged}&unchanged=${result.unchanged}` as Route);
}
export async function linkClearVrindavan(form:FormData){
  const actor=await authorize("resolve_reconciliation");let result;
  try{result=await confirmClearVrindavanMatches(actor.id,form.getAll("selection"),form.get("confirm"));}
  catch{redirect(`${path}?error=review` as Route);}
  revalidatePath(path);redirect(`${path}?status=linked&saved=${result.saved}` as Route);
}
export async function reviewVrindavan(decision:"link"|"defer",form:FormData){
  const actor=await authorize("resolve_reconciliation");let result;
  try{result=await decideVrindavanIdentity(actor.id,[{id:form.get("id"),version:form.get("version"),action:decision,saintIds:form.getAll("saintIds"),note:form.get("note")||"",confirm:form.get("confirm")==="on"}]);}
  catch(error){
    const reason=error instanceof ZodError?"input":error instanceof Error&&error.message.startsWith("Review changed")?"stale":error instanceof Error&&error.message==="Saint no longer available"?"identity":"save";
    // Log only the category/code, never full errors containing source payloads or credentials.
    const code=error&&typeof error==="object"&&"code" in error&&typeof error.code==="string"?error.code:undefined;
    console.warn("vrindavan.identity.review_failed",{reason,code});
    redirect(`${path}?error=${reason}` as Route);
  }
  revalidatePath(path);redirect(`${path}?saved=${result.saved}` as Route);
}
