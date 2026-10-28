import test from "node:test";
import assert from "node:assert/strict";
import { assertGuidePhysicalScope, dattaGuideContext, dattaGuideDefinition, dattaMoveGuide, projectDattaGuide } from "./spn-datta-guide";
import { readStarterGuideDefinition, starterGuideContext } from "./spn-starter-guide-registry";
import type { CompanionRow } from "./spn-move-guide";

const entry = dattaMoveGuide.entries[0];
const physical: CompanionRow = { sourceId: entry.sourceId, saintId: entry.saintId, name: entry.name,
  original: { kind: "vitrine", code: "7", label: "Vitrine 7", shelf: "A" },
  current: { kind: "vitrine", code: "27", label: "Vitrine 27" }, currentBasis: "confirmed",
  currentVersion: 2, currentRevision: "a".repeat(64), sourceRevision: "b".repeat(64), fixedHousing: false,
  verifiedItemIds: [], identityChanged: false };

test("Datta registration is isolated from the starter and has no alternative or clear targets", () => {
  assert.equal(readStarterGuideDefinition(dattaGuideContext.guideVersion), dattaGuideDefinition);
  assert.notEqual(starterGuideContext.guideVersion, dattaGuideContext.guideVersion);
  assert.equal(readStarterGuideDefinition(starterGuideContext.guideVersion).context, starterGuideContext);
  assert.equal(dattaMoveGuide.entries.length, 48);
  assert.deepEqual(dattaMoveGuide.vitrines.map(v => [v.code, v.families.concat(v.cityGroups).flatMap(g => g.sourceIds).length]), [["3",14],["81",15],["82",19]]);
  assert.equal(dattaMoveGuide.outgoingDependencies?.length, 40);
  assert.deepEqual(dattaMoveGuide.reportedPlacements, []);
  assert.deepEqual(dattaMoveGuide.alternatives, []);
});

test("physical scope rejects whole clearing, staging, other observations and wrong targets", () => {
  const correct = { sourceId: entry.sourceId, to: { kind: "vitrine", code: entry.destination } };
  assert.doesNotThrow(() => assertGuidePhysicalScope(dattaGuideDefinition, [correct]));
  for (const row of [{ ...correct, sourceId: "outside-source" }, { ...correct, to: { kind: "table", code: "staging-area" } },
    { ...correct, to: { kind: "vitrine", code: "80" } }]) assert.throws(() => assertGuidePhysicalScope(dattaGuideDefinition, [row]));
  assert.throws(() => assertGuidePhysicalScope(dattaGuideDefinition, [correct], ["81"]));
});

test("fresh ledger confirmation overrides captured source location without rewriting destination or digest", () => {
  const before = JSON.stringify(dattaMoveGuide);
  const result = projectDattaGuide([{ id: entry.sourceId, sourceRecordId: entry.sourceId, saintId: entry.saintId!, tier: "Secondary" }],
    { rows: [physical], unmappedCurrentLocations: [] });
  assert.equal(result.entries[0].currentLocation?.code, "27");
  assert.equal(result.entries[0].currentLocationBasis, "confirmed");
  assert.equal(result.entries[0].destination, entry.destination);
  assert.equal(result.entries[0].tier, "Secondary");
  assert.equal(result.contentDigest, dattaMoveGuide.contentDigest);
  assert.equal(JSON.stringify(dattaMoveGuide), before);
});

test("missing, changed or duplicate source identities never acquire a captured physical location", () => {
  for (const rows of [[], [{ ...physical, identityChanged: true }], [{ ...physical, saintId: "another-saint" }], [physical, physical]]) {
    const result = projectDattaGuide([], { rows, unmappedCurrentLocations: [] }).entries[0];
    assert.equal(result.currentLocation, null);
    assert.equal(result.currentLocationBasis, "unknown");
    assert.ok(result.movementBlockedReason);
  }
});

test("traditional figures do not acquire living status from missing death data", () => {
  assert.equal(dattaMoveGuide.entries.find(row => row.name === "Dattatreya")?.lifeStatus?.tag, null);
  assert.equal(dattaMoveGuide.entries.find(row => row.name === "Sri Gawdi Baba")?.lifeStatus?.tag, "May be alive");
});
