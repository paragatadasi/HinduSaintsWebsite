"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { Prisma } from "@/lib/generated/prisma/client";
import { z } from "zod";
import { assertCapability } from "@/lib/admin-access";
import { verifyBulkDeletePassword } from "@/lib/admin-secrets";
import { db } from "@/lib/db";
import { PUBLIC_CACHE_TAGS } from "@/lib/public-cache";
import {
  SAINT_MERGE_FIELD_GROUPS,
  SAINT_MERGE_SCALAR_SELECT,
  mergeChoiceInputName,
  resolveSaintMergeFields,
  type SaintMergeChoices,
  type SaintMergeFieldKey
} from "@/lib/saint-merge";
import { mergeSaintRecords } from "@/lib/saint-merge-service";

const mergeSchema = z.object({
  candidateId: z.string().cuid(),
  survivorId: z.string().cuid(),
  sensitiveActionPassword: z.string().min(1),
  acknowledgeMerge: z.literal("on")
});

export async function mergeConfirmedSaints(formData: FormData) {
  await assertCapability("merge_saints");
  const actor = await assertCapability("manage_sensitive_actions");
  const parsed = mergeSchema.safeParse({
    candidateId: formData.get("candidateId"),
    survivorId: formData.get("survivorId"),
    sensitiveActionPassword: formData.get("sensitiveActionPassword"),
    acknowledgeMerge: formData.get("acknowledgeMerge")
  });
  if (!parsed.success) redirect(mergeErrorHref(String(formData.get("candidateId") || ""), "Complete the merge confirmation fields."));
  if (!(await verifyBulkDeletePassword(parsed.data.sensitiveActionPassword))) {
    redirect(mergeErrorHref(parsed.data.candidateId, "The sensitive-action password was incorrect."));
  }

  const candidate = await db.duplicateCandidate.findUnique({
    where: { id: parsed.data.candidateId },
    select: { id: true, entityType: true, entityId: true, candidateEntityId: true, status: true }
  });
  if (!candidate || candidate.entityType !== "Saint" || candidate.status !== "resolved" || !candidate.entityId || !candidate.candidateEntityId) {
    redirect(mergeErrorHref(parsed.data.candidateId, "Only a confirmed Saint duplicate can be merged."));
  }
  const pairIds = [candidate.entityId, candidate.candidateEntityId];
  if (!pairIds.includes(parsed.data.survivorId)) redirect(mergeErrorHref(candidate.id, "Choose one of the confirmed records as the survivor."));

  const saints = await db.saint.findMany({
    where: { id: { in: pairIds } },
    select: { ...SAINT_MERGE_SCALAR_SELECT, slug: true }
  });
  if (saints.length !== 2) redirect(mergeErrorHref(candidate.id, "One of these records has already been merged or removed."));
  const left = saints.find((saint) => saint.id === candidate.entityId)!;
  const right = saints.find((saint) => saint.id === candidate.candidateEntityId)!;
  const target = saints.find((saint) => saint.id === parsed.data.survivorId)!;
  const source = saints.find((saint) => saint.id !== parsed.data.survivorId)!;
  const choices: SaintMergeChoices = {};
  for (const group of SAINT_MERGE_FIELD_GROUPS) {
    for (const [field] of group.fields) {
      const selected = formData.get(mergeChoiceInputName(field));
      if (typeof selected === "string" && selected) choices[field as SaintMergeFieldKey] = selected;
    }
  }

  let scalarData: ReturnType<typeof resolveSaintMergeFields>;
  try {
    scalarData = resolveSaintMergeFields(left, right, target.id, choices);
  } catch {
    redirect(mergeErrorHref(candidate.id, "One or more field choices no longer match this duplicate pair."));
  }

  try {
    await db.$transaction(async (tx) => {
      const currentCandidate = await tx.duplicateCandidate.findUnique({
        where: { id: candidate.id },
        select: { status: true, entityId: true, candidateEntityId: true }
      });
      if (!currentCandidate || currentCandidate.status !== "resolved"
        || currentCandidate.entityId !== candidate.entityId
        || currentCandidate.candidateEntityId !== candidate.candidateEntityId) {
        throw new Error("The duplicate review changed before the merge was completed.");
      }
      const existingCount = await tx.saint.count({ where: { id: { in: pairIds } } });
      if (existingCount !== 2) throw new Error("One of these records has already been merged or removed.");
      await mergeSaintRecords(tx, {
        actorId: actor.id,
        candidateId: candidate.id,
        fieldChoices: Object.fromEntries(Object.entries(choices).filter((entry): entry is [string, string] => Boolean(entry[1]))),
        source: { id: source.id, slug: source.slug, displayName: source.displayName },
        target: { id: target.id, slug: target.slug, displayName: target.displayName },
        scalarData: scalarData as Prisma.SaintUncheckedUpdateInput
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30_000 });
  } catch (error) {
    const message = error instanceof Error && /changed|already been merged/.test(error.message)
      ? error.message
      : "The merge could not be completed safely. No records were changed.";
    redirect(mergeErrorHref(candidate.id, message));
  }

  revalidateMergedSaintPaths(source.slug, target.slug);
  redirect(`/admin/source-data/reconciliation?view=duplicates&status=resolved&${new URLSearchParams({
    merged: source.displayName,
    survivor: target.displayName
  }).toString()}` as Route);
}

function mergeErrorHref(candidateId: string, error: string) {
  if (!/^[a-z0-9]+$/.test(candidateId)) return "/admin/source-data/reconciliation?view=duplicates&error=Invalid+merge+request" as Route;
  return `/admin/source-data/reconciliation/${candidateId}/merge?${new URLSearchParams({ error }).toString()}` as Route;
}

function revalidateMergedSaintPaths(sourceSlug: string, targetSlug: string) {
  revalidateTag(PUBLIC_CACHE_TAGS.home);
  revalidateTag(PUBLIC_CACHE_TAGS.places);
  revalidateTag(PUBLIC_CACHE_TAGS.saints);
  revalidateTag(PUBLIC_CACHE_TAGS.traditions);
  revalidatePath("/");
  revalidatePath("/saints");
  revalidatePath(`/saints/${sourceSlug}`);
  revalidatePath(`/saints/${targetSlug}`);
  revalidatePath("/admin");
  revalidatePath("/admin/saints");
  revalidatePath(`/admin/saints/${targetSlug}`);
  revalidatePath("/admin/source-data/reconciliation");
}
