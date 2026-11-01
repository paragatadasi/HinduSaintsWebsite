import test from "node:test";
import assert from "node:assert/strict";
import { parseIfNoneMatch, progressLedgerRevision, type ProgressLedgerInput } from "./museum-physical-progress-revision";

const base: ProgressLedgerInput = {
  epoch: "fixed",
  proposalVersion: "spn-v1",
  saved: [
    { sourceId: "b", location: { kind: "vitrine", code: "12" }, version: 2, confirmedAt: new Date("2026-11-01T10:00:00Z") },
    { sourceId: "a", location: { kind: "table", code: "T1" }, version: 1, confirmedAt: "2026-11-01T09:00:00.000Z" }
  ],
  ledger: [
    { action: "museum.physical_location.confirmed", count: 40, latest: new Date("2026-11-01T10:00:00Z") },
    { action: "museum.vitrine.preparation.updated", count: 24, latest: new Date("2026-11-01T13:38:38Z") }
  ]
};

test("the progress revision is stable across row order and date representation", () => {
  const reordered = { ...base, saved: [...base.saved].reverse().map(row => ({ ...row, confirmedAt: new Date(row.confirmedAt) })), ledger: [...base.ledger].reverse() };
  assert.equal(progressLedgerRevision(reordered), progressLedgerRevision(base));
});

test("the progress revision changes when any ledger input changes", () => {
  const revision = progressLedgerRevision(base);
  const changed: ProgressLedgerInput[] = [
    { ...base, proposalVersion: "spn-v2" },
    { ...base, epoch: "after-restart" },
    { ...base, saved: base.saved.slice(1) },
    { ...base, saved: base.saved.map(row => row.sourceId === "a" ? { ...row, version: 2 } : row) },
    { ...base, saved: base.saved.map(row => row.sourceId === "a" ? { ...row, location: { kind: "vitrine", code: "13" } } : row) },
    { ...base, saved: base.saved.map(row => row.sourceId === "a" ? { ...row, confirmedAt: "2026-11-01T09:00:01.000Z" } : row) },
    { ...base, ledger: base.ledger.map(row => row.action === "museum.vitrine.preparation.updated" ? { ...row, count: 25 } : row) },
    { ...base, ledger: base.ledger.map(row => row.action === "museum.physical_location.confirmed" ? { ...row, latest: new Date("2026-11-01T10:00:01Z") } : row) },
    { ...base, ledger: [...base.ledger, { action: "museum.physical_location.check_undone", count: 1, latest: new Date("2026-11-01T14:00:00Z") }] }
  ];
  for (const input of changed) assert.notEqual(progressLedgerRevision(input), revision);
});

test("revisions from different processes never match", () => {
  const { epoch: _epoch, ...withoutEpoch } = base;
  assert.notEqual(progressLedgerRevision(withoutEpoch), progressLedgerRevision(base));
});

test("If-None-Match parsing accepts strong, weak and listed tags", () => {
  assert.deepEqual(parseIfNoneMatch(null), []);
  assert.deepEqual(parseIfNoneMatch('"abc"'), ["abc"]);
  assert.deepEqual(parseIfNoneMatch('W/"abc", "def"'), ["abc", "def"]);
});
