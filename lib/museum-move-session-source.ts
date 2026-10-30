import { currentSpnProposalRelease } from "./spn-current-proposal";
const { proposal: proposalData, designData } = currentSpnProposalRelease;
import { type Prisma } from "./generated/prisma/client";
import { correctSpnProposal } from "./spn-proposal-corrections";
import { reconcileSpnRoomProposal } from "./spn-room-proposal";
import { SPN_WEBSITE_AIRTABLE_BASE_ID } from "./museum-vitrine-source";
import { readMuseumData } from "./museum-working-data";
import {applyBilashFollowup} from "./spn-bilash-followup";
import {applyParamanandObjectProposal,paramanandObjectReview} from "./spn-paramanand-reviewed-object";
import { moveLocation, moveSnapshot, MuseumMoveSessionError, type MoveLocation } from "./museum-move-session-domain";

export const registeredMoveProposal = { version: proposalData.version, title: proposalData.title };
function vitrine(code: string, shelf = ""): MoveLocation | null {
  return code.trim() ? { kind: "vitrine", code: code.trim(), label: `Vitrine ${code.trim()}`, ...(shelf ? { shelf } : {}) } : null;
}
export async function readMuseumMoveSessionSource(proposalVersion: string, tx: Prisma.TransactionClient) {
  if (proposalVersion !== registeredMoveProposal.version) throw new MuseumMoveSessionError(409, "This proposal version is not registered. Reload the current proposal.");
  const { proposal } = correctSpnProposal({ proposal: proposalData, designData });
  const working = await readMuseumData(tx);
  const housingEvidenceRevision=working.placements.find(row=>row.sourceRecordId===paramanandObjectReview.sourceId)?.sourceHousingEvidenceRevision;
  const rows = reconcileSpnRoomProposal(applyParamanandObjectProposal(applyBilashFollowup(proposal.rows,working.placements),working.placements), working.placements, {acceptedBaseline:currentSpnProposalRelease.acceptedBaseline});
  const ids = [...new Set(rows.flatMap(row => [row.sourceId, row.baseline?.placementId].filter((id): id is string => Boolean(id))))];
  const events = await tx.auditEvent.findMany({ where: { entityType: "MuseumArrangement", entityId: { in: ids }, action: { in: ["museum.arrangement.updated", "museum.move.confirmed"] } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { entityId: true, afterJson: true } });
  const legacy = legacyMoveConfirmations(rows, events);
  const itemImports = await tx.museumCollectionImport.findMany({where:{museumId:"museum-spn",sourceKey:{in:rows.map(row=>`${SPN_WEBSITE_AIRTABLE_BASE_ID}:Saints:${row.sourceId}`)},item:{catalogMuseumId:"museum-spn",status:"verified",catalogMuseum:{archivedAt:null}}},select:{sourceKey:true,itemId:true}});
  const exactItems = new Map<string,string[]>();
  for(const imported of itemImports)if(imported.itemId)exactItems.set(imported.sourceKey,[...new Set([...(exactItems.get(imported.sourceKey)??[]),imported.itemId])]);
  return moveSnapshot.parse({ proposalVersion, title: proposal.title, sourceSnapshotAt: proposal.snapshotAt, initialEmptyVitrines: ["76","78"].map(code => ({code,asOfDate:"2026-10-27",basis:"Direct user confirmation: these two new vitrines are empty. Newer recorded occupancy takes precedence."})), vitrineCodes: proposal.layout.vitrines.map(row => row.number), guidance: { version: proposalVersion, reviewStatus: "Source-context proposal; physical fit and inventory completeness require curator review" }, rows: rows.map(row => ({ sourceId: row.sourceId, sourceKey:`${SPN_WEBSITE_AIRTABLE_BASE_ID}:Saints:${row.sourceId}`, itemIds:exactItems.get(`${SPN_WEBSITE_AIRTABLE_BASE_ID}:Saints:${row.sourceId}`)??[], itemId:(exactItems.get(`${SPN_WEBSITE_AIRTABLE_BASE_ID}:Saints:${row.sourceId}`)?.length===1?exactItems.get(`${SPN_WEBSITE_AIRTABLE_BASE_ID}:Saints:${row.sourceId}`)![0]:null), housingEvidenceRevision:row.sourceId===paramanandObjectReview.sourceId?housingEvidenceRevision:undefined, legacyPlacementId: row.baseline?.placementId, name: row.name, saintId: row.saintId, sourceReported: vitrine(row.sourceVitrine, row.sourceShelf), legacyConfirmed: legacy.get(row.sourceId) ?? null, destination: vitrine(row.effectiveVitrine), holdReason: (exactItems.get(`${SPN_WEBSITE_AIRTABLE_BASE_ID}:Saints:${row.sourceId}`)?.length ? "Verified catalog item linked: use its existing item-move workflow to preserve object placement history. " : "") + (row.reviewReason || (row.unresolved ? "Source identity remains under review" : "")), fixedHousing: ["fixed_stick_case", "full_height"].includes(row.state) })) });
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
