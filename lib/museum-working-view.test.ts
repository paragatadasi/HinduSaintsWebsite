import assert from "node:assert/strict";
import test from "node:test";
import { buildMuseumView, getMuseumProposalData, type MuseumSaintPlacement } from "./museum-proposals";
import { buildWorkingMuseumView, museumRelationshipDetails, searchWorkingMuseumPlacements, type CurrentMuseumSaint } from "./museum-working-view";

const row = (id = "recA", changes: Partial<MuseumSaintPlacement> = {}): MuseumSaintPlacement => ({
  id, name: "Export name", section: "Section A", alternatives: [], tier: "Featured", confidence: "High",
  rationale: "Existing proposal", note: "", familyId: "familyA", curatorialFamily: "", familySize: 2,
  spiritualRegions: ["Export region"], sampradaya: "Export tradition", normalizedPlaces: ["Export place"],
  needsResearch: false, ...changes
});
const saint = (changes: Partial<CurrentMuseumSaint> = {}): CurrentMuseumSaint => ({
  id: "saintA", name: "Current name", aliases: ["Alternate name"], sampradaya: "", normalizedPlaces: [],
  spiritualRegions: [], member: { BirthDate: "", SamadhiDate: "" }, confirmed: [], ...changes
});
const link = (record = "recA", entityId: string | null = "saintA", base = "appA") => ({
  id: base + record, externalId: base + ":Saints:" + record, entityId
});
const source = (...rows: MuseumSaintPlacement[]) => buildMuseumView(
  rows, new Map([["recA", { BirthDate: "1900", Masters: "Old master" }]])
);

test("working view preserves every proposal and all 23 sections before any placements exist", () => {
  const original = getMuseumProposalData();
  const view = buildWorkingMuseumView(original, [], [], []);
  assert.equal(view.placements.length, original.placements.length);
  assert.equal(view.sections.length, 23);
  assert.ok(view.placements.every(p => p.placementState === "Unlinked"));
  for (const section of original.sections) assert.ok(view.sectionBySlug.has(section.slug));
});

test("matched cards use canonical values and intentionally cleared fields, without mutating the export", () => {
  const original = source(row());
  const view = buildWorkingMuseumView(original, [saint()], [link()], []);
  assert.equal(view.placements[0].name, "Current name");
  assert.equal(view.placements[0].saintId, "saintA");
  assert.equal(view.placements[0].placementState, "Proposed");
  assert.equal(view.placements[0].sampradaya, "");
  assert.deepEqual(view.placements[0].normalizedPlaces, []);
  assert.deepEqual(view.membersById.get("recA"), { BirthDate: "", SamadhiDate: "" });
  assert.equal(original.placements[0].name, "Export name");
  assert.equal(original.membersById.get("recA")?.Masters, "Old master");
  assert.equal(searchWorkingMuseumPlacements(view.placements, "alternate").length, 1);
  assert.equal(searchWorkingMuseumPlacements(view.placements, "export name").length, 0);
});

test("confirmed move appears once in its new section and leaves the original section accessible", () => {
  const confirmed = row("assignmentA", { section: "Section B", familyId: "", tier: "Secondary" });
  const view = buildWorkingMuseumView(source(row()), [saint({ confirmed: [confirmed] })], [link()], [
    { name: "Section B", slug: "custom-b", descriptionMarkdown: "Current description" }
  ]);
  assert.equal(view.placements.length, 1);
  assert.equal(view.placements[0].placementState, "Confirmed");
  assert.equal(view.sectionBySlug.get("section-a")?.total, 0);
  assert.equal(view.sectionBySlug.get("custom-b")?.secondary, 1);
  assert.equal(view.sectionBySlug.get("section-b")?.secondary, 1);
  assert.equal(view.placements[0].familyId, "");
});

test("confirmed saints without an export proposal are included", () => {
  const view = buildWorkingMuseumView(source(), [saint({ confirmed: [row("assignment")] })], [], []);
  assert.equal(view.placements.length, 1);
  assert.equal(view.placements[0].saintId, "saintA");
});

