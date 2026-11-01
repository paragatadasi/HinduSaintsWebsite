import { randomUUID } from "node:crypto";
import { physicalFingerprint } from "./museum-physical-location-current";

// Audit actions whose events feed the progress poll: confirmations and clears, check undos and
// component corrections, and vitrine preparations. These events are append-only in app code.
export const progressLedgerActions = [
  "museum.physical_location.confirmed",
  "museum.physical_location.check_undone",
  "museum.vitrine.preparation.updated"
] as const;

// A new process (deploy or restart) can change how progress is derived, so its revisions never match old ones.
const processEpoch = randomUUID();

export type ProgressLedgerInput = {
  proposalVersion: string;
  saved: { sourceId: string; location: unknown; version: number; confirmedAt: Date | string }[];
  ledger: { action: string; count: number; latest: Date | string | null }[];
  epoch?: string;
};

const iso = (value: Date | string | null) => value === null ? null : new Date(value).toISOString();

// Cheap revision of every ledger row the progress poll reads. Computed before any snapshot work so an
// unchanged poll can answer 304 without rebuilding the museum source snapshot.
export function progressLedgerRevision(input: ProgressLedgerInput) {
  return physicalFingerprint({
    epoch: input.epoch ?? processEpoch,
    proposalVersion: input.proposalVersion,
    saved: [...input.saved].sort((a, b) => a.sourceId.localeCompare(b.sourceId))
      .map(row => ({ sourceId: row.sourceId, location: row.location, version: row.version, confirmedAt: iso(row.confirmedAt) })),
    ledger: [...input.ledger].sort((a, b) => a.action.localeCompare(b.action))
      .map(row => ({ action: row.action, count: row.count, latest: iso(row.latest) }))
  });
}

// Accepts `"abc"`, `W/"abc"` or a list; returns the bare revisions.
export function parseIfNoneMatch(header: string | null) {
  if (!header) return [];
  return header.split(",").map(part => part.trim().replace(/^W\//, "").replace(/^"(.*)"$/, "$1")).filter(Boolean);
}
