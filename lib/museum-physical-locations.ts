import { memoizePhysicalSnapshot } from "./museum-physical-snapshot-cache";
import { physicalUndoInput, physicalUndoOffer } from "./museum-physical-undo-domain";
import { assertGuidePhysicalScope } from "./spn-datta-guide";
import { z } from "zod";
import { assertSpnMovementAllowed, spnMovementBlockedReason } from "./spn-movement-holds";
import { db } from "./db";
import { Prisma } from "./generated/prisma/client";
import { moveSnapshot, moveLocation, sameMoveLocation, assertDistinctMoveSources, assertWholeCaseClearing, MuseumMoveSessionError, type MoveSnapshot } from "./museum-move-session-domain";
import { readStarterGuideDefinition, registeredStarterGuide, starterGuideContext } from "./spn-starter-guide-registry";
import { physicalFingerprint, resolveMuseumPhysicalCurrent, storedPhysicalLocation } from "./museum-physical-location-current";
import type { MoveSessionActor } from "./museum-move-session-service";

export type PhysicalSnapshotLoader = (tx: Prisma.TransactionClient) => Promise<MoveSnapshot>;
const confirmedDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
});
export const physicalConfirmationInput = z.object({ museumId: z.literal("museum-spn"), clientRequestId: z.string().uuid(),
  confirmedDate, datePrecision: z.literal("date"), evidence: z.string().trim().min(1).max(2000),
  physicalConfirmation: z.literal(true), inventoryAcknowledged: z.literal(true),
  guideContext: z.object({ guideVersion: z.string().min(1).max(200), contentDigest: z.string().regex(/^[a-f0-9]{64}$/), assignmentDigest: z.string().regex(/^[a-f0-9]{64}$/) }).strict().optional(),
  clearedVitrines: z.array(z.string().min(1).max(100)).max(100).optional(),
  records: z.array(z.object({ sourceId: z.string().min(1).max(200), saintId: z.string().nullable(),
    expectedCurrentRevision: z.string().regex(/^[a-f0-9]{64}$/), expectedSourceRevision: z.string().regex(/^[a-f0-9]{64}$/),
    expectedLocationVersion: z.number().int().nonnegative(),
    to: moveLocation }).strict()).max(200)
}).strict().refine(input => input.records.length > 0 || Boolean(input.clearedVitrines?.length), "Choose source records or confirm a cleared vitrine.");
const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const action = "museum.physical_location.confirmed";
const receiptType = "MuseumPhysicalConfirmation";

