import { db } from "./db";
import type { Prisma } from "./generated/prisma/client";
import { resolveMuseumPhysicalCurrent } from "./museum-physical-location-current";
import { readMuseumPreparations, readMuseumPhaseClearances } from "./museum-physical-locations";
import { readComponentPlacements } from "./museum-component-clearances";
import { projectComponentPlacement } from "./museum-component-clearance-domain";
import { currentSpnProposalRelease } from "./spn-current-proposal";
import { progressLedgerActions, progressLedgerRevision } from "./museum-physical-progress-revision";
import type {PhysicalSnapshotLoader} from "./museum-physical-locations";

async function readProgressLedger(tx: Prisma.TransactionClient) {
  const [saved, ledger] = await Promise.all([
    tx.museumMoveCurrentLocation.findMany({ where: { museumId: "museum-spn" }, orderBy: { sourceId: "asc" },
      select: { sourceId: true, location: true, version: true, confirmedAt: true } }),
    tx.auditEvent.groupBy({ by: ["action"], where: { action: { in: [...progressLedgerActions] } }, _count: { _all: true }, _max: { createdAt: true } })
  ]);
  const progressRevision = progressLedgerRevision({ proposalVersion: currentSpnProposalRelease.proposal.version, saved,
    ledger: ledger.map(row => ({ action: row.action, count: row._count._all, latest: row._max.createdAt })) });
  return { saved, progressRevision };
}

// Receiver-space availability is not part of the progress poll: it needs the full source snapshot and
// museum review. The full refresh returns it, and every write revalidates it on the server.
async function readProgress(tx: Prisma.TransactionClient, loader: PhysicalSnapshotLoader, knownRevisions: string[] = []) {
  const { saved, progressRevision } = await readProgressLedger(tx);
  if (knownRevisions.includes(progressRevision)) return { changed: false as const, progressRevision };
  const [preparations, phaseClearances, components] = await Promise.all([
    readMuseumPreparations(tx), readMuseumPhaseClearances(tx, loader), readComponentPlacements(tx)
  ]);
  const savedBySource = new Map(saved.map(row => [row.sourceId, row]));
  const componentBySource = new Map(components.map(row => [row.sourceId, row]));
  const sourceIds = [...new Set([...savedBySource.keys(), ...componentBySource.keys()])];
  const positions = sourceIds.map(sourceId => {
    const position = savedBySource.get(sourceId), component = componentBySource.get(sourceId);
    const state = projectComponentPlacement(resolveMuseumPhysicalCurrent(component?.origin ?? null, position, null), component);
    return { sourceId, recordedAt: state.componentPlacement?.recordedAt ?? component?.recordedAt ?? position!.confirmedAt.toISOString(), ...state };
  });
  return { changed: true as const, progress: { museumId: "museum-spn" as const, progressRevision, positions, preparations, phaseClearances } };
}

const options = { isolationLevel: "RepeatableRead", timeout: 15000 } as const;

export async function readMuseumPhysicalProgress(loader: PhysicalSnapshotLoader) {
  return db.$transaction(async tx => {
    const result = await readProgress(tx, loader);
    if (!result.changed) throw new Error("Progress must be read without a known revision.");
    return result.progress;
  }, options);
}

// Reports `changed: false` when a known revision still matches, without reading the source snapshot.
export async function readMuseumPhysicalProgressIfChanged(loader: PhysicalSnapshotLoader, knownRevisions: string[]) {
  return db.$transaction(tx => readProgress(tx, loader, knownRevisions), options);
}
