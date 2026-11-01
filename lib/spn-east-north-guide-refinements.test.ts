import test from "node:test";
import assert from "node:assert/strict";
import {applyEastNorthGuideRefinements, eastNorthReadyRows} from "./spn-east-north-guide-refinements";
import {projectCompanionAdditions} from "./museum-companion-addition-projection";
import type {GuideEntry, StarterMoveGuide} from "./spn-move-guide";
import type {CompanionAddition} from "./museum-companion-additions-state";

const anil = eastNorthReadyRows.find(row => row.sourceId === "recVcmAKuNX8Dpp54")!;
const entry = (row: typeof anil): GuideEntry => ({sourceId: row.sourceId, saintId: row.canonicalId, name: row.name, tier: row.currentTier, city: "", relicDescription: "", destination: row.proposedVitrine, section: "Unchanged section", family: "", rationale: "", currentLocation: {kind: "vitrine", code: "23", label: "Vitrine 23"}, currentLocationBasis: "confirmed"});
const addition = (row: typeof anil): CompanionAddition => ({sourceId: row.sourceId, saintId: row.canonicalId, sourceRevision: row.sourceRevision, vitrine: row.proposedVitrine, shelf: null, version: 1, updatedAt: "2026-11-01T12:00:00Z", clientRequestId: "00000000-0000-4000-8000-000000000000"});
const base = (code: string): StarterMoveGuide => ({version: "frozen", contentDigest: "content", assignmentDigest: "assignments", proposalVersion: "proposal", title: "Guide", entries: [], vitrines: [{code, summary: "Existing story", families: [], cityGroups: []}], alternatives: [], reportedPlacements: []});

test("only the eighteen approved active observations are eligible; veena stays excluded", () => {
  assert.equal(eastNorthReadyRows.length, 18);
  assert.equal(new Set(eastNorthReadyRows.map(row => row.sourceId)).size, 18);
  assert.ok(!eastNorthReadyRows.some(row => row.sourceId === "recHatM8WlLSqKeyy"));
  assert.ok(eastNorthReadyRows.every(row => row.suggestedShelfIndex === null && !row.physicalMoveRecorded));
});

test("Anilananda joins the existing qualified Motilal branch only after a matching saved addition", () => {
  const guide = base("5");
  const parent = {...entry(anil), sourceId: "recwX7dFfmlq9FfAh", saintId: "cms0w7jbl08pr07qi8w9i43tn", name: "Motilal", currentLocation: {kind: "vitrine" as const, code: "5", label: "Vitrine 5"}};
  guide.entries = [parent];
  guide.vitrines[0].families = [{id: "kriya", title: "Kriya", sourceIds: [parent.sourceId], suggestedVitrines: ["5"], rationale: "", edges: []}];
  const before = JSON.stringify(guide);
  const result = projectCompanionAdditions({north: guide}, [addition(anil)], [{...entry(anil), lifeStatus: {tag: "May be alive", basis: "Missing canonical date"}}]).north;
  assert.deepEqual(result.vitrines[0].families[0].sourceIds, [parent.sourceId, anil.sourceId]);
  assert.equal(result.vitrines[0].families[0].edges?.[0].basis, "source");
  assert.equal(result.vitrines[0].cityGroups.length, 0);
  const child = result.entries.find(row => row.sourceId === anil.sourceId)!;
  assert.equal(child.currentLocation?.code, "23");
  assert.equal(child.section, "Unchanged section");
  assert.equal(child.lifeStatus?.tag, null);
  assert.ok(child.reviewNotesCollapsible);
  assert.ok(child.reviewNotes?.some(note => note.includes("identity remains qualified")));
  assert.equal(result.contentDigest, guide.contentDigest);
  assert.equal(JSON.stringify(guide), before);
  assert.deepEqual(projectCompanionAdditions({north: result}, [addition(anil)], [entry(anil)]).north, result);
});

