import test from "node:test";
import assert from "node:assert/strict";
import { northernVoyage, applyNorthernVoyage } from "./spn-northern-voyage";
import { reconcileSpnRoomProposal, type ProposalObservation } from "./spn-room-proposal";
import type { MuseumSaintPlacement } from "./museum-proposals";
import east from "../data/museum/spn-east-fill-reviewed-baseline-v1.json";
import fillGuide from "../data/museum/spn-fill-first-guide-v1.json";
import { currentSpnProposalRelease } from "./spn-current-proposal";
import { correctSpnProposal } from "./spn-proposal-corrections";

const rows: ProposalObservation[] = northernVoyage.assignments.map(row => ({ sourceId: row.sourceId,
  saintId: row.saintId, name: row.name, vitrine: "original", tier: row.capturedTier,
  section: row.capturedBaseline.section, sourceVitrine: "", sourceShelf: "", unresolved: row.status === "pending",
  allocationKind: "baseline", share: row.spaceEstimate, state: "shelf_proxy", baseline: row.capturedBaseline }));

test("Northern V15 packet assigns the combined East and Nepal group and preserves pending and excluded sources", () => {
  const before = JSON.stringify(rows);
  const result = applyNorthernVoyage(rows);
  assert.equal(result.filter(row => row.vitrine === "74").length, 23);
  assert.equal(result.find(row => row.sourceId === "recmWirQlF3WoLTYk")?.vitrine, "original");
  assert.equal(result.filter(row => row.vitrine !== "original").length, 111);
  assert.equal(northernVoyage.pendingReceiverSourceIds.length, 11);
  for (const id of northernVoyage.excludedAlreadyApproved80) assert.ok(!result.some(row => row.sourceId === id));
  assert.equal(JSON.stringify(rows), before);
  assert.equal(northernVoyage.researchPacketVersion, "spn-northern-voyage-2026-10-29-v15-review");
  assert.equal(result.find(row => row.sourceId === "receeTTYzFn1nRAom")?.vitrine, "20");
  assert.equal(result.find(row => row.sourceId === "recijNKdW2wF5Lhw1")?.vitrine, "11");
  assert.equal(result.find(row => row.sourceId === "recBpkMpvzm57a1J8")?.vitrine, "36");
  assert.equal(result.find(row => row.sourceId === "rectqE1YWAEVoP9z3")?.vitrine, "68");
  assert.equal(northernVoyage.releaseStatus, "held");
  assert.equal(northernVoyage.preservedPhysical73.length, 14);
});

test("changed source identities cannot silently inherit a Northern destination", () => {
  assert.throws(() => applyNorthernVoyage(rows.map((row, i) => i ? row : { ...row, saintId: "different" })), /identities need reconciliation/);
});

test("every approved observation resolves in the real retained proposal source inventory", () => {
  const base = correctSpnProposal(currentSpnProposalRelease).proposal;
  const result = applyNorthernVoyage([...base.rows, ...base.namedOnly]);
  assert.equal(result.find(row => row.sourceId === "recijNKdW2wF5Lhw1")?.vitrine, "11");
  assert.equal(result.find(row => row.sourceId === "rec4V2uLs4HP4Ps3d")?.vitrine, "74");
});

test("East baseline retains the exact registered 50 destinations and distinguishes confirmed placements from holds", () => {
  assert.equal(east.assignments.length, 50);
  assert.equal(new Set(east.assignments.map(row => row.sourceId)).size, 50);
  for (const row of east.assignments) assert.equal(fillGuide.rows.find(guide => guide.sourceId === row.sourceId)?.destination, row.destination);
  assert.equal(east.confirmedExisting73.length, 14);
  assert.equal(east.heldSourceIds.length, 2);
  assert.ok(east.heldSourceIds.every(id => !east.confirmedExisting73.includes(id)));
  assert.equal(east.outgoingStale73.length, 17);
  assert.ok(east.outgoingStale73.every(row => row.next === "23" && row.nextCount === 1));
  assert.equal(east.physicalWrites, false);
  assert.equal(northernVoyage.physicalWrites, false);
});

test("newer curator destinations and tiers retain precedence after the reviewed Northern baseline", () => {
  const source = northernVoyage.assignments.find(row => row.destination === "74")!;
  const live: MuseumSaintPlacement = { alternatives: [], confidence: "high", rationale: "", note: "", familySize: 1,
    spiritualRegions: [], sampradaya: "", needsResearch: false, normalizedPlaces: [],
    id: source.capturedBaseline.placementId, sourceRecordId: source.sourceId, saintId: source.saintId!,
    name: source.name, tier: "Secondary", section: source.capturedBaseline.section,
    familyId: "", curatorialFamily: "", spnRegionTags: [],
    arrangement: { familyKey: "", confirmedAt: null, inventoryAcknowledged: false,
      status: "Planned", vitrine: "12", shelf: "A", revision: "newer-curator-revision", proposalRevision: source.capturedBaseline.proposalRevision }
  };
  const result = reconcileSpnRoomProposal(applyNorthernVoyage(rows), [live], { acceptedBaseline: true });
  assert.equal(result.find(row => row.sourceId === source.sourceId)?.effectiveVitrine, "12");
  assert.equal(result.find(row => row.sourceId === source.sourceId)?.tier, "Secondary");
});
