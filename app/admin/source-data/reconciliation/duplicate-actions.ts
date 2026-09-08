"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { Prisma } from "@/lib/generated/prisma/client";
import { z } from "zod";
import { assertCapability } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { buildSaintDuplicateCandidates, duplicateDecisionUpdate, duplicatePairKey } from "@/lib/saint-duplicates";
import { decisionError, duplicateQueueFor, parseQueue, reconciliationHref } from "@/lib/reconciliation-workflow";

const candidateDecisionSchema = z.object({
  candidateId: z.string().cuid(),
  decision: z.enum(["confirm", "ignore", "defer", "reopen"]),
  expectedUpdatedAt: z.string().datetime(),
  note: z.string().trim().max(2000).optional()
});

const manualFlagSchema = z.object({
  saintId: z.string().cuid(),
  candidateSaintId: z.string().cuid(),
  note: z.string().trim().max(1000).optional(),
  returnTo: z.string()
}).refine((value) => value.saintId !== value.candidateSaintId, "Choose a different saint.");

export async function runSaintDuplicateScan() {
  await assertCapability("resolve_duplicate_saints");
  const saints = await db.saint.findMany({
    select: {
      id: true,
      displayName: true,
      canonicalName: true,
      birthYear: true,
      birthYearEnd: true,
      samadhiYear: true,
      samadhiYearEnd: true,
      aliases: { select: { alias: true } },
      places: { select: { placeId: true } },
      traditions: { select: { traditionId: true } }
    }
  });
  const candidates = buildSaintDuplicateCandidates(saints);
  const existing = await db.duplicateCandidate.findMany({
    where: { entityType: "Saint" },
    select: { id: true, entityId: true, candidateEntityId: true, sourceType: true, sourceExternalId: true }
  });
  const existingByPair = new Map(existing.filter((candidate) => candidate.entityId && candidate.candidateEntityId).map((candidate) => [
    duplicatePairKey(candidate.entityId!, candidate.candidateEntityId!),
    candidate
  ]));
  let created = 0;
  let refreshed = 0;

  for (const candidate of candidates) {
    const sourceExternalId = `database-scan:${duplicatePairKey(candidate.entityId, candidate.candidateEntityId)}`;
    const existingCandidate = existingByPair.get(duplicatePairKey(candidate.entityId, candidate.candidateEntityId));
    const data = {
      confidence: candidate.confidence,
      evidenceJson: candidate.evidence as Prisma.InputJsonValue,
      message: candidate.evidence.reasons.join(" · ")
    };
    if (existingCandidate?.sourceType === "database_scan") {
      await db.duplicateCandidate.update({ where: { id: existingCandidate.id }, data });
      refreshed += 1;
    } else if (existingCandidate) {
      refreshed += 1;
    } else {
      await db.duplicateCandidate.upsert({
        where: {
          entityType_entityId_candidateEntityId_sourceType_sourceExternalId: {
            entityType: "Saint",
            entityId: candidate.entityId,
            candidateEntityId: candidate.candidateEntityId,
            sourceType: "database_scan",
            sourceExternalId
          }
        },
        create: {
          entityType: "Saint",
          entityId: candidate.entityId,
          candidateEntityId: candidate.candidateEntityId,
          sourceType: "database_scan",
          sourceExternalId,
          ...data
        },
        update: data
      });
      created += 1;
    }
  }

  revalidateDuplicatePaths();
  redirect(duplicateQueueHref({ created: String(created), refreshed: String(refreshed), scanned: String(saints.length) }));
}

