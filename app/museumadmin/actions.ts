"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertMuseumMutation } from "@/lib/museum-access";
import { museumPlacementSchema } from "@/lib/museum-domain";
import {
  MuseumConflict,
  saveMuseumPlacement,
  reviewMuseumProposal,
} from "@/lib/museum-service";

const proposalKey = z.union([
  z.string().cuid(),
  z.string().regex(/^(existing|source):[a-f0-9]{64}$/),
]);
const identitySchema = z.object({
  saintId: z.string().cuid(),
  version: z.coerce.number().int().nonnegative(),
});
export async function savePlacementAction(form: FormData) {
  const actor = await assertMuseumMutation();
  const { saintId, version } = identitySchema.parse(Object.fromEntries(form));
  let error = "";
  try {
    const input = museumPlacementSchema.parse({
      ...Object.fromEntries(form),
      alternatives: form.getAll("alternatives"),
    });
    const anchor = z
      .string()
      .max(200)
      .parse(form.get("anchor") || "");
    const proposalId = form.get("baseProposalId");
    if (proposalId) {
      await reviewMuseumProposal({
        saintId,
        version,
        actorId: actor.id,
        proposalId: proposalKey.parse(proposalId),
        decision: "accept",
        editedInput: input,
        anchor,
      });
    } else
      await saveMuseumPlacement({
        saintId,
        version,
        actorId: actor.id,
        input,
        anchor,
      });
  } catch (e) {
    if (e instanceof MuseumConflict) error = e.message;
    else if (e instanceof z.ZodError)
      error = "Check the placement fields and try again.";
    else throw e;
  }
  if (error) return { error };
  revalidatePath("/museumadmin", "layout");
  redirect(`/museumadmin/saints/${saintId}?saved=1`);
}
export async function reviewProposalAction(form: FormData) {
  const actor = await assertMuseumMutation();
  const { saintId, version } = identitySchema.parse(Object.fromEntries(form));
  const proposalId = proposalKey.parse(form.get("proposalId"));
  const decision = z.enum(["accept", "ignore"]).parse(form.get("decision"));
  let error = "";
  try {
    await reviewMuseumProposal({
      saintId,
      version,
      actorId: actor.id,
      proposalId,
      decision,
    });
  } catch (e) {
    if (e instanceof MuseumConflict) error = e.message;
    else throw e;
  }
  if (error) return { error };
  revalidatePath("/museumadmin", "layout");
  redirect(`/museumadmin/saints/${saintId}?saved=1`);
}
