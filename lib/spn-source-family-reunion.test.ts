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
