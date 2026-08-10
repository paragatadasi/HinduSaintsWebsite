import assert from "node:assert/strict";
import test from "node:test";
import {
  editorialSnapshotsMatch,
  getEditorialRevisionActiveKey,
  saintNarrativeRevisionSchema
} from "./editorial-revisions";

test("editorial snapshots ignore object key ordering but preserve array ordering", () => {
  assert.equal(editorialSnapshotsMatch({ body: "Text", sources: [{ title: "A" }] }, { sources: [{ title: "A" }], body: "Text" }), true);
  assert.equal(editorialSnapshotsMatch({ sources: ["A", "B"] }, { sources: ["B", "A"] }), false);
});

test("active revision keys are stable per entity narrative", () => {
  assert.equal(getEditorialRevisionActiveKey("saint", "saint-id"), "saint:saint-id:narrative");
});

test("saint narrative revisions require a biography and validate sources", () => {
  const result = saintNarrativeRevisionSchema.safeParse({
    shortDescription: "A concise public description.",
    biographyTitle: "Life",
    biographyMarkdown: "Reviewed biography.",
    sources: [{ title: "Primary text", sourceType: "book" }]
  });

  assert.equal(result.success, true);
  assert.equal(saintNarrativeRevisionSchema.safeParse({ biographyTitle: "Life", biographyMarkdown: "", sources: [] }).success, false);
});

test("saint narrative citations must point to an associated revision source", () => {
  const valid = saintNarrativeRevisionSchema.safeParse({
    biographyTitle: "Life",
    biographyMarkdown: "Remembered teaching [Primary text](#source-ref-draft-primary).",
    sources: [{ citationKey: "draft-primary", title: "Primary text", sourceType: "book" }]
  });
  const invalid = saintNarrativeRevisionSchema.safeParse({
    biographyTitle: "Life",
    biographyMarkdown: "Unattached [source](#source-ref-missing).",
    sources: []
  });

  assert.equal(valid.success, true);
  assert.equal(invalid.success, false);
});