export async function flagSaintDuplicate(formData: FormData) {
  const actor = await assertCapability("resolve_duplicate_saints");
  const parsed = manualFlagSchema.safeParse({
    saintId: formData.get("saintId"),
    candidateSaintId: formData.get("candidateSaintId"),
    note: formData.get("note") || undefined,
    returnTo: formData.get("returnTo")
  });
  if (!parsed.success) redirect(detailHref(formData.get("returnTo"), "duplicateError", parsed.error.issues[0]?.message || "Choose a valid saint."));
  const [entityId, candidateEntityId] = [parsed.data.saintId, parsed.data.candidateSaintId].sort();
  const saints = await db.saint.findMany({ where: { id: { in: [entityId, candidateEntityId] } }, select: { id: true, displayName: true } });
  if (saints.length !== 2) redirect(detailHref(parsed.data.returnTo, "duplicateError", "One of those saint records no longer exists."));

  const existing = await db.duplicateCandidate.findFirst({
    where: { entityType: "Saint", entityId, candidateEntityId },
    orderBy: { createdAt: "asc" }
  });
  if (existing?.status === "ignored") redirect(detailHref(parsed.data.returnTo, "duplicateError", "This pair was already reviewed as not duplicate. Reopen it from Reconciliation if needed."));

  if (!existing) {
    const nameById = new Map(saints.map((saint) => [saint.id, saint.displayName]));
    await db.duplicateCandidate.create({
      data: {
        entityType: "Saint",
        entityId,
        candidateEntityId,
        sourceType: "manual",
        sourceExternalId: `manual:${duplicatePairKey(entityId, candidateEntityId)}`,
        confidence: "medium",
        evidenceJson: {
          version: 1,
          flaggedById: actor.id,
          names: [nameById.get(entityId), nameById.get(candidateEntityId)].filter((name): name is string => Boolean(name)),
          note: parsed.data.note ?? null
        },
        message: parsed.data.note || "Flagged during individual saint review."
      }
    });
  }

  revalidateDuplicatePaths();
  redirect(detailHref(parsed.data.returnTo, "duplicateUpdated", existing?.status === "resolved" ? "confirmed" : "flagged"));
}

export async function reviewDuplicateCandidate(formData: FormData) {
  const actor = await assertCapability("resolve_duplicate_saints");
  const queue = parseQueue("duplicates", String(formData.get("queue") || ""));
  function fail(error: string): never {
    redirect(reconciliationHref("duplicates", queue, { error }) as Route);
  }
  const parsed = candidateDecisionSchema.safeParse({
    candidateId: formData.get("candidateId"),
    decision: formData.get("decision"),
    expectedUpdatedAt: formData.get("expectedUpdatedAt"),
    note: formData.get("note") || undefined
  });
  if (!parsed.success) fail("Invalid duplicate decision. Reload the review and try again.");
  const { candidateId, decision, note, expectedUpdatedAt } = parsed.data;
  const outcome = duplicateDecisionUpdate(decision);
  let error: string | null;
  try {
    error = await db.$transaction(async (tx) => {
      const candidate = await tx.duplicateCandidate.findUnique({ where: { id: candidateId } });
      if (!candidate || candidate.entityType !== "Saint") return "That saint duplicate candidate is unavailable.";
      const invalid = decisionError(candidate.status, decision, note, duplicateQueueFor(candidate) === "merged");
      if (invalid) return invalid;
      if (decision === "confirm" || decision === "reopen") {
        const ids = [candidate.entityId, candidate.candidateEntityId].filter((id): id is string => Boolean(id));
        if (new Set(ids).size !== 2 || await tx.saint.count({ where: { id: { in: ids } } }) !== 2) {
          return "Both saint records must still exist before this pair can be reviewed.";
        }
      }
      const data = {
        status: outcome.status, resolutionAction: decision, reviewedById: actor.id,
        resolvedAt: outcome.finalized ? new Date() : null,
        resolutionNotes: decision === "reopen" ? null : note ?? null
      };
      const updated = await tx.duplicateCandidate.updateMany({
        where: { id: candidateId, updatedAt: new Date(expectedUpdatedAt) }, data
      });
      if (updated.count !== 1) return "This pair changed since you opened it. Reload and review the latest decision.";
      await tx.auditEvent.create({ data: {
        userId: actor.id, action: "review_duplicate", entityType: "DuplicateCandidate", entityId: candidateId,
        beforeJson: { status: candidate.status, action: candidate.resolutionAction, note: candidate.resolutionNotes },
        afterJson: { status: data.status, action: decision, note: data.resolutionNotes }
      } });
      return null;
    });
  } catch {
    fail("The decision could not be saved. Reload the review and try again.");
  }
  if (error) fail(error);
  revalidateDuplicatePaths();
  redirect(reconciliationHref("duplicates", duplicateQueueFor({ status: outcome.status, resolutionAction: decision }), {
    updated: decision, candidate: candidateId, anchor: `duplicate-${candidateId}`
  }) as Route);
}

function revalidateDuplicatePaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/source-data/reconciliation");
  revalidatePath("/admin/saints");
}

function duplicateQueueHref(params: Record<string, string>) {
  return `/admin/source-data/reconciliation?view=duplicates&${new URLSearchParams(params).toString()}` as Route;
}

function detailHref(value: FormDataEntryValue | string | null, key: "duplicateError" | "duplicateUpdated", message: string) {
  const returnTo = typeof value === "string" && /^\/admin\/saints\/[a-z0-9-]+$/.test(value) ? value : "/admin/saints";
  return `${returnTo}?${new URLSearchParams({ [key]: message }).toString()}` as Route;
}
