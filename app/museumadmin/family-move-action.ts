"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertMuseumMutation } from "@/lib/museum-access";
import { MuseumConflict } from "@/lib/museum-service";
import { moveMuseumFamilyProposal } from "@/lib/museum-family-moves";
import { museumSectionSlug } from "@/lib/museum-proposals";

const inputSchema = z.object({
  familyKey: z.string().trim().min(1).max(200),
  section: z.string().trim().min(1).max(200),
  revision: z.string().regex(/^[a-f0-9]{64}$/)
});

export async function moveFamilyProposalAction(form: FormData): Promise<{ error: string }> {
  const actor = await assertMuseumMutation();
  const parsed = inputSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Choose a destination section and try again." };
  try {
    await moveMuseumFamilyProposal({ ...parsed.data, actorId: actor.id });
  } catch (error) {
    if (error instanceof MuseumConflict) return { error: error.message };
    throw error;
  }
  revalidatePath("/museumadmin", "layout");
  redirect(`/museumadmin/${museumSectionSlug(parsed.data.section)}?familyMoved=1`);
}