test("unlinked, archived, and ambiguous source identities are retained and never matched by name", () => {
  for (const links of [[], [link("recA", "archived")], [link(), link("recA", "saintA", "appB")]]) {
    const view = buildWorkingMuseumView(source(row()), [saint()], links, []);
    assert.equal(view.placements[0].placementState, "Unlinked");
    assert.equal(view.placements[0].saintId, undefined);
    assert.equal(view.placements[0].name, "Export name");
    assert.ok(view.placements[0].linkIssue);
  }
});

test("merged identical proposals count once; conflicting proposals stay visible until resolved", () => {
  const links = [link(), link("recB")];
  const merged = buildWorkingMuseumView(source(row(), row("recB")), [saint()], links, []);
  assert.equal(merged.placements.length, 1);
  const conflict = buildWorkingMuseumView(source(row(), row("recB", { section: "Section B" })), [saint()], links, []);
  assert.equal(conflict.placements.length, 2);
  assert.ok(conflict.placements.every(p => p.placementState === "Conflicting proposals"));
});

test("relationship direction, evidence, reciprocal duplicates and archived endpoints are respected", () => {
  const common = { status: "needs_review", evidenceStatus: "traditional", confidence: "medium",
    other: { id: "guru", displayName: "Teacher", status: "published" } };
  const result = museumRelationshipDetails([
    { ...common, relationshipType: "guru", incoming: false },
    { ...common, relationshipType: "disciple", incoming: true },
    { ...common, relationshipType: "guru", incoming: true, other: { ...common.other, id: "pupil", displayName: "Pupil" } },
    { ...common, relationshipType: "partner", incoming: false, status: "archived" },
    { ...common, relationshipType: "incarnation", incoming: false, other: { ...common.other, status: "archived" } }
  ]);
  assert.equal(result.Masters, "Teacher (needs review, traditional, medium confidence)");
  assert.equal(result.Disciples, "Pupil (needs review, traditional, medium confidence)");
  assert.equal(result.Partner, undefined);
  assert.equal(result.Incarnation, undefined);
});

test("family move overlay changes proposed and unlinked cards while preserving confirmed placement and raw export", async () => {
  const { applyFamilyProposalMoves } = await import("./museum-family-move-domain");
  const original = source(row(), row("recB"), row("recC"));
  const editable = applyFamilyProposalMoves(original, [{ familyKey: "familyA", section: "Moved section", version: 1 }]);
  const second = saint({ id: "saintB", confirmed: [row("assignmentB", { section: "Confirmed section", familyId: "" })] });
  const view = buildWorkingMuseumView(editable, [saint(), second], [link(), link("recB", "saintB")], []);
  assert.equal(view.placements.find(p => p.saintId === "saintA")?.section, "Moved section");
  assert.equal(view.placements.find(p => p.id === "recC")?.section, "Moved section");
  assert.equal(view.placements.find(p => p.saintId === "saintB")?.section, "Confirmed section");
  assert.ok(original.placements.every(p => p.section === "Section A"));
  assert.ok(view.sectionBySlug.has("section-a"));
});


test("source vitrine appears only on resolved working proposals and survives confirmed placement", () => {
  const sourceVitrine = { museum: "SPN" as const, vitrine: "52", shelf: "C" };
  const original = source(row());
  const current = saint({ sourceVitrine });
  const proposed = buildWorkingMuseumView(original, [current], [link()], []);
  assert.deepEqual(proposed.placements[0].sourceVitrine, sourceVitrine);
  const confirmed = buildWorkingMuseumView(original, [{ ...current, confirmed: [row("placement")] }], [link()], []);
  assert.deepEqual(confirmed.placements[0].sourceVitrine, sourceVitrine);
  assert.equal(buildWorkingMuseumView(original, [current], [], []).placements[0].sourceVitrine, undefined);
  assert.equal(original.placements[0].sourceVitrine, undefined);
});
