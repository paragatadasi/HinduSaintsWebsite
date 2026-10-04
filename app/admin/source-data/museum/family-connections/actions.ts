"use server";
import {assertCapability} from "@/lib/admin-access";
import {reconcileFamilyTreeConnections} from "@/lib/family-tree-reconciliation";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import type {Route} from "next";
export async function reconcileConnections(form:FormData){
 const actor=await assertCapability("run_imports");await assertCapability("resolve_reconciliation");await assertCapability("view_full_saint_catalog");
 const version=form.get("version");
 if(typeof version!=="string"||form.get("confirm")!=="on")redirect("/admin/source-data/museum/family-connections?error=1" as Route);
 let result;
 try{result=await reconcileFamilyTreeConnections(actor.id,version);}catch{redirect("/admin/source-data/museum/family-connections?error=1" as Route);}
 revalidatePath("/admin/source-data/museum/family-connections");revalidatePath("/museumadmin");revalidatePath("/vrindavanadmin");
 redirect(`/admin/source-data/museum/family-connections?created=${result.created}&issues=${result.issues}` as Route);
}
