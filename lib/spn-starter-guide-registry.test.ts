import test from "node:test";
import assert from "node:assert/strict";
import { registeredStarterGuide as guide, readStarterGuideDefinition, starterGuideContext } from "./spn-starter-guide-registry";
import oldGuide from "../data/museum/spn-starter-move-guide-v2.json";
import proposal from "../data/museum/spn-starter-reviewed-proposal-v16.json";

test("v16 guide has an exact source partition and matches all reviewed destinations", () => {
 assert.equal(guide.proposalVersion, proposal.version);
 assert.deepEqual(guide.vitrines.map(row => row.code), ["2", "78", "36", "29", "76", "28", "27"]);
 const ids = guide.vitrines.flatMap(v => [...v.families, ...v.cityGroups].flatMap(g => g.sourceIds));
 assert.equal(ids.length, 135); assert.equal(new Set(ids).size, 135);
 for (const row of guide.rows) assert.equal(proposal.rows.find(p => p.sourceId === row.sourceId)?.vitrine, row.vitrine);
});

test("historical guide definitions and reported physical facts survive version changes", () => {
 const historical = readStarterGuideDefinition(oldGuide.version);
 assert.equal(historical.context.contentDigest, oldGuide.contentDigest);
 assert.deepEqual(guide.physicalConfirmations.moves, oldGuide.physicalConfirmations.moves);
 const extra = guide.rows.find(row => row.sourceId === "recOs3jGNyfMlakIB")!;
 assert.equal(extra.saintId, null); assert.equal(extra.vitrine, "28");
 assert.throws(() => readStarterGuideDefinition("unknown"), /not registered/);
});

test("unreviewed locality alternatives cannot register actions; transitions can", () => {
 const definition = readStarterGuideDefinition(starterGuideContext.guideVersion);
 assert.ok(guide.cityAlternatives.length > 0);
 assert.ok(guide.cityAlternatives.every(row => row.allowedTargetVitrines.length === 0));
 assert.ok(definition.suggestions.every(row => row.kind !== "alternative"));
 assert.equal(guide.transitionRowsOutsideStarter.length, 4);
 for (const row of guide.transitionRowsOutsideStarter) {
  assert.equal(definition.suggestions.find(s => s.id === `row:${row.sourceId}`)?.targetVitrine, row.destination.vitrine);
  assert.equal(row.currentLocation.vitrine, "28");
 }
});
