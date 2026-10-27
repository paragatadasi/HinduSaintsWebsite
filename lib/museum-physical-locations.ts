import { z } from "zod";
import { db } from "./db";
import { Prisma } from "./generated/prisma/client";
import { moveSnapshot, moveLocation, sameMoveLocation, assertDistinctMoveSources, MuseumMoveSessionError, type MoveSnapshot } from "./museum-move-session-domain";
import { physicalFingerprint, resolveMuseumPhysicalCurrent } from "./museum-physical-location-current";
import type { MoveSessionActor } from "./museum-move-session-service";

export type PhysicalSnapshotLoader = (tx: Prisma.TransactionClient) => Promise<MoveSnapshot>;
const confirmedDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
});
export const physicalConfirmationInput = z.object({ museumId: z.literal("museum-spn"), clientRequestId: z.string().uuid(),
  confirmedDate, datePrecision: z.literal("date"), evidence: z.string().trim().min(1).max(2000),
  physicalConfirmation: z.literal(true), inventoryAcknowledged: z.literal(true),
  records: z.array(z.object({ sourceId: z.string().min(1).max(200), saintId: z.string().nullable(),
    expectedCurrentRevision: z.string().regex(/^[a-f0-9]{64}$/), expectedSourceRevision: z.string().regex(/^[a-f0-9]{64}$/),
    expectedLocationVersion: z.number().int().nonnegative(),
    to: moveLocation.refine(location => location.kind === "vitrine", "Choose the confirmed vitrine.") }).strict()).min(1).max(200)
}).strict();
const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const action = "museum.physical_location.confirmed";
const receiptType = "MuseumPhysicalConfirmation";

async function view(loader: PhysicalSnapshotLoader, tx: Prisma.TransactionClient, sourceIds?: string[]) {
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
      original: row.sourceReported, proposalDestination: row.destination, proposalVersion: snapshot.proposalVersion,
      fixedHousing: row.fixedHousing, verifiedItemIds: [...new Set([...(row.itemIds ?? []), ...(row.itemId ? [row.itemId] : [])])], identityChanged,
      sourceRevision: physicalFingerprint({ sourceId: row.sourceId, sourceKey: row.sourceKey, saintId: row.saintId, original: row.sourceReported, link, itemIds: row.itemIds ?? [], fixedHousing: row.fixedHousing }),
      ...current };
  });
  return { museumId: "museum-spn" as const, sourceSnapshotAt: snapshot.sourceSnapshotAt ?? null, rows, vitrineCodes: snapshot.vitrineCodes,
    unmappedCurrentLocations: positions.filter(position => !snapshot.rows.some(row => row.sourceId === position.sourceId)).map(position => ({ sourceId: position.sourceId, location: moveLocation.parse(position.location), version: position.version, recordedAt: position.confirmedAt })) };
}

export async function readMuseumPhysicalLocations(loader: PhysicalSnapshotLoader, sourceIds?: string[]) {
  const current = await view(loader, db, sourceIds);
  return { ...current, confirmationHistory: await db.auditEvent.findMany({ where: { action, entityType: receiptType, entityId: { startsWith: "museum-spn:" } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 100, select: { id: true, createdAt: true, afterJson: true } }) };
}

export async function confirmMuseumPhysicalLocations(raw: unknown, actor: MoveSessionActor, loader: PhysicalSnapshotLoader) {
  if (!actor.canManage) throw new MuseumMoveSessionError(403, "A museum curator must record physical locations.");
  const input = physicalConfirmationInput.parse(raw);
  assertDistinctMoveSources(input.records);
  return db.$transaction(async tx => {
    // Share the session lock: both workflows update the same source-current ledger.
    await tx.$queryRaw`SELECT true FROM pg_advisory_xact_lock(hashtext('museum-move-session:spn'))`;
    const entityId = `${input.museumId}:${input.clientRequestId}`, fingerprint = physicalFingerprint(input);
    const retry = await tx.auditEvent.findFirst({ where: { action, entityType: receiptType, entityId }, select: { id: true, afterJson: true } });
    if (retry) {
      const receipt = retry.afterJson as { fingerprint?: string } | null;
      if (receipt?.fingerprint !== fingerprint) throw new MuseumMoveSessionError(409, "This request already recorded different locations. Reload before recording another confirmation.");
      return { ...await view(loader, tx, input.records.map(row => row.sourceId)), receipt: retry, replayed: true };
    }
    const current = await view(loader, tx, input.records.map(row => row.sourceId));
    const changes = input.records.map(record => {
      const row = current.rows.find(row => row.sourceId === record.sourceId)!;
      if (row.identityChanged || row.saintId !== record.saintId || row.sourceRevision !== record.expectedSourceRevision) throw new MuseumMoveSessionError(409, "A source identity or its evidence changed. Reload and check the source before confirming.");
      if (row.verifiedItemIds.length) throw new MuseumMoveSessionError(409, "This source has verified inventory items. Record their moves through the item workflow.");
      if (row.currentVersion !== record.expectedLocationVersion || row.currentRevision !== record.expectedCurrentRevision) throw new MuseumMoveSessionError(409, "A physical location changed. Reload it before recording this confirmation.");
      if (!current.vitrineCodes.includes(record.to.code)) throw new MuseumMoveSessionError(400, "Choose a vitrine in this museum's layout.");
      const to = { ...record.to, label: `Vitrine ${record.to.code}` };
      if (row.fixedHousing && !sameMoveLocation(row.current, to)) throw new MuseumMoveSessionError(409, "This display has fixed or special housing. Review that restriction before moving it.");
      return { sourceId: row.sourceId, sourceKey: row.sourceKey, saintId: row.saintId, name: row.name, original: row.original,
        previous: row.current, location: to, version: row.currentVersion + 1 };
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
        inventoryCompleteness: "unverified", emptyCaseClaim: "none", proposalChanged: false, sourceChanged: false }) }, select: { id: true, afterJson: true } });
    return { ...await view(loader, tx, input.records.map(row => row.sourceId)), receipt, replayed: false };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 60_000 });
}
