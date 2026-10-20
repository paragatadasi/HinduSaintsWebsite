"use server";
import {assertCapability} from "@/lib/admin-access";
import {applyKeyLocalityUpdates} from "@/lib/key-locality-updates";
import {revalidatePath,revalidateTag} from "next/cache";
import {PUBLIC_CACHE_TAGS} from "@/lib/public-cache";
import {redirect} from "next/navigation";
import type {Route} from "next";
export async function applyLocalities(form:FormData){
 const actor=await assertCapability("publish_content");await assertCapability("view_full_saint_catalog");await assertCapability("resolve_reconciliation");await assertCapability("edit_structured_content");
 let result;
 try{result=await applyKeyLocalityUpdates(actor.id,{selections:form.getAll("selection"),confirm:form.get("confirm")});}
 catch{redirect("/admin/source-data/key-localities?error=1" as Route);}
 for(const tag of Object.values(PUBLIC_CACHE_TAGS))revalidateTag(tag);
 revalidatePath("/admin/source-data/key-localities");revalidatePath("/admin/saints");revalidatePath("/museumadmin");revalidatePath("/vrindavanadmin");
 for(const slug of result.slugs)revalidatePath(`/saints/${slug}`);
 redirect(`/admin/source-data/key-localities?done=${result.updated}` as Route);
}
