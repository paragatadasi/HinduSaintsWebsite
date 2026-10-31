import { db } from "./db";
import {spnPhysicalExecutionHold} from "./museum-case-execution-holds";
import { Prisma } from "./generated/prisma/client";
import { MuseumMoveSessionError } from "./museum-move-session-domain";
import { physicalFingerprint } from "./museum-physical-location-current";
import { readPhysicalLocationView, type PhysicalSnapshotLoader } from "./museum-physical-locations";
import { assertHistoricalStagingSelection, historicalStagingInput, historicalStagingPreview, historicalStarterCases } from "./museum-historical-staging-domain";
import type { MoveSessionActor } from "./museum-move-session-service";

const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const action = "museum.physical_location.confirmed";
const entityType = "MuseumPhysicalConfirmation";

export async function readHistoricalStaging(loader: PhysicalSnapshotLoader) {
  return historicalStagingPreview((await readPhysicalLocationView(loader, db, undefined, false)).rows);
}

export async function reconcileHistoricalStaging(raw: unknown, actor: MoveSessionActor, loader: PhysicalSnapshotLoader) {
  if (!actor.canManage) throw new MuseumMoveSessionError(403, "A museum curator must reconcile staging records.");
  const input = historicalStagingInput.parse(raw);
  const fingerprint = physicalFingerprint({ ...input, records: [...input.records].sort((a, b) => a.sourceId.localeCompare(b.sourceId)) });
  return db.$transaction(async tx => {
    await tx.$queryRaw`SELECT true FROM pg_advisory_xact_lock(hashtext('museum-move-session:spn'))`;
    const entityId = `${input.museumId}:${input.clientRequestId}`;
    const prior = await tx.auditEvent.findFirst({ where: { action, entityType, entityId }, select: { id: true, afterJson: true } });
    if (prior) {
      const data = prior.afterJson;
      if (!data || typeof data !== "object" || Array.isArray(data) || data.fingerprint !== fingerprint)
        throw new MuseumMoveSessionError(409, "This request already recorded another correction. Reload before saving.");
      return { receipt: prior, replayed: true, preview: historicalStagingPreview((await readPhysicalLocationView(loader, tx, undefined, false)).rows) };
    }
    const current = await readPhysicalLocationView(loader, tx, undefined, false);
    const preview = historicalStagingPreview(current.rows);
    assertHistoricalStagingSelection(input, preview);
    const recordedAt = new Date();
    const location = { kind: "table" as const, code: "staging-area", label: "Staging area" };
    const moves = preview.eligible.map(record => {
      const row = current.rows.find(row => row.sourceId === record.sourceId)!;
      const hold = spnPhysicalExecutionHold(row.current, location);
      if (hold) throw new MuseumMoveSessionError(409, hold);
      return { sourceId: row.sourceId, sourceKey: row.sourceKey, saintId: row.saintId, name: row.name,
        original: row.original, previous: row.current,
        previousState: { basis: row.currentBasis, location: row.current, effectiveConfirmedAt: null },
        location, version: row.currentVersion + 1 };
    });
    for (const move of moves) await tx.museumMoveCurrentLocation.upsert({
      where: { museumId_sourceId: { museumId: input.museumId, sourceId: move.sourceId } },
      create: { museumId: input.museumId, sourceId: move.sourceId, location: json(location), confirmedAt: recordedAt, confirmedById: actor.id },
      update: { location: json(location), version: { increment: 1 }, confirmedAt: recordedAt, confirmedById: actor.id }
    });
    const receipt = await tx.auditEvent.create({ data: { userId: actor.id, action, entityType, entityId,
      beforeJson: json(preview.eligible), afterJson: json({
        museumId: input.museumId, fingerprint, clientRequestId: input.clientRequestId,
        recordedAt: recordedAt.toISOString(), confirmedDate: input.reportedDate, datePrecision: "date",
        evidence: "Curator reports the starter cases were cleared before work began and confirms these remaining source entries are still in staging. Later confirmed placements are preserved.",
        scope: "source_observation", moves, guideContext: null, clearedVitrines: [],
        historicalClearance: { reportedClearedVitrines: historicalStarterCases, clearanceDate: null, reportDate: input.reportedDate,
          preservedConfirmedCount: preview.preservedConfirmedCount, blockedSourceIds: preview.blocked.map(row => row.sourceId) },
        inventoryCompleteness: "unverified", emptyCaseClaim: "none", proposalChanged: false, sourceChanged: false
      }) }, select: { id: true, afterJson: true } });
    return { receipt, replayed: false, preview: historicalStagingPreview((await readPhysicalLocationView(loader, tx, undefined, false)).rows) };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 60_000 });
}
