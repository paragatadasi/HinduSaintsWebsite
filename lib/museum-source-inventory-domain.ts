import {parseSourceShelfPosition,type SourceShelfPosition} from "./museum-source-shelf-position";
import {classifyRelicPackaging,type RelicPackagingEvidence} from "./museum-relic-packaging";
import type {MuseumCollectionCardItem} from "./museum-collection-domain";
import {identityObservationSchema} from "./vrindavan-identity-domain";

export type MuseumSourceInventoryEntry = {
  observationId: string;
  sourceKey: string;
  snapshotHash: string;
  sourceName: string;
  sourceRow: number;
  museum: {id: string; name: string; slug: string};
  saintIds: string[];
  unavailableSaintIds: string[];
  sourceSaintName: string | null;
  relicDescription: string;
  quantityText: string;
  packagingText: string;
  packaging: RelicPackagingEvidence;
  sourcePlaceText: string;
  displayText: string;
  positionText: string;
  sourceShelfPosition?: SourceShelfPosition;
  comments: string;
  warnings: string[];
  identityConfirmedAt: string | null;
  // Source observations can describe several objects. This is never an item ID.
  physicalItemId: string | null;
  sourceLocation: (Omit<NonNullable<MuseumCollectionCardItem["location"]>, "id"> & {
    evidence: "source_reported"; displayText: string; positionText: string;
  }) | null;
};
export type InventoryObservationInput = {
  id: string; museumId: string; sourceKey: string; status: string;
  itemId: string | null; normalizedJson: unknown; rawJson: unknown; reviewedAt: Date | null;
};

// Only reviewed Vrindavan identity observations enter this pilot projection.
// Preserve quantities and positions as text: 3.4 is a position, not a decimal shelf number.
export function projectVrindavanInventoryEntry(
  row: InventoryObservationInput,
  museum: MuseumSourceInventoryEntry["museum"],
  activeSaintIds: ReadonlySet<string>
): MuseumSourceInventoryEntry | null {
  if (museum.id !== "museum-vrindavan" || row.museumId !== museum.id || row.status !== "identity_linked") return null;
  const key = /^vrindavan-workbook:([a-f0-9]{64}):Sheet1:([1-9][0-9]*)$/.exec(row.sourceKey);
  const parsed = identityObservationSchema.safeParse(row.normalizedJson);
  if (!key || !parsed.success) return null;
  const data = parsed.data;
  if (Number(key[2]) !== data.sourceRow || !data.saintIds.length || new Set(data.saintIds).size !== data.saintIds.length) return null;
  const raw = row.rawJson as {cells?: unknown[];secondarySheet?:{cells?:unknown[]}} | null;
  const packaging = Array.isArray(raw?.cells) ? raw.cells[4] : null;
  const secondaryPackaging=Array.isArray(raw?.secondarySheet?.cells)?raw.secondarySheet.cells[4]:null;
  const packagingEvidence=classifyRelicPackaging(packaging,secondaryPackaging);
  const display = data.display.trim(), position = data.position.trim();
  const unavailableSaintIds = data.saintIds.filter(id => !activeSaintIds.has(id));
  return {
    observationId: row.id, sourceKey: row.sourceKey, snapshotHash: key[1],
    sourceName: data.sourceName, sourceRow: data.sourceRow, museum,
    saintIds: data.saintIds.filter(id => activeSaintIds.has(id)), unavailableSaintIds,
    sourceSaintName: data.name, relicDescription: data.relic, quantityText: data.quantity,
    packagingText: packaging == null ? "" : String(packaging).trim(),packaging:packagingEvidence,
    sourcePlaceText: data.place, displayText: data.display, positionText: data.position,sourceShelfPosition:parseSourceShelfPosition(data.position),
    comments: data.comments, warnings: [...data.warnings,
      ...(packagingEvidence.secondaryDisagrees?["Column E differs between workbook sheets; Sheet1 is used per curator decision."]:[]),
      ...(unavailableSaintIds.length ? ["A confirmed saint is unavailable; reconcile this identity before creating physical inventory."] : []),
      ...(!display && position ? ["Position supplied without a display; source location is unresolved."] : [])],
    identityConfirmedAt: row.reviewedAt?.toISOString() ?? null,
    physicalItemId: row.itemId,
    sourceLocation: display ? {
      museumId: museum.id, museumName: museum.name, museumSlug: museum.slug,
      code: encodeURIComponent(display) + (position ? "/" + encodeURIComponent(position) : ""),
      label: "Display / Vitrine " + display + (position ? " · Shelf / Position " + position : ""),
      kind: position ? "shelf" : "vitrine", room: null,
      evidence: "source_reported", displayText: data.display, positionText: data.position
    } : null
  };
}