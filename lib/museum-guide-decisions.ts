import { z } from "zod";
import { db } from "./db";
import { Prisma } from "./generated/prisma/client";
import { physicalFingerprint } from "./museum-physical-location-current";
import { MuseumMoveSessionError } from "./museum-move-session-domain";
import type { GuideDefinition } from "./spn-starter-guide-registry";
import type { MoveSessionActor } from "./museum-move-session-service";

export type GuideDefinitionLoader = (version: string) => GuideDefinition;
export const guideDecisionInput = z.object({ museumId: z.literal("museum-spn"), guideVersion: z.string().min(1).max(200),
  contentDigest: z.string().regex(/^[a-f0-9]{64}$/), assignmentDigest: z.string().regex(/^[a-f0-9]{64}$/),
  suggestionId: z.string().min(1).max(300), expectedVersion: z.number().int().nonnegative(), clientRequestId: z.string().uuid(),
  decision: z.enum(["pending", "deferred", "declined"]), note: z.string().trim().max(2000).optional() }).strict();
const action = "museum.guide_suggestion.decided";
const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
export async function readMuseumGuideDecisions(guideVersion: string, loader: GuideDefinitionLoader) {
  const guide = loader(guideVersion);
  return { museumId: "museum-spn", guideContext: guide.context, suggestions: guide.suggestions,
    decisions: await db.museumGuideSuggestionDecision.findMany({ where: { museumId: "museum-spn", guideVersion }, orderBy: { suggestionId: "asc" }, select: { suggestionId: true, decision: true, note: true, version: true, updatedAt: true } }) };
}
export async function saveMuseumGuideDecision(raw: unknown, actor: MoveSessionActor, loader: GuideDefinitionLoader) {
  if (!actor.canManage) throw new MuseumMoveSessionError(403, "A museum curator must review suggestions.");
  const input = guideDecisionInput.parse(raw), guide = loader(input.guideVersion);
  if (input.contentDigest !== guide.context.contentDigest || input.assignmentDigest !== guide.context.assignmentDigest) throw new MuseumMoveSessionError(409, "The guide content changed. Reload it before reviewing this suggestion.");
  const suggestion = guide.suggestions.find(row => row.id === input.suggestionId);
  if (!suggestion) throw new MuseumMoveSessionError(409, "This suggestion is not in the pinned guide. Reload the guide.");
  return db.$transaction(async tx => {
    await tx.$queryRaw`SELECT true FROM pg_advisory_xact_lock(hashtext('museum-guide-decisions:spn'))`;
    const entityId = `${input.museumId}:${input.clientRequestId}`, fingerprint = physicalFingerprint(input);
    const key = { museumId: input.museumId, guideVersion: input.guideVersion, suggestionId: input.suggestionId };
    const before = await tx.museumGuideSuggestionDecision.findUnique({ where: { museumId_guideVersion_suggestionId: key } });
    const retry = await tx.auditEvent.findFirst({ where: { action, entityType: "MuseumGuideSuggestionDecision", entityId }, select: { id: true, afterJson: true } });
    if (retry) {
      if ((retry.afterJson as { fingerprint?: string } | null)?.fingerprint !== fingerprint) throw new MuseumMoveSessionError(409, "This request already reviewed a different suggestion. Reload before trying again.");
      return { decision: before, receipt: retry, replayed: true };
    }
    if ((before?.version ?? 0) !== input.expectedVersion) throw new MuseumMoveSessionError(409, "This suggestion was reviewed elsewhere. Reload its latest decision.");
    const after = await tx.museumGuideSuggestionDecision.upsert({ where: { museumId_guideVersion_suggestionId: key },
      create: { ...key, decision: input.decision, note: input.note || null, updatedById: actor.id },
      update: { decision: input.decision, note: input.note || null, updatedById: actor.id, version: { increment: 1 } } });
    const receipt = await tx.auditEvent.create({ data: { userId: actor.id, action, entityType: "MuseumGuideSuggestionDecision", entityId,
      beforeJson: before ? json(before) : Prisma.JsonNull,
      afterJson: json({ fingerprint, guideContext: guide.context, suggestionId: suggestion.id, sourceIds: suggestion.sourceIds, kind: suggestion.kind,
        targetVitrine: suggestion.targetVitrine, decision: after, physicalLocationChanged: false, proposalChanged: false }) }, select: { id: true, afterJson: true } });
    return { decision: after, receipt, replayed: false };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30_000 });
}
