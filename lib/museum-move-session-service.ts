import { createHash } from "node:crypto";
import { Prisma } from "./generated/prisma/client";
import { db } from "./db";
import { resolveMuseumPhysicalCurrent, storedPhysicalLocation } from "./museum-physical-location-current";
import { readLegacyCurrentForSnapshot } from "./museum-move-session-source";
import { assertSpnMovementAllowed } from "./spn-movement-holds";
import {assertBilashGuideTarget,bilashFollowup} from "./spn-bilash-followup";
import {readMuseumData} from "./museum-working-data";
import { createMoveSession, moveSessionAction, moveSnapshot, moveLocation, sameMoveLocation, assertDistinctMoveSources, assertWholeCaseClearing, MuseumMoveSessionError, type MoveSnapshot, type MoveLocation } from "./museum-move-session-domain";
export type MoveSessionActor = { id: string; canManage: boolean };
export type MoveSnapshotLoader = (version: string, tx: Prisma.TransactionClient) => Promise<MoveSnapshot>;
const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const fingerprint = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
type Session = Prisma.MuseumMoveSessionGetPayload<Record<string, never>>;
function manage(actor: MoveSessionActor) { if (!actor.canManage) throw new MuseumMoveSessionError(403, "A museum curator must record physical moves."); }
async function lock(tx: Prisma.TransactionClient) { await tx.$queryRaw`SELECT true FROM pg_advisory_xact_lock(hashtext('museum-move-session:spn'))`; }
async function present(session: Session, tx: Prisma.TransactionClient) {
  const snapshot = moveSnapshot.parse(session.snapshot);
  const current = await tx.museumMoveCurrentLocation.findMany({ where: { museumId: session.museumId } });
  const events = await tx.museumMoveSessionEvent.findMany({ where: { sessionId: session.id }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], select: { id: true, action: true, beforeJson: true, afterJson: true, createdAt: true } });
  const latestLegacy = await readLegacyCurrentForSnapshot(snapshot, tx);
  const starting = session.startingSnapshot as Record<string, Prisma.JsonValue>;
  return { id: session.id, museumId: session.museumId, version: session.version, status: session.status, proposalVersion: session.proposalVersion, title: snapshot.title, guidance: snapshot.guidance, sourceSnapshotAt: snapshot.sourceSnapshotAt ?? null, initialEmptyVitrines: snapshot.initialEmptyVitrines ?? [], unmappedCurrentLocations: current.filter(position => !snapshot.rows.some(row => row.sourceId === position.sourceId)).flatMap(position => { const location = storedPhysicalLocation(position.location); return location ? [{ sourceId: position.sourceId, location, version: position.version }] : []; }), tables: session.tables, createdAt: session.createdAt, events,
    rows: snapshot.rows.map(row => {
      const saved = current.find(location => location.sourceId === row.sourceId);
      const legacy = latestLegacy.get(row.sourceId) ?? row.legacyConfirmed;
      return { ...row, original: row.sourceReported, sessionStarting: starting[row.sourceId], ...resolveMuseumPhysicalCurrent(row.sourceReported, saved, legacy) };
    }) };
}
export async function readMuseumMoveSession(museumId: string, sessionId?: string) {
  if (museumId !== "museum-spn") throw new MuseumMoveSessionError(400, "Choose the SPN museum.");
  const session = await db.museumMoveSession.findFirst({ where: { museumId, ...(sessionId ? { id: sessionId } : { status: "active" }) }, orderBy: { createdAt: "desc" } });
  return { session: session ? await present(session, db) : null };
}
export async function startMuseumMoveSession(raw: unknown, actor: MoveSessionActor, loader: MoveSnapshotLoader) {
  manage(actor); const input = createMoveSession.parse(raw);
  return db.$transaction(async tx => {
    await lock(tx);
    const prior = await tx.museumMoveSession.findUnique({ where: { museumId_clientRequestId: { museumId: input.museumId, clientRequestId: input.clientRequestId } } });
    if (prior) {
      if (prior.proposalVersion !== input.proposalVersion) throw new MuseumMoveSessionError(409, "This request already belongs to a different proposal.");
      return { session: await present(prior, tx) };
    }
    if (await tx.museumMoveSession.findFirst({ where: { museumId: input.museumId, status: "active" } })) throw new MuseumMoveSessionError(409, "An SPN move session is already active. Continue it or close it before starting another.");
    const snapshot = moveSnapshot.parse(await loader(input.proposalVersion, tx));
    if (snapshot.proposalVersion !== input.proposalVersion) throw new MuseumMoveSessionError(409, "The registered proposal changed. Reload it before starting.");
    const current = await tx.museumMoveCurrentLocation.findMany({ where: { museumId: input.museumId } });
    if (current.some(location => storedPhysicalLocation(location.location)?.kind === "table")) throw new MuseumMoveSessionError(409, "Displays remain in the Staging area. Continue their session before starting a new one.");
    const starting = Object.fromEntries(snapshot.rows.map(row => {
      const saved = current.find(location => location.sourceId === row.sourceId);
      const resolved = resolveMuseumPhysicalCurrent(row.sourceReported, saved, row.legacyConfirmed);
      return [row.sourceId, { location: resolved.current, basis: resolved.currentBasis, version: resolved.currentVersion }];
    }));
    const session = await tx.museumMoveSession.create({ data: { museumId: input.museumId, proposalVersion: input.proposalVersion, snapshot: json(snapshot), startingSnapshot: json(starting), tables: [{ id: "staging-area", label: "Staging area" }], clientRequestId: input.clientRequestId, createdById: actor.id } });
    await tx.auditEvent.create({ data: { userId: actor.id, action: "museum.move_session.started", entityType: "MuseumMoveSession", entityId: session.id, afterJson: { museumId: input.museumId, proposalVersion: input.proposalVersion, sourceRows: snapshot.rows.length } } });
    return { session: await present(session, tx) };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 60_000 });
}
export async function updateMuseumMoveSession(raw: unknown, actor: MoveSessionActor) {
  manage(actor); const input = moveSessionAction.parse(raw);
  return db.$transaction(async tx => {
    await lock(tx);
    const session = await tx.museumMoveSession.findUnique({ where: { id: input.sessionId } });
    if (!session || session.museumId !== "museum-spn") throw new MuseumMoveSessionError(404, "Move session not found.");
    const hash = fingerprint(input);
    const retry = await tx.museumMoveSessionEvent.findUnique({ where: { sessionId_clientRequestId: { sessionId: session.id, clientRequestId: input.clientRequestId } } });
    if (retry) {
      if (retry.fingerprint !== hash) throw new MuseumMoveSessionError(409, "This request was already used for a different action.");
      return { session: await present(session, tx) };
    }
    if (session.status !== "active" || session.version !== input.expectedSessionVersion) throw new MuseumMoveSessionError(409, "This session changed. Reload it before recording a move.");
    const snapshot = moveSnapshot.parse(session.snapshot);
    const tables = session.tables as { id: string; label: string }[];
    let before: unknown = { version: session.version }, after: unknown;
    if (input.action === "move") {
      assertDistinctMoveSources(input.moves);
      if(!input.clearedVitrines?.length&&input.moves.some(move=>move.sourceId===bilashFollowup.sourceId&&move.to.kind==="vitrine"&&move.to.code==="57"))
        assertBilashGuideTarget(input.moves,(await readMuseumData(tx)).placements);
      if (!input.moves.length && !input.clearedVitrines?.length) throw new MuseumMoveSessionError(400, "Choose displays or confirm a cleared vitrine.");
      if (input.clearedVitrines?.some(code => !snapshot.vitrineCodes.includes(code))) throw new MuseumMoveSessionError(400, "Choose vitrines in this registered layout.");
      const currentView = await present(session, tx);
      if (input.clearedVitrines?.length) {
        assertWholeCaseClearing(input.clearedVitrines, [...currentView.rows.map(row => ({ sourceId: row.sourceId, current: row.current })), ...currentView.unmappedCurrentLocations.map(row => ({ sourceId: row.sourceId, current: storedPhysicalLocation(row.location) }))], input.moves);
      }
      const positions = await tx.museumMoveCurrentLocation.findMany({ where: { museumId: session.museumId, sourceId: { in: input.moves.map(move => move.sourceId) } } });
      const changes: { sourceId: string; from: MoveLocation | null; to: MoveLocation; beforeVersion: number }[] = [];
      for (const move of input.moves) {
        const row = snapshot.rows.find(row => row.sourceId === move.sourceId), saved = positions.find(position => position.sourceId === move.sourceId);
        if (!row) throw new MuseumMoveSessionError(400, "Choose a source display from this pinned proposal.");
        if (row.itemId || row.itemIds?.length) throw new MuseumMoveSessionError(409, "This source is linked to verified inventory. Use the existing item-move workflow so its physical history stays consistent.");
        if ((saved?.version ?? 0) !== move.expectedLocationVersion) throw new MuseumMoveSessionError(409, "A display moved since you opened this session. Reload its current location.");
        const currentRow = currentView.rows.find(current => current.sourceId === row.sourceId)!;
        if (currentRow.currentRevision !== move.expectedCurrentRevision) throw new MuseumMoveSessionError(409, "A recorded physical location changed. Reload before confirming this move.");
        const from = currentRow.current;
        let to = move.to;
        if (to.kind === "table") {
          const table = tables.find(table => table.id === to.code);
          if (!table) throw new MuseumMoveSessionError(400, "Use the Staging area for temporarily cleared displays.");
          to = { kind: "table", code: table.id, label: table.label };
        } else {
          if (!snapshot.vitrineCodes.includes(to.code)) throw new MuseumMoveSessionError(400, "Choose a vitrine in this registered layout.");
          to = { ...to, label: `Vitrine ${to.code}` };
        }
        assertSpnMovementAllowed(row.sourceId, from, to);
        if (row.fixedHousing && !sameMoveLocation(from, to)) throw new MuseumMoveSessionError(409, "This display has fixed or special housing. Resolve that restriction before moving it.");
        changes.push({ sourceId: row.sourceId, from, to, beforeVersion: saved?.version ?? 0 });
      }
      before = changes.map(change => ({ sourceId: change.sourceId, location: change.from, version: change.beforeVersion }));
      for (const change of changes) {
        await tx.museumMoveCurrentLocation.upsert({ where: { museumId_sourceId: { museumId: session.museumId, sourceId: change.sourceId } }, create: { museumId: session.museumId, sourceId: change.sourceId, location: json(change.to), confirmedAt: new Date(), confirmedById: actor.id }, update: { location: json(change.to), version: { increment: 1 }, confirmedAt: new Date(), confirmedById: actor.id } });
      }
      after = { moves: changes.map(change => ({ sourceId: change.sourceId, location: change.to, version: change.beforeVersion + 1 })), note: input.note ?? null, scope: "source_observation", clearedVitrines: input.clearedVitrines ?? [], inventoryCompleteness: "unverified", emptyClaim: input.clearedVitrines?.length ? "curator_confirmed_at_event_time" : "none" };
    } else {
      const current = await tx.museumMoveCurrentLocation.findMany({ where: { museumId: session.museumId } });
      if (current.some(position => storedPhysicalLocation(position.location)?.kind === "table")) throw new MuseumMoveSessionError(409, "Displays remain in the Staging area. Record their current placement before closing this session.");
      after = { status: "closed" };
    }
    await tx.museumMoveSessionEvent.create({ data: { sessionId: session.id, clientRequestId: input.clientRequestId, fingerprint: hash, action: input.action, beforeJson: json(before), afterJson: json(after), actorId: actor.id } });
    const next = await tx.museumMoveSession.update({ where: { id: session.id }, data: { version: { increment: 1 }, ...(input.action === "close" ? { status: "closed" } : {}) } });
    return { session: await present(next, tx) };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 60_000 });
}
