"use server";
import { z } from "zod";
import { decideMuseumSource } from "@/lib/museum-source-review-service";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { assertCapability } from "@/lib/admin-access";
const schema=z.object({ id:z.string().cuid(), version:z.string().datetime(), action:z.enum(["link","defer","reopen"]), saintId:z.string().optional(), note:z.string().trim().min(1).max(2000) });
export async function reviewMuseumSource(form:FormData) {
  await assertCapability("view_source_data");
  const actor=await assertCapability("resolve_reconciliation");
  const input=schema.parse(Object.fromEntries(form));
  try {
    await decideMuseumSource(actor.id,input);
  } catch {redirect("/admin/source-data/museum?error=review");}
  revalidatePath("/museumadmin","layout");revalidatePath("/admin/source-data/museum");redirect("/admin/source-data/museum?saved=1");
}
