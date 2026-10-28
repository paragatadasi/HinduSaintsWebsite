import test from "node:test";
import assert from "node:assert/strict";
import { spnV16Release } from "./spn-v16-release";
import baseline from "../data/museum/spn-starter-reviewed-proposal-v7.json";
import { reconcileSpnRoomProposal } from "./spn-room-proposal";
import type { MuseumSaintPlacement } from "./museum-proposals";
import { currentSpnProposalRelease } from "./spn-current-proposal";
import { registeredStarterGuide } from "./spn-starter-guide-registry";
import { correctSpnProposal } from "./spn-proposal-corrections";

test("the accepted planner, move source and guide share the audited v16 baseline", () => {
  assert.equal(currentSpnProposalRelease.acceptedBaseline, true);
  assert.equal(currentSpnProposalRelease.proposal.version, registeredStarterGuide.proposalVersion);
  const corrected = correctSpnProposal(currentSpnProposalRelease);
  const assignments = new Map(corrected.proposal.rows.map(row => [row.sourceId, row.vitrine]));
  for (const row of registeredStarterGuide.rows) assert.equal(assignments.get(row.sourceId), row.vitrine);
  for (const row of registeredStarterGuide.transitionRowsOutsideStarter) assert.equal(assignments.get(row.sourceId), row.destination.vitrine);
});

test("v16 projection conserves raw source evidence and baseline curator revision tokens", () => {
  const rows = spnV16Release.proposal.rows;
  assert.equal(rows.length, 1423); assert.equal(new Set(rows.map(row => row.sourceId)).size, 1423);
  for (const row of rows) {
    const original = baseline.rows.find(source => source.sourceId === row.sourceId)!;
    assert.equal(row.saintId, original.saintId);
    assert.equal(row.sourceVitrine, original.sourceVitrine); assert.equal(row.sourceShelf, original.sourceShelf);
    assert.deepEqual(row.baseline, original.baseline);
  }
  assert.deepEqual(spnV16Release.proposal.namedOnly, baseline.namedOnly);
});

test("all reviewed case totals and explorer summaries derive from current v16 destinations", () => {
  for (const reviewed of spnV16Release.proposal.reviewCases) {
    const indicator = spnV16Release.proposal.indicators.find(row => row.vitrine === reviewed.vitrine)!;
    assert.ok(Math.abs(indicator.estimatedRequiredShelfShares - reviewed.after.known) < 1e-8);
    assert.equal(indicator.unknownPlanningFootprintCount, reviewed.after.unknown);
    assert.equal(spnV16Release.designData.options[0].assignments.find(row => row.number === reviewed.vitrine)?.subsection, reviewed.title);
  }
  assert.equal(spnV16Release.proposal.indicators.find(row => row.vitrine === "2")!.potentialFlexibleSpace, false);
  const available = spnV16Release.proposal.indicators.find(row => row.vitrine === "68")!;
  assert.equal(available.flexibleSpaceExclusion, null);
  assert.equal(available.potentialFlexibleSpace, false); // Chidambar's dimensions remain unknown.
});

test("activating a baseline cannot overwrite a newer curator destination", () => {
  const proposed = spnV16Release.proposal.rows.find(row => row.baseline && row.saintId)!;
  const live = { id: proposed.baseline!.placementId, saintId: proposed.saintId, name: proposed.name,
    section: proposed.section, tier: proposed.baseline!.tier, familyId: proposed.baseline!.familyKey,
    spnRegionTags: proposed.baseline!.regionTags,
    arrangement: { status: "Planned", vitrine: "99", shelf: "C", revision: "newer-curator-revision", proposalRevision: proposed.baseline!.proposalRevision } } as MuseumSaintPlacement;
  const [result] = reconcileSpnRoomProposal([proposed], [live], { acceptedBaseline: true });
  assert.equal(result.effectiveVitrine, "99"); assert.equal(result.currentShelf, "C");
  assert.match(result.reviewReason, /retained/);
});
