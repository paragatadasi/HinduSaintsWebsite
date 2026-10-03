"use server";
import {redirect} from "next/navigation";
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
export async function reviewVrindavan(form:FormData){
  const actor=await authorize("resolve_reconciliation");let result;
  try{result=await decideVrindavanIdentity(actor.id,[{id:form.get("id"),version:form.get("version"),action:form.get("action"),saintIds:form.getAll("saintIds"),note:form.get("note")||"",confirm:form.get("confirm")==="on"}]);}
  catch{redirect(`${path}?error=review` as Route);}
  revalidatePath(path);redirect(`${path}?saved=${result.saved}` as Route);
}
