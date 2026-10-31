import test from "node:test";
import assert from "node:assert/strict";
import {projectSourceFamilyReunion, ramashrayTyagiReunion as pair} from "./spn-source-family-reunion";
import type {StarterMoveGuide} from "./spn-move-guide";

function fixture(): StarterMoveGuide {
  return {version: "pinned", contentDigest: "content", assignmentDigest: "assignments", proposalVersion: "proposal", title: "Vraj",
    entries: [pair.teacher, pair.disciple].map(member => ({...member, name: member.sourceId, destination: "77", tier: "Tertiary",
      city: "", section: "", family: "", rationale: "", relicDescription: "",
      currentLocation: {kind: "vitrine", code: "77", label: "Vitrine 77", shelf: null}, currentLocationBasis: "confirmed"})),
    vitrines: [{code: "77", summary: "", families: [{id: "other-family", title: "Nimbarka–Kathia", sourceIds: ["other"], rationale: "", suggestedVitrines: ["77"]}],
      cityGroups: [{id: "city", title: "Vrindavan", sourceIds: [pair.disciple.sourceId, "local"], rationale: "", suggestedVitrines: ["77"]},
        {id: "additions", title: "Curator additions", sourceIds: [pair.teacher.sourceId], rationale: "", suggestedVitrines: ["77"]}]}], alternatives: [], reportedPlacements: []};
}

test("reunion is distinct, deduplicated, and preserves pinned context and recorded placements", () => {
  const original = fixture(), before = JSON.stringify(original);
  const result = projectSourceFamilyReunion(original);
  assert.equal(JSON.stringify(original), before);
  assert.equal(result.version, original.version);
  assert.equal(result.assignmentDigest, original.assignmentDigest);
  assert.deepEqual(result.entries, original.entries);
  assert.deepEqual(result.vitrines[0].families[0], original.vitrines[0].families[0]);
  const family = result.vitrines[0].families[1];
  assert.deepEqual(family.sourceIds, [pair.teacher.sourceId, pair.disciple.sourceId]);
  assert.equal(family.edges?.[0].label, "disciple · source-recorded");
  assert.deepEqual(result.vitrines[0].cityGroups[0].sourceIds, ["local"]);
  assert.deepEqual(projectSourceFamilyReunion(result), result);
});

test("newer destination, changed identity, or absent membership prevents the reunion", () => {
  for (const change of ["destination", "identity", "membership"]) {
    const guide = fixture();
    if (change === "destination") guide.entries[0].destination = "7";
    if (change === "identity") guide.entries[0].saintId = "different";
    if (change === "membership") guide.vitrines[0].cityGroups.pop();
    assert.equal(projectSourceFamilyReunion(guide), guide);
  }
});

import {projectGajananDisplayRelationship, gajananGangadharaRelationship as relation} from "./spn-source-family-reunion";

function dattaFixture(): StarterMoveGuide {
  const guide = fixture();
  guide.entries = [relation.parent, relation.child].map(member => ({...guide.entries[0], ...member, destination: "3", city: "Nepal",
    currentLocation: {kind: "vitrine", code: "18", label: "Vitrine 18", shelf: "B"}}));
  guide.vitrines = [{code: "3", summary: "Datta", families: [{id: "akkalkot", title: "Akkalkot branch", rationale: "Existing lineage", suggestedVitrines: ["3"],
    sourceIds: ["ancestor", relation.parent.sourceId], edges: [{fromSourceId: "ancestor", toSourceId: relation.parent.sourceId, label: "existing"}]}],
    cityGroups: [{id: "additions", title: "Curator additions", rationale: "", suggestedVitrines: ["3"], sourceIds: [relation.child.sourceId, "other"]}]}];
  return guide;
}

test("Gajanan joins the existing Akkalkot branch without changing physical location or other edges", () => {
  const guide = dattaFixture(), before = JSON.stringify(guide);
  const result = projectGajananDisplayRelationship(guide);
  assert.equal(JSON.stringify(guide), before);
  assert.deepEqual(result.vitrines[0].families[0].sourceIds, ["ancestor", relation.parent.sourceId, relation.child.sourceId]);
  assert.deepEqual(result.vitrines[0].families[0].edges?.[0], guide.vitrines[0].families[0].edges?.[0]);
  assert.equal(result.vitrines[0].families[0].edges?.[1].label, "Initiation / succession");
  assert.deepEqual(result.vitrines[0].cityGroups[0].sourceIds, ["other"]);
  assert.deepEqual(result.entries[1].currentLocation, guide.entries[1].currentLocation);
  assert.equal(result.entries[1].city, "Shivpuri, Akkalkot");
  assert.equal(result.assignmentDigest, guide.assignmentDigest);
  assert.deepEqual(projectGajananDisplayRelationship(result), result);
});

test("Gajanan relationship does not force a destination, identity, or missing family", () => {
  for (const change of ["destination", "identity", "membership", "family"]) {
    const guide = dattaFixture();
    if (change === "destination") guide.entries[1].destination = "73";
    if (change === "identity") guide.entries[1].saintId = "Shegaon-or-other";
    if (change === "membership") guide.vitrines[0].cityGroups = [];
    if (change === "family") guide.vitrines[0].families = [];
    assert.equal(projectGajananDisplayRelationship(guide), guide);
  }
});
