"use server";
import type { Route } from "next";
import { assertMuseumMutation } from "@/lib/museum-access";
import { planItemMove, planItemMoveSchema, resolveItemMove, resolveItemMoveSchema } from "@/lib/museum-item-moves";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
export async function proposeMove(form:FormData) {
  const actor=await assertMuseumMutation();
  const input=planItemMoveSchema.safeParse(Object.fromEntries(form));
  if(!input.success) redirect("/museumadmin/collections?error=1" as Route);
  try {await planItemMove(actor.id,input.data);} catch {redirect(`/museumadmin/collections/${input.data.itemId}?error=1` as Route);}
  revalidatePath("/museumadmin","layout");redirect(`/museumadmin/collections/${input.data.itemId}?saved=1` as Route);
}
export async function finishMove(form:FormData) {
  const actor=await assertMuseumMutation();
  const input=resolveItemMoveSchema.safeParse(Object.fromEntries(form));
  if(!input.success) redirect("/museumadmin/collections?error=1" as Route);
  try {await resolveItemMove(actor.id,input.data);} catch {redirect(`/museumadmin/collections/${input.data.itemId}?error=1` as Route);}
  revalidatePath("/museumadmin","layout");revalidatePath("/admin/source-data/museum/relics");redirect(`/museumadmin/collections/${input.data.itemId}?saved=1` as Route);
}
