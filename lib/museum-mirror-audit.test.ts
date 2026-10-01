import assert from "node:assert/strict";
import test from "node:test";
import { auditMuseumMirror } from "./museum-mirror-audit";

test("mirror audit distinguishes absence, empty values and meaningful zero without exposing data", () => {
  const importedAt = new Date("2026-09-01T00:00:00Z");
  const report = auditMuseumMirror([
    { baseId: "appA", tableIdOrName: "Saints", importedAt, rawFieldsJson: {
      Name: "PRIVATE NAME", Vitrine: 0, Relics: ["recA", "recB"], Flag: false, Empty: "", Attachment: [{ url: "SECRET_URL" }]
    }},
    { baseId: "appA", tableIdOrName: "Saints", importedAt, rawFieldsJson: { Relics: [] }},
    { baseId: "appB", tableIdOrName: "Saints", importedAt, rawFieldsJson: { Name: "SECOND" }}
  ]);
  assert.equal(report.tables.length, 2);
  const field = (name: string) => report.tables[0].fields.find(f => f.name === name)!;
  assert.equal(field("Vitrine").nonemptyRows, 1);
  assert.equal(field("Vitrine").missingRows, 1);
  assert.equal(field("Vitrine").collectionFieldCandidate, true);
  assert.equal(field("Flag").nonemptyRows, 1);
  assert.equal(field("Empty").nonemptyRows, 0);
  assert.equal(field("Relics").largestLinkedRecordArray, 2);
  assert.equal(field("Relics").nonemptyRows, 1);
  for (const secret of ["PRIVATE NAME", "SECRET_URL", "recA", "recB"]) assert.ok(!JSON.stringify(report).includes(secret));
  assert.match(report.limitation, /does not prove/);
});
