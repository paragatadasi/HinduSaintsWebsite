import test from "node:test";
import assert from "node:assert/strict";
import { mergeMuseumPhysicalProgress, type ProgressPosition } from "./museum-physical-progress-client";
import type { CompanionRow } from "./spn-move-guide";

const original = { kind: "vitrine" as const, code: "2", label: "Vitrine 2" };
const row: CompanionRow = { sourceId: "source", saintId: "saint", name: "Saint", original, current: original,
  currentBasis: "source", currentVersion: 0, currentRevision: "old", sourceRevision: "source-evidence",
  fixedHousing: false, verifiedItemIds: [], identityChanged: false };
const position: ProgressPosition = { sourceId: "source", current: original, currentBasis: "source", currentVersion: 2,
  currentRevision: "restored", currentConfirmed: null, recordedAt: "2026-10-29T14:00:00Z" };

test("remote undo restores source basis and invalidates the old undo offer without replacing identity evidence", () => {
  const merged = mergeMuseumPhysicalProgress([{ ...row, currentBasis: "confirmed", undo: { available: true, previous: original, previousBasis: "source" } }], [position]);
  assert.equal(merged.rows[0].currentBasis, "source");
  assert.equal(merged.rows[0].currentVersion, 2);
  assert.equal(merged.rows[0].currentRevision, "restored");
  assert.equal(merged.rows[0].undo?.available, false);
  assert.equal(merged.rows[0].sourceRevision, "source-evidence");
  assert.equal(merged.needsFullRefresh, false);
});

test("a newer legacy placement requires authoritative refresh instead of adopting an incorrect revision", () => {
  const baseline = { ...row, legacyConfirmed: { confirmedAt: "2026-10-29T15:00:00Z" } };
  const merged = mergeMuseumPhysicalProgress([baseline], [position]);
  assert.equal(merged.needsFullRefresh, true);
  assert.equal(merged.rows[0], baseline);
});

test("restored confirmed state compares its effective date with the legacy placement", () => {
  const baseline = { ...row, legacyConfirmed: { confirmedAt: "2026-10-29T13:00:00Z" } };
  const merged = mergeMuseumPhysicalProgress([baseline], [{ ...position, currentBasis: "confirmed",
    currentConfirmed: { location: original, version: 2, confirmedAt: "2026-10-28T10:00:00Z" } }]);
  assert.equal(merged.needsFullRefresh, true);
});

test("unchanged and unsaved records retain their complete existing undo state", () => {
  const merged = mergeMuseumPhysicalProgress([row], [{ ...position, currentRevision: row.currentRevision }]);
  assert.equal(merged.rows[0], row);
  assert.equal(mergeMuseumPhysicalProgress([row], []).rows[0], row);
});
