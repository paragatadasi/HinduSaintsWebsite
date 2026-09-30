import assert from "node:assert/strict";
import test from "node:test";
import { getMuseumProposalData, museumSectionSlug } from "./museum-proposals";
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
