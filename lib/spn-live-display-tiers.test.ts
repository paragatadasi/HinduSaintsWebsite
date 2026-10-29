import {activeSpnGuide} from "./spn-observation-suppression";
import test from "node:test";
import assert from "node:assert/strict";
import { projectCurrentPrimaryAnchors, projectStarterDisplayTiers } from "./spn-live-display-tiers";
import { starterMoveGuide } from "./spn-starter-move-guide";
import { spnV16Release } from "./spn-v16-release";
import type { ExplorerObservation } from "./spn-room-proposal";

const sourceId = "rechBZw1LyW9TTX9L";
const captured = starterMoveGuide.entries.find(row => row.sourceId === sourceId)!;
const guide = { ...starterMoveGuide, entries: [captured] };
const current = { id: "reviewed-placement", sourceRecordId: sourceId, saintId: captured.saintId!, tier: "Featured" as const };

test("current tier overlays a captured Secondary without changing guide identity or destinations", () => {
  const before = JSON.stringify(guide);
  const projected = projectStarterDisplayTiers(guide, [current]);
  assert.equal(projected.entries[0].tier, "Primary");
  assert.equal(projected.entries[0].destination, captured.destination);
  for (const key of ["version", "contentDigest", "assignmentDigest", "proposalVersion", "reportedPlacements", "vitrines", "alternatives"] as const) assert.deepEqual(projected[key], activeSpnGuide(guide)[key]);
  assert.equal(JSON.stringify(guide), before);
});

test("changed identities, conflicting rows and ambiguous matches cannot supply a current tier", () => {
  for (const rows of [[{ ...current, saintId: "another-person" }], [{ ...current, linkIssue: "Source conflict" }],
    [{ ...current, sourceRecordId: undefined }, { ...current, id: "second", sourceRecordId: undefined, tier: "Tertiary" as const }]]) {
    const projected = projectStarterDisplayTiers(guide, rows).entries[0];
    assert.equal(projected.tier, captured.tier);
    assert.ok(projected.reviewNotes?.some(note => note.includes("captured tier")));
  }
  const unmatched = { ...captured, saintId: null };
  assert.equal(projectStarterDisplayTiers({ ...guide, entries: [unmatched] }, [current]).entries[0], unmatched);
});

test("an exact source match wins over other observations sharing a canonical saint", () => {
  const projected = projectStarterDisplayTiers(guide, [current, { ...current, id: "other", sourceRecordId: "another-source", tier: "Tertiary" }]);
  assert.equal(projected.entries[0].tier, "Primary");
});

const observed = (overrides: Partial<ExplorerObservation>): ExplorerObservation => ({ ...spnV16Release.proposal.rows[0],
  regions: [], currentVitrine: "", currentShelf: "", currentStatus: "Proposed", reviewReason: "", effectiveVitrine: "78", ...overrides });

test("current Primary anchors follow effective curator destinations and omit held identities", () => {
  const option = spnV16Release.designData.options[0];
  const before = JSON.stringify(option);
  const result = projectCurrentPrimaryAnchors(option, [
    observed({ saintId: "srinivasa", name: "Srinivasa", tier: "Primary" }),
    observed({ saintId: "srinivasa", name: "Srinivasa", tier: "Primary", sourceId: "second-relic" }),
    observed({ saintId: "hemalata", name: "Hemalata", tier: "Featured", effectiveVitrine: "29" }),
    observed({ saintId: "held", name: "Unverified", tier: "Primary", unresolved: true }),
    observed({ saintId: "secondary", name: "Secondary", tier: "Secondary" }),
  ]);
  assert.equal(result.primeAnchors["78"].people, "Srinivasa");
  assert.equal(result.primeAnchors["29"].people, "Hemalata");
  assert.deepEqual(result.assignments, option.assignments);
  assert.equal(JSON.stringify(option), before);
});
