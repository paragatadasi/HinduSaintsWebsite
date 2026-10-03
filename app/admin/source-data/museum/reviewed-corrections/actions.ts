"use server";
import {assertCapability} from "@/lib/admin-access";
import {applyReviewedMuseumCorrections} from "@/lib/reviewed-museum-corrections";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import type {Route} from "next";
export async function applyCorrections() {
 const actor=await assertCapability("resolve_reconciliation");await assertCapability("edit_structured_content");await assertCapability("view_full_saint_catalog");
 try{await applyReviewedMuseumCorrections(actor.id);}catch{redirect("/admin/source-data/museum/reviewed-corrections?error=1" as Route);}
 revalidatePath("/saints");revalidatePath("/museumadmin");revalidatePath("/vrindavanadmin");
 for(const slug of ["sri-madhu-pandit-goswami","sri-haridas-thakur","sri-somappar-swami"])revalidatePath(`/saints/${slug}`);
 redirect("/admin/source-data/museum/reviewed-corrections?done=1" as Route);
}