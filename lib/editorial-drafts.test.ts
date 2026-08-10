import assert from "node:assert/strict";
import test from "node:test";
import {
  draftString,
  draftStrings,
  editorialDraftSaveSchema,
  isEditorialDraftSection,
  sanitizeEditorialDraftPayload,
  type EditorialDraftSnapshot
} from "./editorial-drafts";

test("editorial drafts allow only configured fields for a section", () => {
  assert.deepEqual(sanitizeEditorialDraftPayload("saint", "overview", {
    displayName: "Draft name",
    canonicalName: "Canonical",
    shortDescription: "Interim copy",
    status: "published",
    injected: "discard me"
  }), {
    displayName: "Draft name",
    canonicalName: "Canonical"
  });
});

test("editorial draft sections are explicit per entity", () => {
  assert.equal(isEditorialDraftSection("tradition", "long_form"), true);
  assert.equal(isEditorialDraftSection("place", "long_form"), false);
  assert.equal(isEditorialDraftSection("instagram_item", "overview"), false);
});

test("editorial draft requests reject oversized field values", () => {
  const result = editorialDraftSaveSchema.safeParse({
    entityType: "saint",
    entityId: "cm0000000000000000000000",
    section: "overview",
    baseVersion: 1,
    payload: { shortDescription: "x".repeat(25_001) }
  });
  assert.equal(result.success, false);
});

test("draft value helpers preserve strings and repeated inputs", () => {
  const draft: EditorialDraftSnapshot = {
    id: "draft-1",
    baseVersion: 2,
    revision: 4,
    payload: { name: "Recovered", localityIds: ["one", "two"] },
    updatedAt: new Date(0).toISOString(),
    updatedBy: "Editor"
  };

  assert.equal(draftString(draft, "name", "Live"), "Recovered");
  assert.equal(draftString(draft, "missing", "Live"), "Live");
  assert.deepEqual(draftStrings(draft, "localityIds", []), ["one", "two"]);
});