export async function readPhysicalLocationView(loader: PhysicalSnapshotLoader, tx: Prisma.TransactionClient, sourceIds?: string[], includeUndo = true) {
  const snapshot = moveSnapshot.parse(await loader(tx));
  const selected = sourceIds ? snapshot.rows.filter(row => sourceIds.includes(row.sourceId)) : snapshot.rows;
  if (sourceIds?.some(id => !selected.some(row => row.sourceId === id))) throw new MuseumMoveSessionError(409, "A source record changed. Reload the inventory before recording its location.");
  const [positions, links] = await Promise.all([
    tx.museumMoveCurrentLocation.findMany({ where: { museumId: "museum-spn", ...(sourceIds ? { sourceId: { in: sourceIds } } : {}) } }),
    tx.externalRecord.findMany({ where: { sourceType: "airtable", externalId: { in: selected.flatMap(row => row.sourceKey ? [row.sourceKey] : []) } }, select: { externalId: true, entityType: true, entityId: true } })
  ]);
  const rows = selected.map(row => {
    const link = links.find(link => link.externalId === row.sourceKey);
    const identityChanged = Boolean(row.saintId && (!link || link.entityType !== "Saint" || link.entityId !== row.saintId));
    const current = resolveMuseumPhysicalCurrent(row.sourceReported, positions.find(position => position.sourceId === row.sourceId), row.legacyConfirmed);
    return { sourceId: row.sourceId, sourceKey: row.sourceKey ?? null, saintId: row.saintId, name: row.name,
      original: row.sourceReported, legacyConfirmed: row.legacyConfirmed ?? null, proposalDestination: row.destination, proposalVersion: snapshot.proposalVersion,
      fixedHousing: row.fixedHousing, movementBlockedReason: spnMovementBlockedReason(row.sourceId), verifiedItemIds: [...new Set([...(row.itemIds ?? []), ...(row.itemId ? [row.itemId] : [])])], identityChanged,
      sourceRevision: physicalFingerprint({ sourceId: row.sourceId, sourceKey: row.sourceKey, saintId: row.saintId, original: row.sourceReported, link, itemIds: row.itemIds ?? [], fixedHousing: row.fixedHousing }),
      ...current };
  });
  const confirmedRows = (includeUndo ? rows : []).filter(row => row.currentBasis === "confirmed" && row.currentConfirmed && !row.identityChanged && !row.verifiedItemIds.length);
  const expectedReceipts = confirmedRows.length ? Prisma.join(confirmedRows.map(row =>
    Prisma.sql`(${row.sourceId},${String(row.currentVersion)},${row.currentConfirmed!.confirmedAt})`)) : null;
  const undoReceipts = expectedReceipts ? await tx.$queryRaw<{ id: string; afterJson: Prisma.JsonValue }[]>(Prisma.sql`
    SELECT DISTINCT event.id, event."afterJson" FROM "AuditEvent" event
    CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(event."afterJson"->'moves')='array' THEN event."afterJson"->'moves' ELSE '[]'::jsonb END) movement
    JOIN (VALUES ${expectedReceipts}) expected("sourceId",version,"confirmedAt")
      ON movement.value->>'sourceId'=expected."sourceId" AND movement.value->>'version'=expected.version
      AND event."afterJson"->>'recordedAt'=expected."confirmedAt"
    WHERE event.action=${action} AND event."entityType"=${receiptType}
      AND event."afterJson"->>'museumId'='museum-spn'
  `) : [];
  return { museumId: "museum-spn" as const, sourceSnapshotAt: snapshot.sourceSnapshotAt ?? null, rows: rows.map(row => ({ ...row, undo: physicalUndoOffer(row, undoReceipts) })), vitrineCodes: snapshot.vitrineCodes,
    unmappedCurrentLocations: positions.filter(position => !snapshot.rows.some(row => row.sourceId === position.sourceId)).flatMap(position => { const location = storedPhysicalLocation(position.location); return location ? [{ sourceId: position.sourceId, location, version: position.version, recordedAt: position.confirmedAt }] : []; }) };
}

