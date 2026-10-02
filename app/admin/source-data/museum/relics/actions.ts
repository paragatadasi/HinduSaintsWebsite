"use server";
import type { Route } from "next";
import { assertCapability } from "@/lib/admin-access";
import { decideRelic, relicDecisionSchema, stageMirroredRelics } from "@/lib/museum-relic-review";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
export async function syncRelics() {
  await assertCapability("view_source_data"); await assertCapability("run_imports");
  const actor=await assertCapability("manage_museum");
  let result;
  try { result=await stageMirroredRelics(actor.id); } catch { redirect("/admin/source-data/museum/relics?error=1" as Route); }
  revalidatePath("/museumadmin","layout"); revalidatePath("/admin/source-data/museum/relics");
  redirect(`/admin/source-data/museum/relics?imported=${result.imported}&pending=${result.pending}` as Route);
}
export async function reviewRelic(form:FormData) {
  await assertCapability("view_source_data"); const actor=await assertCapability("manage_museum");
  try { await decideRelic(actor.id,relicDecisionSchema.parse(Object.fromEntries(form))); }
  catch { redirect("/admin/source-data/museum/relics?error=1" as Route); }
  revalidatePath("/museumadmin","layout"); revalidatePath("/admin/source-data/museum/relics");
  redirect("/admin/source-data/museum/relics?saved=1" as Route);
}
