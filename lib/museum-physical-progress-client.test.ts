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

test("component correction or stale source evidence requests authoritative refresh",()=>{
 const component={sourceId:"source",receiptId:"receipt",recordedAt:position.recordedAt,revision:"partial",origin:original,
   location:{kind:"table" as const,code:"staging-area",label:"Staging area"},scope:"vitrine_20_contents_only" as const,
   excludedWalkingSticks:{location:null,status:"unverified" as const},expectedSourceRevision:row.sourceRevision,previousCurrentRevision:row.currentRevision,previousLocationVersion:0};
 const partial={...row,current:null,componentPlacement:component};
 assert.equal(mergeMuseumPhysicalProgress([partial],[]).needsFullRefresh,true);
 const update={...position,current:null,currentRevision:"partial",currentBasis:"unknown",componentPlacement:component};
 const merged=mergeMuseumPhysicalProgress([row],[update]);
 assert.equal(merged.rows[0].current,null);
 assert.equal((merged.rows[0] as typeof partial).componentPlacement?.scope,"vitrine_20_contents_only");
 assert.equal(mergeMuseumPhysicalProgress([{...partial,sourceRevision:"new-source"}],[update]).needsFullRefresh,true);
});

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
