import test from "node:test";
import assert from "node:assert/strict";
import captured from "../data/museum/spn-vraj-east-shelves-v1.json";
import recommendation from "../data/museum/spn-v77-bottom-two-shelves-v1.json";
import {applyV77BottomTwoRecommendations} from "./spn-v77-bottom-two-shelves";
import {operationalSpnShelfPacket} from "./spn-east-remainder-shelves";

test("V77 includes Ramashray, retains existing records and scopes the lower-two exception", () => {
  const before = structuredClone(captured);
  const updated = applyV77BottomTwoRecommendations(captured);
  const plan = updated.vitrines.find(v => v.code === "77")!;
  assert.equal(plan.allocations.length, 24);
  assert.equal(new Set(plan.allocations.map(a => a.sourceId)).size, 24);
  assert.deepEqual(plan.livingAllowedBands, [4, 5]);
  const living = plan.allocations.filter(a => a.projectedLifeStatus?.tag);
  assert.equal(living.length, 6);
  assert.ok(living.every(a => [4, 5].includes(a.suggestedShelfIndex!)));
  for (const id of recommendation.sourceRecordedPair.sourceIds) {
    const allocation = plan.allocations.find(a => a.sourceId === id)!;
    assert.equal(allocation.suggestedShelfIndex, 4);
    assert.equal(allocation.groupId, recommendation.sourceRecordedPair.groupId);
  }
  const original = captured.vitrines.find(v => v.code === "77")!;
  assert.equal(original.allocations.filter(a => plan.allocations.find(b => b.sourceId === a.sourceId)!.suggestedShelfIndex !== a.suggestedShelfIndex).length, 10);
  for (const old of original.allocations) assert.deepEqual(plan.allocations.find(a => a.sourceId === old.sourceId)!.capturedBaseline, old.capturedBaseline);
  const nimbarka = original.groups.find(g => /Nimbarka/.test(g.title))!;
  assert.deepEqual(plan.allocations.filter(a => a.groupId === nimbarka.id).map(a => a.sourceId).sort(), original.allocations.filter(a => a.groupId === nimbarka.id).map(a => a.sourceId).sort());
  for (const band of recommendation.bandLoads) {
    const load = recommendation.rows.filter(row => row.recommendedBand === band.band).reduce((sum,row) => sum + row.knownFootprint,0);
    assert.ok(Math.abs(load - band.load) < 0.000001);
    assert.ok(load <= 1.000001);
  }
  for (const other of captured.vitrines.filter(v => v.code !== "77"))
    assert.deepEqual(updated.vitrines.find(v => v.code === other.code), other);
  assert.deepEqual(captured, before);
  assert.equal(operationalSpnShelfPacket.vitrines.flatMap(v => v.allocations).length, 349);
});

test("changed captured recommendations require a fresh review", () => {
  const changed = structuredClone(captured);
  changed.vitrines.find(v => v.code === "77")!.allocations[0].suggestedShelfIndex = 5;
  assert.throws(() => applyV77BottomTwoRecommendations(changed), /captured shelf plan changed/);
});
