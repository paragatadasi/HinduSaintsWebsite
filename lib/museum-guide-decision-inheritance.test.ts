import test from "node:test";
import assert from "node:assert/strict";
import { inheritGuideDecisions } from "./museum-guide-decision-inheritance";
import type { GuideDefinition, RegisteredSuggestion } from "./spn-starter-guide-registry";

const suggestion: RegisteredSuggestion = { id: "old", kind: "family", sourceIds: ["a", "b"], targetVitrine: "28" };
const definition = (version: string, row: RegisteredSuggestion): GuideDefinition => ({ context: { guideVersion: version, contentDigest: "digest", assignmentDigest: "assignment" }, suggestions: [row] });
const old = definition("v2", suggestion);
const guide = definition("v3", { ...suggestion, id: "new", sourceIds: ["b", "a"] });
const historical = { suggestionId: "old", decision: "declined", note: "Curator decision", version: 7, updatedAt: new Date("2026-10-27T10:00:00Z") };

test("exact equivalent decisions are inherited read-only with a new-version zero revision", () => {
  const history = [{ guide: old, decisions: [historical] }];
  const before = JSON.stringify(history);
  const [result] = inheritGuideDecisions(guide, [], history);
  assert.equal(result.suggestionId, "new"); assert.equal(result.decision, "declined"); assert.equal(result.version, 0);
  assert.equal(result.note, "Curator decision"); assert.equal(result.inheritedFrom?.version, 7);
  assert.equal(JSON.stringify(history), before);
});

test("an explicit new pending decision overrides the older declined decision", () => {
  const current = { ...historical, suggestionId: "new", decision: "pending", version: 1 };
  assert.deepEqual(inheritGuideDecisions(guide, [current], [{ guide: old, decisions: [historical] }]), [current]);
});

test("changed destination, source membership or relationship kind cannot inherit a decision", () => {
  for (const changed of [{ ...suggestion, targetVitrine: "27" }, { ...suggestion, sourceIds: ["a"] }, { ...suggestion, kind: "city" as const }]) {
    assert.deepEqual(inheritGuideDecisions(definition("v3", changed), [], [{ guide: old, decisions: [historical] }]), []);
  }
});
