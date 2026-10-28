import test from "node:test";
import assert from "node:assert/strict";
import { ramBhaktiMoveGuide as guide, ramBhaktiGuideContext, ramBhaktiGuideDefinition, projectRamBhaktiGuide } from "./spn-ram-bhakti-guide";
import { assertGuidePhysicalScope } from "./spn-datta-guide";
import { readStarterGuideDefinition } from "./spn-starter-guide-registry";

test("Ram Bhakti phase has exactly seven approved sources, five Primaries, and no clearing or alternatives", () => {
  assert.deepEqual(guide.entries.map(row => row.sourceId).sort(), ["recfi9BOPvQP4SGAE","recCGUZ0GOInZQ8y3","rec8ob3C56Q6tv3kb","recGtVWuUclVacwiB","recyQbBAPywfZ41O2","recxjM8XNprzBWzuT","recl4gAipADCmXJrH"].sort());
  assert.equal(guide.entries.filter(row => row.tier === "Primary").length, 5);
  assert.equal(guide.allowClear, false);
  assert.deepEqual(guide.alternatives, []);
  assert.deepEqual(guide.reportedPlacements, []);
  assert.equal(guide.outgoingDependencies?.length,10);
  assert.equal(readStarterGuideDefinition(ramBhaktiGuideContext.guideVersion),ramBhaktiGuideDefinition);
  assert.ok(guide.entries.every(row => row.destination === "80"));
});
test("Ram Bhakti context rejects clearing, staging and unrelated sources", () => {
  const move={sourceId:guide.entries[0].sourceId,to:{kind:"vitrine",code:"80"}};
  assert.doesNotThrow(()=>assertGuidePhysicalScope(ramBhaktiGuideDefinition,[move]));
  assert.throws(()=>assertGuidePhysicalScope(ramBhaktiGuideDefinition,[move],["80"]));
  assert.throws(()=>assertGuidePhysicalScope(ramBhaktiGuideDefinition,[{...move,to:{kind:"table",code:"staging-area"}}]));
  assert.throws(()=>assertGuidePhysicalScope(ramBhaktiGuideDefinition,[{...move,sourceId:"recdZzkFXHY1iH1Ct"}]));
});
test("qualified relationships and source uncertainty survive projection without inventing current places", () => {
  const result=projectRamBhaktiGuide([],{rows:[],unmappedCurrentLocations:[]});
  assert.ok(result.entries.every(row=>row.currentLocation===null && row.currentLocationBasis==="unknown"));
  assert.equal(result.entries.find(row=>row.sourceId==="recyQbBAPywfZ41O2")?.lifeStatus?.tag,"May be alive");
  assert.match(result.entries.find(row=>row.sourceId==="recGtVWuUclVacwiB")!.rationale,/not lifetime discipleship/);
  assert.equal(guide.vitrines[0].families.some(group=>group.edges?.some(edge=>edge.toSourceId==="rec8ob3C56Q6tv3kb")),false);
});
