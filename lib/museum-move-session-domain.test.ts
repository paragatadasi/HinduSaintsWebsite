import assert from "node:assert/strict";
import test from "node:test";
import { moveSessionAction, moveSnapshot, assertDistinctMoveSources, assertWholeCaseClearing } from "./museum-move-session-domain";
import { legacyMoveConfirmations } from "./museum-move-session-source";
const location = { kind: "vitrine", code: "1", label: "Vitrine1" } as const;
test("moves require physical acknowledgment and an explicit target per source", () => {
  const input = { sessionId: "cmove123456789012345678901", clientRequestId: "178c7810-45c0-48b5-bdc6-dd5ab3ba48a9", expectedSessionVersion: 1, action: "move", moves: [{ sourceId: "a", expectedLocationVersion: 0, expectedCurrentRevision: "a".repeat(64), to: location }] };
  assert.equal(moveSessionAction.safeParse(input).success,false);
  assert.equal(moveSessionAction.safeParse({ ...input, physicalConfirmation: true, inventoryAcknowledged: true }).success,true);
  assert.throws(() => assertDistinctMoveSources([{ sourceId: "a" },{ sourceId: "a" }]), /once/);
});
test("legacy physical history rejects Planned, other museums and shared saint-level inference", () => {
  const rows = [{ sourceId: "a", baseline: { placementId: "shared" } },{ sourceId: "b", baseline: { placementId: "shared" } }];
  const value = { museumId: "museum-spn", status: "Implemented", vitrine: "1", confirmedAt: "2026-10-27T10:00:00.000Z" };
  assert.equal(legacyMoveConfirmations(rows,[{ entityId: "shared", afterJson: value }]).size,0);
  assert.equal(legacyMoveConfirmations(rows,[{ entityId: "a", afterJson: { ...value, museumId: "museum-vrindavan" } }]).size,0);
  assert.equal(legacyMoveConfirmations(rows,[{ entityId: "a", afterJson: { ...value, status: "Planned" } }]).size,0);
  assert.equal(legacyMoveConfirmations(rows,[{ entityId: "shared", afterJson: { ...value, checkedSourceIds: ["a"] } }]).has("a"),true);
  assert.equal(legacyMoveConfirmations(rows,[{ entityId: "shared", afterJson: { ...value, checkedSourceIds: ["a"] } }]).has("b"),false);
});
test("snapshots keep separate observations of one saint and reject duplicate source IDs", () => {
  const row = { sourceId: "a", name: "One saint", saintId: "same-saint", sourceReported: null, destination: location, holdReason: "", fixedHousing: false };
  const base = { proposalVersion: "v1", title: "Test", vitrineCodes: ["1"], guidance: { version: "g1", reviewStatus: "pending" } };
  assert.equal(moveSnapshot.safeParse({ ...base, rows: [row,{ ...row, sourceId: "b" }] }).success,true);
  assert.equal(moveSnapshot.safeParse({ ...base, rows: [row,row] }).success,false);
});

test("whole-case clearing includes displays whose planned destination stays in the same case", () => {
 const rows=[{sourceId:"stay",current:location},{sourceId:"leave",current:location}];
 const staging={kind:"table" as const,code:"staging-area",label:"Staging area"};
 assert.throws(()=>assertWholeCaseClearing(["1"],rows,[{sourceId:"leave",to:staging}]),/every listed display/);
 assert.doesNotThrow(()=>assertWholeCaseClearing(["1"],rows,rows.map(row=>({sourceId:row.sourceId,to:staging}))));
});
