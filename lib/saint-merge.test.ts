import assert from "node:assert/strict";
import test from "node:test";
import {
  getSaintMergeConflicts,
  resolveSaintMergeFields,
  type SaintMergeRecord
} from "./saint-merge";

function record(id: string, overrides: Partial<SaintMergeRecord> = {}): SaintMergeRecord {
  return {
    id,
    displayName: "Shared name",
    canonicalName: "Shared name",
    shortDescription: null,
    biographySummary: null,
    primaryImageId: null,
    featured: false,
    launchMvp: false,
    hasInstagramContent: false,
    eraLabel: null,
    birthDateRaw: null,
    birthYear: null,
    birthYearEnd: null,
    birthMonth: null,
    birthDay: null,
    birthDatePrecision: null,
    samadhiDateRaw: null,
    samadhiYear: null,
    samadhiYearEnd: null,
    samadhiMonth: null,
    samadhiDay: null,
    samadhiDatePrecision: null,
    dateNotes: null,
    seoTitle: null,
    seoDescription: null,
    status: "draft",
    teamVisibility: "private",
    publicationStatus: "unpublished",
    workflowStatus: "needs_review",
    publishedAt: null,
    reviewedAt: null,
    ...overrides
  };
}

test("merge conflicts recommend the populated record when the other value is blank", () => {
  const left = record("left");
  const right = record("right", { shortDescription: "Reviewed description" });
  const conflicts = getSaintMergeConflicts(left, right).get("identity") ?? [];
  const description = conflicts.find((conflict) => conflict.field === "shortDescription");
  assert.equal(description?.recommendedRecordId, "right");
});

test("merge field choices preserve explicit reviewer decisions", () => {
  const left = record("left", { displayName: "First", shortDescription: "First description" });
  const right = record("right", { displayName: "Second", shortDescription: "Second description" });
  const result = resolveSaintMergeFields(left, right, "left", {
    displayName: "right",
    shortDescription: "left"
  });
  assert.equal(result.displayName, "Second");
  assert.equal(result.shortDescription, "First description");
});

test("published merge results remain public and legacy-compatible", () => {
  const left = record("left");
  const right = record("right", { status: "published", publicationStatus: "published", teamVisibility: "public" });
  const result = resolveSaintMergeFields(left, right, "left", {
    publicationStatus: "right",
    status: "left",
    teamVisibility: "left"
  });
  assert.equal(result.status, "published");
  assert.equal(result.publicationStatus, "published");
  assert.equal(result.teamVisibility, "public");
});

test("merge choices reject records outside the confirmed pair", () => {
  assert.throws(
    () => resolveSaintMergeFields(record("left"), record("right"), "left", { displayName: "third" }),
    /Invalid merge choice/
  );
});
