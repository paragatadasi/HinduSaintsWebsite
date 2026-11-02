import packet from "../data/museum/spn-hinge-approved-guide-v2.json";
import test from "node:test";
import assert from "node:assert/strict";
import {approvedHingeGuide as adapter} from "./spn-approved-hinge-guide";
import {companionVitrineOwner} from "./museum-companion-addition-projection";
import {allOperationalSpnShelves} from "./spn-operational-shelves";
import {readStarterGuideDefinition} from "./spn-starter-guide-registry";
import {hingeAdditionsGuideContext} from "./spn-hinge-additions-guide";
import delta from "../data/museum/spn-source-shelf-coverage-delta-v1.json";

test("approved hinge replaces the supplement and owns its physical cases", () => {
  assert.equal(adapter.guide.entries.length, 204);
  assert.equal(adapter.guide.entries.filter(e => e.destination === "9").length, 20);
  assert.equal(adapter.guide.entries.filter(e => e.destination === "10").length, 27);
  assert.ok(!adapter.guide.vitrines.some(v => v.code === "6"));
  assert.ok(readStarterGuideDefinition(hingeAdditionsGuideContext.guideVersion).readOnly);
  const old = {...adapter.guide, version: "older-northern-guide"};
  assert.equal(companionVitrineOwner({north: old, hinge: adapter.guide}, "11"), "hinge");
  assert.equal(adapter.guide.receivingOnly, true);
  assert.equal(adapter.guide.allowClear, false);
});

test("every approved hinge and supplemental source has one matching shelf allocation", () => {
  for (const row of packet.rows) {
    const matches = allOperationalSpnShelves.vitrines.flatMap(v => v.allocations.filter(a => a.sourceId === row.sourceId).map(a => ({code: v.code, a})));
    assert.equal(matches.length, 1, row.sourceId);
    assert.equal(matches[0].code, row.destination);
    assert.equal(matches[0].a.sourceRevision, row.sourceRevision);
  }
  assert.equal(delta.vitrines.reduce((n,v) => n + v.allocations.length, 0), 14);
  for (const v of delta.vitrines) for (const row of v.allocations) {
    assert.ok(allOperationalSpnShelves.vitrines.find(c => c.code === (row.sourceId === "recF52jndG5wSaY9c" ? "78" : v.code))?.allocations.some(a => a.sourceId === row.sourceId));
  }
});
