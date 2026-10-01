import assert from "node:assert/strict";
import test from "node:test";
import { projectSourceVitrines, SPN_WEBSITE_AIRTABLE_BASE_ID as base } from "./museum-vitrine-source";
const row = (id: string, fields: unknown, baseId = base) => ({ baseId, tableIdOrName: "Saints", recordId: id, rawFieldsJson: fields });
const link = (id: string, entityId: string | null = "saintA", baseId = base) => ({ externalId: `${baseId}:Saints:${id}`, entityId });
const active = new Set(["saintA", "saintB"]);
test("exact SPN source identity projects a location without name matching", () => {
  const result = projectSourceVitrines([row("recA", { "Vitrine #": 52, Shelf: " c " })], [link("recA")], active);
  assert.deepEqual(result.get("saintA"), { museum: "SPN", vitrine: "52", shelf: "C" });
});
test("consistent duplicate rows collapse but conflicting vitrines or shelves do not", () => {
  const rows = [row("recA", { "Vitrine #": 52, Shelf: "C" }), row("recB", { "Vitrine #": "52", Shelf: "C" })];
  const links = [link("recA"), link("recB")];
  assert.equal(projectSourceVitrines(rows, links, active).size, 1);
  for (const fields of [{ "Vitrine #": 53, Shelf: "C" }, { "Vitrine #": 52, Shelf: "D" }, { "Vitrine #": 52 }, {}]) {
    assert.equal(projectSourceVitrines([rows[0], row("recB", fields)], links, active).size, 0);
  }
  assert.equal(projectSourceVitrines([rows[0]], links, active).size, 0);
});
test("missing, malformed, zero and multi-location values never become locations", () => {
  for (const value of [null, "", 0, -1, 1.2, "12, 13", [12], {}, "12/C"]) {
    assert.equal(projectSourceVitrines([row("recA", { "Vitrine #": value })], [link("recA")], active).size, 0);
  }
  assert.deepEqual(projectSourceVitrines([row("recA", { "Vitrine #": 12 })], [link("recA")], active).get("saintA"), { museum: "SPN", vitrine: "12", shelf: null });
});
test("unlinked, archived, wrong-base and ambiguous identities are excluded", () => {
  const rows = [row("recA", { "Vitrine #": 12 })];
  for (const links of [[], [link("recA", null)], [link("recA", "archived")], [link("recA", "saintA", "appOther")], [link("recA"), link("recA", "saintB")]]) {
    assert.equal(projectSourceVitrines(rows, links, active).size, 0);
  }
  assert.equal(projectSourceVitrines([row("recA", { "Vitrine #": 12 }, "appOther")], [link("recA")], active).size, 0);
  assert.equal(projectSourceVitrines([...rows, ...rows], [link("recA")], active).size, 0);
});
