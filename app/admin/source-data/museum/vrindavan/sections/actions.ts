"use server";
import {assertCapability} from "@/lib/admin-access";
import {applyVrindavanLineage,saveVrindavanLineageAnchor} from "@/lib/vrindavan-lineage-review";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import type {Route} from "next";
const path="/admin/source-data/museum/vrindavan/sections";
async function actor(){await assertCapability("view_source_data");await assertCapability("access_museum");await assertCapability("view_full_saint_catalog");await assertCapability("resolve_reconciliation");return assertCapability("manage_museum");}
function refresh(){revalidatePath(path);revalidatePath("/vrindavanadmin","layout");}
export async function applySections(form:FormData){
 const user=await actor();let result;
 try{result=await applyVrindavanLineage(user.id,{revision:form.get("revision"),confirm:form.get("confirm")});}catch{redirect(`${path}?error=1` as Route);}
 refresh();redirect(`${path}?updated=${result.updated}` as Route);
}
export async function reviewFamilyAnchor(form:FormData){
 const user=await actor();
 try{await saveVrindavanLineageAnchor(user.id,{revision:form.get("revision"),familyKey:form.get("familyKey"),ruleGroup:form.get("ruleGroup"),evidence:form.get("evidence"),confirm:form.get("confirm")});}catch{redirect(`${path}?error=1` as Route);}
 refresh();redirect(`${path}?anchor=1` as Route);
}
