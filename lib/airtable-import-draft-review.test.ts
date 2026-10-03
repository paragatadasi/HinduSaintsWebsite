import assert from "node:assert/strict";
import test from "node:test";
import { airtableImportedDraftRecordWhere, getAirtableDraftReviewEvidence, importedDraftSaintId } from "./airtable-import-draft-review";

const job = { id: "job-one", createdAt: new Date("2026-10-03T08:00:00Z"),
  startedAt: new Date("2026-10-03T08:01:00Z"), completedAt: new Date("2026-10-03T08:10:00Z"), rawSummary: {} };

test("new jobs filter by explicit job attribution rather than a shared time window", () => {
  const where = airtableImportedDraftRecordWhere({ ...job, rawSummary: { draftTrackingVersion: 1 } });
  assert.deepEqual(where.AND, [airtableImportedDraftRecordWhere(),
    { rawPayloadJson: { path: ["importJobId"], equals: job.id } }]);
});

test("legacy jobs retain bounded timestamp candidate filtering", () => {
  assert.deepEqual(airtableImportedDraftRecordWhere(job).AND, [airtableImportedDraftRecordWhere(),
    { importedAt: { gte: job.startedAt, lte: job.completedAt } }]);
});

test("legacy repair evidence keeps recorded slugs and ignores malformed entries", () => {
  assert.deepEqual(getAirtableDraftReviewEvidence({ slugRepairs: [null, {},
    { resolvedSlug: 42 }, { resolvedSlug: "saint-detailed-name" }] }),
  { tracked: false, repairSlugs: ["saint-detailed-name"] });
  assert.deepEqual(getAirtableDraftReviewEvidence(null), { tracked: false, repairSlugs: [] });
});

test("merging an imported draft never presents the retained saint as a new creation", () => {
  assert.equal(importedDraftSaintId({ entityId: "retained", rawPayloadJson: { createdSaintId: "original-draft" } }), "original-draft");
  assert.equal(importedDraftSaintId({ entityId: "legacy", rawPayloadJson: {} }), "legacy");
});
