import assert from "node:assert/strict";
import test from "node:test";
import { getMuseumProposalData, searchMuseumPlacements, type MuseumSaintPlacement } from "./museum-proposals";
import { rankMuseumPlacementSearchResults } from "./museum-search";
import { searchWorkingMuseumPlacements } from "./museum-working-view";

const original = getMuseumProposalData().placements;
const anandamoyi = original.find(row => row.id === "recBVn7Vp9onOO9Bh")!;

test("historical and working museum searches share alternate-spelling ranking", () => {
  for (const query of ["anandamayi ma", "Anandamoyi Ma", "ANANDAMAYI", "Ānandamayī Mā"]) {
    assert.equal(searchMuseumPlacements(query)[0]?.id, anandamoyi.id, query);
    assert.equal(searchWorkingMuseumPlacements(original, query)[0]?.id, anandamoyi.id, query);
  }
});

test("working searches rank current aliases without restoring superseded source names", () => {
  const current: MuseumSaintPlacement = {
    ...anandamoyi, name: "Nirmala Sundari", searchNames: ["Anandamoyi Ma"],
    saintId: "reviewed-saint", placementState: "Confirmed", section: "Current section"
  };
  const unrelated = { ...anandamoyi, id: "unrelated", name: "Tukaram", searchNames: [] };
  assert.equal(searchWorkingMuseumPlacements([unrelated, current], "Anandamayi Ma")[0], current);
  assert.equal(rankMuseumPlacementSearchResults([current], "anandamayi")[0], current);
  assert.equal(current.section, "Current section");
  assert.equal(current.placementState, "Confirmed");
});

test("single letters and honorifics survive museum matching", () => {
  for (const query of ["g", "baba"]) {
    assert.ok(searchWorkingMuseumPlacements(original, query).length > 0, query);
    assert.ok(searchMuseumPlacements(query).length > 0, query);
  }
});

test("museum metadata remains searchable alongside saint names", () => {
  const current = { ...anandamoyi, section: "Testgallery", sampradaya: "Testtradition", spiritualRegions: ["Testregion"], normalizedPlaces: ["Testplace"] };
  for (const query of ["Testgallery", "Testtradition", "Testregion", "Testplace"]) {
    assert.equal(searchWorkingMuseumPlacements([current], query)[0], current);
  }
});

test("section search preserves its supplied scope and blank-query order", () => {
  const scope = [anandamoyi, { ...anandamoyi, id: "other", name: "Tukaram" }];
  assert.deepEqual(rankMuseumPlacementSearchResults(scope, "  "), scope);
  assert.deepEqual(rankMuseumPlacementSearchResults([scope[1]], "anandamayi ma"), []);
  assert.equal(rankMuseumPlacementSearchResults(scope, "anandamayi ma")[0], anandamoyi);
});

test("museum searches retain limits and empty/unmatched-query behavior", () => {
  assert.equal(searchWorkingMuseumPlacements(original, "baba", 2).length, 2);
  assert.equal(searchMuseumPlacements("baba", 2).length, 2);
  assert.deepEqual(searchWorkingMuseumPlacements(original, "   "), []);
  assert.deepEqual(searchMuseumPlacements("   "), []);
  assert.deepEqual(searchWorkingMuseumPlacements(original, "zzzzzzzzzzzzz"), []);
});
