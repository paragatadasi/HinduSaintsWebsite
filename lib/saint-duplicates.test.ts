import assert from "node:assert/strict";
import test from "node:test";
import { buildSaintDuplicateCandidates, compareSaintsForDuplicate, duplicateDecisionUpdate, duplicatePairKey } from "./saint-duplicates";

test("matches honorific and transliteration variants using the shared search forms", () => {
  const result = compareSaintsForDuplicate(
    { id: "saint-b", displayName: "Sree Ramana Maharishi", canonicalName: "Sree Ramana Maharishi" },
    { id: "saint-a", displayName: "Ramana Maharshi", canonicalName: "Sri Ramana Maharshi" }
  );

  assert.equal(result?.entityId, "saint-a");
  assert.equal(result?.candidateEntityId, "saint-b");
  assert.equal(result?.confidence, "high");
  assert.equal(result?.evidence.exactIdentityForm, true);
});

test("uses shared dates and places as evidence for a close name", () => {
  const result = compareSaintsForDuplicate(
    { id: "left", displayName: "Chaitanya Mahaprabhu", canonicalName: "Chaitanya Mahaprabhu", birthYear: 1486, places: [{ placeId: "puri" }] },
    { id: "right", displayName: "Chaitnya Mahaprabhu", canonicalName: "Chaitnya Mahaprabhu", birthYear: 1486, places: [{ placeId: "puri" }] }
  );

  assert.ok(result);
  assert.equal(result.evidence.sharedBirthRange, true);
  assert.deepEqual(result.evidence.sharedPlaceIds, ["puri"]);
});

test("rejects unrelated saints even when they share a place and tradition", () => {
  const result = compareSaintsForDuplicate(
    { id: "left", displayName: "Kabir", canonicalName: "Sant Kabir", places: [{ placeId: "kashi" }], traditions: [{ traditionId: "bhakti" }] },
    { id: "right", displayName: "Tulsidas", canonicalName: "Goswami Tulsidas", places: [{ placeId: "kashi" }], traditions: [{ traditionId: "bhakti" }] }
  );

  assert.equal(result, null);
});

test("returns each pair once in descending evidence order", () => {
  const results = buildSaintDuplicateCandidates([
    { id: "one", displayName: "Sri Anandamayi Ma", canonicalName: "Anandamayi Ma" },
    { id: "two", displayName: "Anandamayi Ma", canonicalName: "Anandamayi Ma" },
    { id: "three", displayName: "Swami Sivananda", canonicalName: "Swami Sivananda" }
  ]);

  assert.equal(results.length, 1);
  assert.equal(duplicatePairKey(results[0].entityId, results[0].candidateEntityId), "one:two");
});

test("duplicate review decisions keep merge separate from confirmation", () => {
  assert.deepEqual(duplicateDecisionUpdate("confirm"), { finalized: true, status: "resolved" });
  assert.deepEqual(duplicateDecisionUpdate("ignore"), { finalized: true, status: "ignored" });
  assert.deepEqual(duplicateDecisionUpdate("defer"), { finalized: false, status: "open" });
  assert.deepEqual(duplicateDecisionUpdate("reopen"), { finalized: false, status: "open" });
});
