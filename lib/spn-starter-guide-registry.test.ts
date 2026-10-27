import test from "node:test";
import assert from "node:assert/strict";
import { registeredStarterGuide as guide, readStarterGuideDefinition, starterGuideContext } from "./spn-starter-guide-registry";

test("the pilot pins the approved rotation and preserves the real physical walk", () => {
  assert.equal(guide.proposalVersion, "spn-three-sided-rotation-review-2026-10-27-v7");
  assert.deepEqual(guide.vitrines.map(row => row.code), ["2", "78", "36", "29", "76", "28", "27"]);
  assert.equal(guide.rows.length, 136);
  assert.throws(() => readStarterGuideDefinition("spn-city-first-2026-10-27-v10"), /not registered/);
});
test("the later review-only transfers are excluded and source-only identity stays separate", () => {
  assert.equal(guide.rows.find(row => row.sourceId === "rec1bOVrWmAFek7Tn")!.vitrine, "27");
  assert.equal(guide.rows.find(row => row.sourceId === "reckCzqScd99ZzKth")!.vitrine, "28");
  const extra = guide.rows.find(row => row.sourceId === "recOs3jGNyfMlakIB")!;
  assert.equal(extra.vitrine, "27"); assert.equal(extra.saintId, null);
});
test("each pilot entry belongs to one phase group and alternatives have target-specific decisions", () => {
  const ids = guide.vitrines.flatMap(vitrine => [...vitrine.families, ...vitrine.cityGroups].flatMap(group => group.sourceIds));
  assert.equal(ids.length, 136); assert.equal(new Set(ids).size, 136);
  const cohort = guide.cityAlternatives.find(row => row.sourceIds.some(id => !guide.rows.some(row => row.sourceId === id)))!;
  const definition = readStarterGuideDefinition(starterGuideContext.guideVersion);
  const chosen = definition.suggestions.find(row => row.id === cohort.suggestionIdsByTarget["78"])!;
  assert.equal(chosen.kind, "alternative"); assert.equal(chosen.targetVitrine, "78");
  assert.deepEqual(chosen.sourceIds, cohort.sourceIds);
  assert.notEqual(cohort.suggestionIdsByTarget["78"], cohort.suggestionIdsByTarget["27"]);
});
