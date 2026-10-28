import { MuseumMoveSessionError } from "./museum-move-session-domain";

export type PreparatoryTransfer = {
  sourceId: string;
  fromVitrine: string;
  toVitrine: string;
  finalDestination: string;
  requiredBefore: string[];
};

// Curator-approved on 28 October 2026; these are source observations, not saint-wide permissions.
export const spnFillFirstTransfers: PreparatoryTransfer[] = [
  { sourceId: "rec6IqZR7ahPTDfEI", fromVitrine: "23", toVitrine: "70", finalDestination: "70", requiredBefore: ["23"] },
  { sourceId: "recMo8X6ehasAq0cW", fromVitrine: "23", toVitrine: "70", finalDestination: "18", requiredBefore: ["23"] }
];

type Location = { kind: string; code: string } | null;
type Current = { sourceId: string; current: Location; currentBasis: string; identityChanged?: boolean; verifiedItemIds?: string[] };

export function allowsPreparedFixedHousingTransfer(sourceId: string, current: Location, to: Location, registered: PreparatoryTransfer[] = []) {
  return registered.some(transfer => transfer.sourceId === sourceId && spnFillFirstTransfers.some(approved =>
    approved.sourceId === sourceId && approved.fromVitrine === transfer.fromVitrine && approved.toVitrine === transfer.toVitrine) &&
    current?.kind === "vitrine" && current.code === transfer.fromVitrine && to?.kind === "vitrine" && to.code === transfer.toVitrine);
}

export function preparatoryTransfersComplete(transfers: PreparatoryTransfer[], rows: Current[]) {
  return transfers.every(transfer => {
    const row = rows.find(row => row.sourceId === transfer.sourceId);
    return row && !row.identityChanged && !row.verifiedItemIds?.length && row.currentBasis === "confirmed" && row.current?.kind === "vitrine" &&
      [transfer.toVitrine, transfer.finalDestination].includes(row.current.code);
  });
}

export function assertPreparatoryTransfers(records: { to: { kind: string; code: string } }[], transfers: PreparatoryTransfer[], rows: Current[]) {
  const required = transfers.filter(transfer => records.some(record => record.to.kind === "vitrine" && transfer.requiredBefore.includes(record.to.code)));
  if (!preparatoryTransfersComplete(required, rows))
    throw new MuseumMoveSessionError(409, "Record the outgoing objects in their approved holding or final vitrines before filling this destination.");
}
