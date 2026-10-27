import proposalData from "../data/museum/spn-room-proposal-final-v8.json";
import designData from "../data/museum/spn-room-explorer-final-v8-design.json";
import { type Prisma } from "./generated/prisma/client";
import { correctSpnProposal } from "./spn-proposal-corrections";
import { reconcileSpnRoomProposal } from "./spn-room-proposal";
import { readMuseumData } from "./museum-working-data";
import { moveLocation, moveSnapshot, MuseumMoveSessionError, type MoveLocation } from "./museum-move-session-domain";

export const registeredMoveProposal = { version: proposalData.version, title: proposalData.title };
function vitrine(code: string, shelf = ""): MoveLocation | null {
  return code.trim() ? { kind: "vitrine", code: code.trim(), label: `Vitrine ${code.trim()}`, ...(shelf ? { shelf } : {}) } : null;
}
export async function readMuseumMoveSessionSource(proposalVersion: string, tx: Prisma.TransactionClient) {
  if (proposalVersion !== registeredMoveProposal.version) throw new MuseumMoveSessionError(409, "This proposal version is not registered. Reload the current proposal.");
  const { proposal } = correctSpnProposal({ proposal: proposalData, designData });
  const working = await readMuseumData(tx);
  const rows = reconcileSpnRoomProposal(proposal.rows, working.placements);
  const ids = [...new Set(rows.flatMap(row => [row.sourceId, row.baseline?.placementId].filter((id): id is string => Boolean(id))))];
  const events = await tx.auditEvent.findMany({ where: { entityType: "MuseumArrangement", entityId: { in: ids }, action: { in: ["museum.arrangement.updated", "museum.move.confirmed"] } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { entityId: true, afterJson: true } });
  const legacy = legacyMoveConfirmations(rows, events);
  return moveSnapshot.parse({ proposalVersion, title: proposal.title, sourceSnapshotAt: proposal.snapshotAt, initialEmptyVitrines: ["76","78"].map(code => ({code,asOfDate:"2026-10-27",basis:"Direct user confirmation: these two new vitrines are empty. Newer recorded occupancy takes precedence."})), vitrineCodes: proposal.layout.vitrines.map(row => row.number), guidance: { version: proposalVersion, reviewStatus: "Source-context proposal; physical fit and inventory completeness require curator review" }, rows: rows.map(row => ({ sourceId: row.sourceId, legacyPlacementId: row.baseline?.placementId, name: row.name, saintId: row.saintId, sourceReported: vitrine(row.sourceVitrine, row.sourceShelf), legacyConfirmed: legacy.get(row.sourceId) ?? null, destination: vitrine(row.effectiveVitrine), holdReason: row.reviewReason || (row.unresolved ? "Source identity remains under review" : ""), fixedHousing: ["fixed_stick_case", "full_height"].includes(row.state) })) });
}

export function legacyMoveConfirmations(rows: { sourceId: string; baseline?: { placementId: string } | null }[], events: { entityId: string | null; afterJson: Prisma.JsonValue }[]) {
  const legacy = new Map<string, { location: MoveLocation; confirmedAt: string; scope: string }>();
  for (const event of events) {
    const value = event.afterJson;
    if (!value || typeof value !== "object" || Array.isArray(value) || value.museumId !== "museum-spn" || value.status !== "Implemented" || typeof value.vitrine !== "string" || typeof value.confirmedAt !== "string" || !Number.isFinite(Date.parse(value.confirmedAt))) continue;
    const location = vitrine(value.vitrine, typeof value.shelf === "string" ? value.shelf : "");
    if (!location || !moveLocation.safeParse(location).success) continue;
    const matches = rows.filter(row => row.sourceId === event.entityId || row.baseline?.placementId === event.entityId);
    const checked = Array.isArray(value.checkedSourceIds) ? value.checkedSourceIds : [];
    for (const row of matches) {
      // A saint-level event shared by several source rows cannot establish each relic location.
      if (matches.length > 1 && !checked.includes(row.sourceId)) continue;
      if (!legacy.has(row.sourceId)) legacy.set(row.sourceId, { location, confirmedAt: new Date(value.confirmedAt).toISOString(), scope: "legacy_source_arrangement" });
    }
  }
  return legacy;
}

export async function readLegacyCurrentForSnapshot(snapshot: { rows: {sourceId:string;legacyPlacementId?:string}[] }, tx: Prisma.TransactionClient) {
  const rows = snapshot.rows.map(row => ({sourceId:row.sourceId,baseline:row.legacyPlacementId?{placementId:row.legacyPlacementId}:null}));
  const ids = [...new Set(rows.flatMap(row => [row.sourceId,row.baseline?.placementId].filter((id):id is string=>Boolean(id))))];
  const events = await tx.auditEvent.findMany({where:{entityType:"MuseumArrangement",entityId:{in:ids},action:{in:["museum.arrangement.updated","museum.move.confirmed"]}},orderBy:[{createdAt:"desc"},{id:"desc"}],select:{entityId:true,afterJson:true}});
  return legacyMoveConfirmations(rows,events);
}