test("missing, stale or changed-destination additions do not activate reviewed context", () => {
  const guide = base("5"); guide.entries = [entry(anil)];
  for (const additions of [[], [{...addition(anil), sourceRevision: "stale"}], [{...addition(anil), vitrine: "78"}]]) {
    assert.equal(applyEastNorthGuideRefinements(guide, additions).entries[0].reviewNotesCollapsible, undefined);
  }
});

test("provisional hinge keeps Gorakhpur together and Azamgarh distinct", () => {
  const rows = eastNorthReadyRows.filter(row => row.proposedVitrine === "11");
  const result = projectCompanionAdditions({north: base("11")}, rows.map(addition), rows.map(entry)).north;
  assert.deepEqual(result.vitrines[0].cityGroups.map(group => group.sourceIds.length).sort(), [1, 5]);
  assert.ok(result.vitrines[0].cityGroups.some(group => group.title === "Azamgarh"));
  assert.match(result.vitrines[0].fitGuidance!, /fit is not confirmed/);
  assert.equal(result.entries.length, 8);
  assert.deepEqual(result.vitrines[0].families[0].sourceIds, ["recf5WiUhs05Gg6dK", "recW6BHfpK6hd8n7S"]);
});


test("the full approved set appears once across real guides, including the limited hinge supplement", async () => {
  const {starterMoveGuide} = await import("./spn-starter-move-guide");
  const {northernMoveGuide} = await import("./spn-northern-guide");
  const {ramakrishnaMoveGuide} = await import("./spn-ramakrishna-guide");
  const {eastRemainderMoveGuide} = await import("./spn-east-remainder-guide");
  const {vrajRemainderMoveGuide} = await import("./spn-vraj-remainder-guide");
  const {hingeAdditionsMoveGuide, hingeAdditionsGuideDefinition, hingeAdditionsGuideContext} = await import("./spn-hinge-additions-guide");
  const {approvedHingeGuide} = await import("./spn-approved-hinge-guide");
  const {readStarterGuideDefinition, currentReceiverGuideDefinitions} = await import("./spn-starter-guide-registry");
  const result = projectCompanionAdditions({starter: starterMoveGuide, north: northernMoveGuide, "gosaiji-sai": ramakrishnaMoveGuide, east2: eastRemainderMoveGuide, vraj2: vrajRemainderMoveGuide, hinge: hingeAdditionsMoveGuide}, eastNorthReadyRows.map(addition), eastNorthReadyRows.map(entry));
  for (const row of eastNorthReadyRows) {
    const appearances = Object.values(result).flatMap(guide => guide.vitrines.flatMap(vitrine => [...vitrine.families, ...vitrine.cityGroups].filter(group => group.sourceIds.includes(row.sourceId)).map(() => vitrine.code)));
    assert.deepEqual(appearances, [row.proposedVitrine], row.name);
  }
  assert.equal(result.hinge.entries.length, 3);
  assert.equal(hingeAdditionsMoveGuide.entries.length, 0);
  assert.equal(result.hinge.allowClear, false);
  assert.equal(result.hinge.receivingOnly, true);
  assert.equal(result.hinge.requiredClearVitrines, undefined);
  assert.equal(Object.keys(hingeAdditionsGuideDefinition.physicalScope!.destinations).length, 3);
  assert.equal(readStarterGuideDefinition(hingeAdditionsGuideContext.guideVersion).readOnly, true);
  assert.ok(currentReceiverGuideDefinitions("8").some(definition => definition.context.guideVersion === approvedHingeGuide.context.guideVersion));
  assert.ok(currentReceiverGuideDefinitions("9").some(definition => definition.context.guideVersion === approvedHingeGuide.context.guideVersion));
  const kriya = result.north.vitrines.find(v => v.code === "5")!.families.find(group => group.sourceIds.includes(anil.sourceId))!;
  assert.ok(kriya.edges?.some(edge => edge.fromSourceId === "recwX7dFfmlq9FfAh" && edge.toSourceId === anil.sourceId && edge.basis === "source"));
  assert.equal(result.north.entries.find(row => row.sourceId === anil.sourceId)?.currentLocation?.code, "23");
});
