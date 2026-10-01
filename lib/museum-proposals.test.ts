import assert from "node:assert/strict";
import test from "node:test";
import { getMuseumProposalData, museumSectionSlug, searchMuseumPlacements } from "./museum-proposals";
import { museumFlowZones } from "./museum-layout-groups";

test("historical section proposals remain complete without saved database placements", () => {
  const view = getMuseumProposalData();
  assert.equal(view.sections.length, 23);
  assert.equal(new Set(view.placements.map(row => row.id)).size, 1399);
  for (const name of museumFlowZones.flatMap(zone => [...zone.sections])) {
    const section = view.sectionBySlug.get(museumSectionSlug(name));
    assert.ok(section, `Visitor-flow section remains accessible: ${name}`);
    assert.ok(section.rows.length > 0);
    assert.equal(section.featured + section.secondary + section.tertiary, section.rows.length);
  }
  assert.ok(view.sections.some(section => section.primaryGroups.length > 0));
  assert.ok(view.sections.some(section => section.secondary > 0));
  assert.ok(view.sections.some(section => section.tertiary > 0));
});


test("museum proposal search finds Anandamoyi through the Anandamayi spelling", () => {
  for (const query of ["anandamayi ma", "Anandamoyi Ma", "ANANDAMAYI", "Ānandamayī Mā"]) {
    const results = searchMuseumPlacements(query);
    assert.equal(results[0]?.id, "recBVn7Vp9onOO9Bh", query);
  }
});

test("museum proposal search keeps letters, honorifics and location searches", () => {
  for (const query of ["g", "baba", "Bangladesh", "Bengal Shakta"]) {
    assert.ok(searchMuseumPlacements(query).length > 0, query);
  }
  assert.equal(searchMuseumPlacements("baba", 2).length, 2);
  assert.deepEqual(searchMuseumPlacements("   "), []);
  assert.deepEqual(searchMuseumPlacements("zzzzzzzzzzzzz"), []);
});