export async function readMuseumPhysicalLocations(loader: PhysicalSnapshotLoader, sourceIds?: string[]) {
  const current = await readPhysicalLocationView(loader, db, sourceIds);
  const [confirmationHistory, reportedPlacementReceipts] = await Promise.all([
    db.auditEvent.findMany({ where: { action, entityType: receiptType, entityId: { startsWith: "museum-spn:" } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 100, select: { id: true, createdAt: true, afterJson: true } }),
    readReportedPlacementReceipts()
  ]);
  const corrections = await db.auditEvent.findMany({ where: { action: "museum.physical_location.check_undone", entityType: "MuseumPhysicalCheckUndo", entityId: { startsWith: "museum-spn:" } }, select: { afterJson: true } });
  const corrected = corrections.flatMap(event => {
    const value = event.afterJson;
    return value && typeof value === "object" && !Array.isArray(value) && typeof value.targetReceiptId === "string" && typeof value.sourceId === "string"
      ? [{ receiptId: value.targetReceiptId, sourceId: value.sourceId }] : [];
  });
  const activeHistory = confirmationHistory.map(event => {
    const value = event.afterJson;
    if (!value || typeof value !== "object" || Array.isArray(value) || !Array.isArray(value.moves)) return event;
    return { ...event, afterJson: { ...value, moves: value.moves.filter(move => !move || typeof move !== "object" || Array.isArray(move) || !corrected.some(c => c.receiptId === event.id && c.sourceId === move.sourceId)) } };
  });
  return { ...current, confirmationHistory: activeHistory, reportedPlacementReceipts };
}

export async function readReportedPlacementReceipts(tx: Prisma.TransactionClient = db,
  reported: { sourceId: string; currentLocation: { vitrine: string }; confirmedDate: string }[] = registeredStarterGuide.physicalConfirmations.moves) {
  if (!reported.length) return { guideContext: starterGuideContext, expectedCount: 0, matchedCount: 0, complete: true, matched: [], outstandingSourceIds: [] };
  const expected = Prisma.join(reported.map(row => Prisma.sql`(${row.sourceId},${row.currentLocation.vitrine},${row.confirmedDate})`));
  const matched = await tx.$queryRaw<{ sourceId: string; receiptId: string; recordedAt: Date; confirmedDate: string; vitrine: string }[]>(Prisma.sql`
    SELECT DISTINCT ON (expected."sourceId") expected."sourceId", event.id AS "receiptId", event."createdAt" AS "recordedAt",
      event."afterJson"->>'confirmedDate' AS "confirmedDate", expected.vitrine AS vitrine
    FROM "AuditEvent" event
    CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(event."afterJson"->'moves')='array' THEN event."afterJson"->'moves' ELSE '[]'::jsonb END) movement
    JOIN (VALUES ${expected}) AS expected("sourceId",vitrine,"confirmedDate")
      ON movement.value->>'sourceId'=expected."sourceId" AND movement.value->'location'->>'kind'='vitrine'
      AND movement.value->'location'->>'code'=expected.vitrine
    WHERE event.action=${action} AND event."entityType"=${receiptType}
      AND event."afterJson"->>'museumId'='museum-spn' AND event."afterJson"->>'confirmedDate'>=expected."confirmedDate"
      AND NOT EXISTS (SELECT 1 FROM "AuditEvent" correction
        WHERE correction.action='museum.physical_location.check_undone' AND correction."entityType"='MuseumPhysicalCheckUndo'
          AND correction."afterJson"->>'museumId'='museum-spn'
          AND correction."afterJson"->>'targetReceiptId'=event.id AND correction."afterJson"->>'sourceId'=expected."sourceId")
    ORDER BY expected."sourceId", event."createdAt" DESC, event.id DESC
  `);
  const ids = new Set(matched.map(row => row.sourceId));
  return { guideContext: starterGuideContext, expectedCount: reported.length, matchedCount: ids.size, complete: ids.size === reported.length,
    matched, outstandingSourceIds: reported.filter(row => !ids.has(row.sourceId)).map(row => row.sourceId) };
}

export async function confirmMuseumPhysicalLocations(raw: unknown, actor: MoveSessionActor, loader: PhysicalSnapshotLoader) {
  if (!actor.canManage) throw new MuseumMoveSessionError(403, "A museum curator must record physical locations.");
  loader = memoizePhysicalSnapshot(loader);
  const input = physicalConfirmationInput.parse(raw);
  assertDistinctMoveSources(input.records);
  if (input.guideContext) {
    const definition = readStarterGuideDefinition(input.guideContext.guideVersion);
    assertGuidePhysicalScope(definition, input.records, input.clearedVitrines);
    const registered = definition.context;
    if (registered.contentDigest !== input.guideContext.contentDigest || registered.assignmentDigest !== input.guideContext.assignmentDigest) throw new MuseumMoveSessionError(409, "The guide content changed. Reload it before recording a placement.");
  }
  return db.$transaction(async tx => {
    // Share the session lock: both workflows update the same source-current ledger.
    await tx.$queryRaw`SELECT true FROM pg_advisory_xact_lock(hashtext('museum-move-session:spn'))`;
    const entityId = `${input.museumId}:${input.clientRequestId}`, fingerprint = physicalFingerprint(input);
    const retry = await tx.auditEvent.findFirst({ where: { action, entityType: receiptType, entityId }, select: { id: true, afterJson: true } });
    if (retry) {
      const receipt = retry.afterJson as { fingerprint?: string } | null;
      if (receipt?.fingerprint !== fingerprint) throw new MuseumMoveSessionError(409, "This request already recorded different locations. Reload before recording another confirmation.");
      return { ...await readPhysicalLocationView(loader, tx, input.records.map(row => row.sourceId)), receipt: retry, replayed: true };
    }
    const current = await readPhysicalLocationView(loader, tx, input.clearedVitrines?.length ? undefined : input.records.map(row => row.sourceId));
    if (input.clearedVitrines?.some(code => !current.vitrineCodes.includes(code))) throw new MuseumMoveSessionError(400, "Choose cleared vitrines in this museum's layout.");
    if (input.clearedVitrines?.length) assertWholeCaseClearing(input.clearedVitrines, [...current.rows.map(row => ({ sourceId: row.sourceId, current: row.current })), ...current.unmappedCurrentLocations.map(row => ({ sourceId: row.sourceId, current: row.location }))], input.records);
    const changes = input.records.map(record => {
      const row = current.rows.find(row => row.sourceId === record.sourceId);
      if (!row) throw new MuseumMoveSessionError(409, "This source is not in the current inventory snapshot. Reload before confirming it.");
      if (row.identityChanged || row.saintId !== record.saintId || row.sourceRevision !== record.expectedSourceRevision) throw new MuseumMoveSessionError(409, "A source identity or its evidence changed. Reload and check the source before confirming.");
      if (row.verifiedItemIds.length) throw new MuseumMoveSessionError(409, "This source has verified inventory items. Record their moves through the item workflow.");
      if (row.currentVersion !== record.expectedLocationVersion || row.currentRevision !== record.expectedCurrentRevision) throw new MuseumMoveSessionError(409, "A physical location changed. Reload it before recording this confirmation.");
      let to = record.to;
      if (to.kind === "table") {
        if (to.code !== "staging-area") throw new MuseumMoveSessionError(400, "Use the Staging area for temporarily cleared displays.");
        to = { kind: "table", code: "staging-area", label: "Staging area" };
      } else {
        if (!current.vitrineCodes.includes(to.code)) throw new MuseumMoveSessionError(400, "Choose a vitrine in this museum's layout.");
        to = { ...to, label: `Vitrine ${to.code}` };
      }
      assertSpnMovementAllowed(row.sourceId, row.current, to);
      if (row.fixedHousing && !sameMoveLocation(row.current, to)) throw new MuseumMoveSessionError(409, "This display has fixed or special housing. Review that restriction before moving it.");
      return { sourceId: row.sourceId, sourceKey: row.sourceKey, saintId: row.saintId, name: row.name, original: row.original,
        previous: row.current, previousState: { basis: row.currentBasis, location: row.current, effectiveConfirmedAt: row.currentConfirmed?.confirmedAt ?? null }, location: to, version: row.currentVersion + 1 };
    });
    const recordedAt = new Date();
    for (const change of changes) await tx.museumMoveCurrentLocation.upsert({
      where: { museumId_sourceId: { museumId: input.museumId, sourceId: change.sourceId } },
      create: { museumId: input.museumId, sourceId: change.sourceId, location: json(change.location), confirmedAt: recordedAt, confirmedById: actor.id },
      update: { location: json(change.location), version: { increment: 1 }, confirmedAt: recordedAt, confirmedById: actor.id }
    });
    const receipt = await tx.auditEvent.create({ data: { userId: actor.id, action, entityType: receiptType, entityId,
      beforeJson: json(current.rows.map(row => ({ sourceId: row.sourceId, current: row.current, version: row.currentVersion }))),
      afterJson: json({ museumId: input.museumId, fingerprint, clientRequestId: input.clientRequestId, confirmedDate: input.confirmedDate,
        datePrecision: input.datePrecision, recordedAt: recordedAt.toISOString(), evidence: input.evidence, scope: "source_observation", moves: changes,
        guideContext: input.guideContext ?? null, clearedVitrines: input.clearedVitrines ?? [], inventoryCompleteness: "unverified",
        emptyCaseClaim: input.clearedVitrines?.length ? "curator_confirmed_at_event_time" : "none", proposalChanged: false, sourceChanged: false }) }, select: { id: true, afterJson: true } });
    return { ...await readPhysicalLocationView(loader, tx, input.records.map(row => row.sourceId)), receipt, replayed: false };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 60_000 });
}

export async function undoMuseumPhysicalCheck(raw: unknown, actor: MoveSessionActor, loader: PhysicalSnapshotLoader) {
  if (!actor.canManage) throw new MuseumMoveSessionError(403, "A museum curator must correct placement checks.");
  loader = memoizePhysicalSnapshot(loader);
  const input = physicalUndoInput.parse(raw);
  return db.$transaction(async tx => {
    await tx.$queryRaw`SELECT true FROM pg_advisory_xact_lock(hashtext('museum-move-session:spn'))`;
    const undoAction = "museum.physical_location.check_undone", entityId = `${input.museumId}:${input.clientRequestId}`;
    const fingerprint = physicalFingerprint(input);
    const retry = await tx.auditEvent.findFirst({ where: { action: undoAction, entityType: "MuseumPhysicalCheckUndo", entityId }, select: { id: true, afterJson: true } });
    if (retry) {
      if ((retry.afterJson as { fingerprint?: string } | null)?.fingerprint !== fingerprint) throw new MuseumMoveSessionError(409, "This request already corrected a different check. Reload before trying again.");
      return { ...await readPhysicalLocationView(loader, tx), receipt: retry, replayed: true };
    }
    const state = await readPhysicalLocationView(loader, tx, [input.sourceId]);
    const row = state.rows[0];
    if (!row || row.identityChanged || row.saintId !== input.saintId || row.sourceRevision !== input.expectedSourceRevision ||
      row.currentVersion !== input.expectedLocationVersion || row.currentRevision !== input.expectedCurrentRevision)
      throw new MuseumMoveSessionError(409, "This source or its physical location changed. Reload before undoing the check.");
    const offer = row.undo;
    if (!offer.available || offer.receiptId !== input.receiptId) throw new MuseumMoveSessionError(409, offer.reason ?? "This confirmation can no longer be undone.");
    const restored = { kind: "restored_recorded_state", basis: offer.previousBasis, location: offer.previous, effectiveConfirmedAt: offer.previousConfirmedAt };
    const recordedAt = new Date();
    const changed = await tx.museumMoveCurrentLocation.updateMany({ where: { museumId: input.museumId, sourceId: input.sourceId, version: input.expectedLocationVersion },
      data: { location: json(restored), version: { increment: 1 }, confirmedAt: recordedAt, confirmedById: actor.id } });
    if (changed.count !== 1) throw new MuseumMoveSessionError(409, "This location changed. Reload before undoing the check.");
    const receipt = await tx.auditEvent.create({ data: { userId: actor.id, action: undoAction, entityType: "MuseumPhysicalCheckUndo", entityId,
      beforeJson: json({ sourceId: row.sourceId, current: row.current, basis: row.currentBasis, version: row.currentVersion }),
      afterJson: json({ museumId: input.museumId, fingerprint, targetReceiptId: input.receiptId, sourceId: row.sourceId, saintId: row.saintId,
        restored, version: row.currentVersion + 1, recordedAt: recordedAt.toISOString(), correctionOnly: true, physicalReturnClaim: false,
        proposalChanged: false, sourceChanged: false }) }, select: { id: true, afterJson: true } });
    return { ...await readPhysicalLocationView(loader, tx), receipt, replayed: false };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 60_000 });
}
