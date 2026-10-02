"use server";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { assertCapability } from "@/lib/admin-access";
import { stageVisitPlaceResearch, decideVisitPlaceResearch } from "@/lib/visit-place-review";
import { PUBLIC_CACHE_TAGS } from "@/lib/public-cache";
import { visitPlaceSchema } from "@/lib/visit-place-domain";
import { researchBundleSchema } from "@/lib/visit-place-domain";

export async function stageResearch(form:FormData) {
  await assertCapability("view_source_data"); const actor=await assertCapability("run_imports");
  let result;
  try {
    const file=form.get("proposalFile");
    if(!(file instanceof File) || !file.size || file.size>750000) throw Error("Choose a research JSON file under 750 KB.");
    const bundle=researchBundleSchema.parse(JSON.parse(await file.text()));
    result=await stageVisitPlaceResearch(actor.id,bundle);
  } catch {redirect("/admin/source-data/visit-places?error=1" as Route);}
  revalidatePath("/admin/source-data/visit-places");
  redirect(`/admin/source-data/visit-places?staged=${result.staged}&unchanged=${result.unchanged}&unmatched=${result.unmatched}` as Route);
}
export async function reviewResearch(form:FormData) {
  await assertCapability("view_source_data"); const actor=await assertCapability("edit_structured_content");
  const fields=Object.fromEntries(form);
  let id:string;
  try {
    const edited=visitPlaceSchema.parse(fields);
    const result=await decideVisitPlaceResearch(actor.id,fields,edited);id=result.id;
  } catch {redirect("/admin/source-data/visit-places?error=1" as Route);}
  revalidatePath("/admin/source-data/visit-places");
  redirect(`/admin/source-data/visit-places/${id}?saved=1` as Route);
}

export async function acceptResearch(form:FormData) {
 await assertCapability("view_source_data"); const actor=await assertCapability("publish_content");
 const {acceptVisitPlaces}=await import("@/lib/visit-place-acceptance");
 let result;
 try { result=await acceptVisitPlaces(actor.id,{selections:form.getAll("selection"),confirm:form.get("confirm"),updatePrimary:form.get("updatePrimary")==="on",note:form.get("note")||""}); }
 catch {redirect("/admin/source-data/visit-places?acceptError=1" as Route);}
 for(const tag of [PUBLIC_CACHE_TAGS.home,PUBLIC_CACHE_TAGS.saints,PUBLIC_CACHE_TAGS.places,PUBLIC_CACHE_TAGS.traditions]) revalidateTag(tag);
 revalidatePath("/admin/source-data/visit-places");revalidatePath("/admin/saints");revalidatePath("/museumadmin","layout");
 revalidatePath("/saints");revalidatePath("/places","layout");revalidatePath("/");
 for(const slug of result.slugs) revalidatePath(`/saints/${slug}`);
 redirect(`/admin/source-data/visit-places?status=accepted&accepted=${result.accepted}` as Route);
}
