"use server";
import {redirect} from "next/navigation";
import type {Route} from "next";
import {revalidatePath} from "next/cache";
import {z} from "zod";
import {assertCapability} from "@/lib/admin-access";
import {assertMuseumMutation} from "@/lib/museum-access";
import {MuseumConflict} from "@/lib/museum-service";
import {saveSpnProposal} from "@/lib/spn-proposal-service";

export async function saveSpnProposalAction(form:FormData){
 await assertCapability("view_source_data");await assertCapability("view_full_saint_catalog");
 const actor=await assertMuseumMutation();
 const saintId=z.string().cuid().parse(form.get("saintId"));
 let error="";
 try{await saveSpnProposal(Object.fromEntries(form),actor.id);}
 catch(e){if(e instanceof MuseumConflict)error=e.message;else if(e instanceof z.ZodError)error="Check the section, tier, family and decision reason.";else throw e;}
 if(error)redirect(`/admin/source-data/museum/spn-proposals?saintId=${saintId}&error=${encodeURIComponent(error)}` as Route);
 revalidatePath("/museumadmin","layout");revalidatePath("/admin/source-data/museum");
 redirect(`/admin/source-data/museum/spn-proposals?saintId=${saintId}&saved=1` as Route);
}
