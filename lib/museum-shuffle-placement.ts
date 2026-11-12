import bindings from "@/data/museum/spn-shuffle-placement-bindings.json";
import { db } from "./db";
import type { Prisma } from "./generated/prisma/client";
import { MuseumMoveSessionError } from "./museum-move-session-domain";
import { readMuseumMoveSessionSource, registeredMoveProposal } from "./museum-move-session-source";
import { physicalFingerprint } from "./museum-physical-location-current";
import { confirmMuseumPhysicalLocations, readPhysicalLocationView, type PhysicalSnapshotLoader } from "./museum-physical-locations";
import { currentSpnProposalRelease } from "./spn-current-proposal";

type Binding = {
  origin: string;
  target: string;
  originShelf: string | null;
  holdings: { sourceId: string; bottomShelfRequired: boolean }[];
};

const placements: Readonly<Record<string, Binding | undefined>> = bindings;
const museumId = "museum-spn";
export const shufflePhysicalActionIds = Object.keys(placements);

const loadSnapshot: PhysicalSnapshotLoader = async tx => {
  const snapshot = await readMuseumMoveSessionSource(registeredMoveProposal.version, tx);
  const future = new Set(currentSpnProposalRelease.proposal.layout.vitrines.filter(row => row.availability === "future").map(row => row.number));
  return { ...snapshot, vitrineCodes: snapshot.vitrineCodes.filter(code => !future.has(code)) };
};

async function preparePlacement(actionId: string, tx: Prisma.TransactionClient) {
  const binding = placements[actionId];
  if (!binding || !Object.hasOwn(placements, actionId)) {
    throw new MuseumMoveSessionError(400, "This checklist line has no inventory transfer.");
  }
  const sourceIds = binding.holdings.map(holding => holding.sourceId);
  const snapshot = await loadSnapshot(tx);
  const loader: PhysicalSnapshotLoader = async () => snapshot;
  if (!snapshot.vitrineCodes.includes(binding.target)) {
    throw new MuseumMoveSessionError(409, "The receiving vitrine is unavailable.");
  }
  const view = await readPhysicalLocationView(loader, tx, sourceIds, false);
  const records = binding.holdings.map(holding => {
    const row = view.rows.find(record => record.sourceId === holding.sourceId)!;
    if (row.identityChanged || row.duplicateOfSourceId) {
      throw new MuseumMoveSessionError(409, `${row.name} has an unresolved source identity. Review the holding before confirming this move.`);
    }
    if (row.current?.kind !== "vitrine" || row.current.code !== binding.origin ||
      (binding.originShelf && row.current.shelf?.toUpperCase() !== binding.originShelf.toUpperCase())) {
      throw new MuseumMoveSessionError(409, `${row.name} is no longer recorded at the guide’s starting location. Check the current inventory before saving.`);
    }
    return {
      sourceId: row.sourceId,
      saintId: row.saintId,
      name: row.name,
      from: row.current,
      to: { kind: "vitrine" as const, code: binding.target, label: `Vitrine ${binding.target}` },
      bottomShelfRequired: holding.bottomShelfRequired,
      expectedCurrentRevision: row.currentRevision,
      expectedSourceRevision: row.sourceRevision,
      expectedLocationVersion: row.currentVersion
    };
  });
  return { records, loader, revision: physicalFingerprint({ actionId, records }) };
}

export async function readShufflePlacement(actionId: string) {
  const { records, revision } = await db.$transaction(tx => preparePlacement(actionId, tx), { isolationLevel: "RepeatableRead" });
  return { revision, records: records.map(({ sourceId, name, from, to, bottomShelfRequired }) => ({ sourceId, name, from, to, bottomShelfRequired })) };
}

export async function saveShufflePlacement(tx: Prisma.TransactionClient, input: {
  actionId: string;
  clientRequestId: string;
  physicalConfirmation: { revision: string; confirmedDate: string };
}, actorId: string) {
  const { records, revision, loader } = await preparePlacement(input.actionId, tx);
  if (revision !== input.physicalConfirmation.revision) {
    throw new MuseumMoveSessionError(409, "The source or location changed. Review the current move again.");
  }
  const result = await confirmMuseumPhysicalLocations({
    museumId,
    clientRequestId: input.clientRequestId,
    confirmedDate: input.physicalConfirmation.confirmedDate,
    datePrecision: "date",
    evidence: `SPN Shuffle Guide placement confirmed for ${input.actionId}.`,
    physicalConfirmation: true,
    inventoryAcknowledged: true,
    records: records.map(({ sourceId, saintId, expectedCurrentRevision, expectedSourceRevision, expectedLocationVersion, to }) =>
      ({ sourceId, saintId, expectedCurrentRevision, expectedSourceRevision, expectedLocationVersion, to }))
  }, { id: actorId, canManage: true }, loader, tx);
  if (!result.receipt) throw new MuseumMoveSessionError(409, "This move was already recorded. Reload the inventory.");
  return result.receipt.id;
}
