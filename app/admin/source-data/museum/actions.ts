"use server";
import { museumSourceDecisionSchema } from "@/lib/museum-source-review-domain";
import { decideMuseumSource } from "@/lib/museum-source-review-service";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { assertCapability } from "@/lib/admin-access";
export async function reviewMuseumSource(form:FormData) {
  await assertCapability("view_source_data");
  const actor=await assertCapability("resolve_reconciliation");
  try {
    const input=museumSourceDecisionSchema.parse(Object.fromEntries(form));
    await decideMuseumSource(actor.id,input);
  } catch {redirect("/admin/source-data/museum?error=review");}
  revalidatePath("/museumadmin","layout");revalidatePath("/admin/source-data/museum");redirect("/admin/source-data/museum?saved=1");
}
