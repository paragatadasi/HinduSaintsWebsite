import assert from "node:assert/strict";
import test from "node:test";
import { normalizeAirtableSummaryDetails } from "./airtable-import-job-view";

test("normalizes detailed slug repair records for admin job history", () => {
  const summary = normalizeAirtableSummaryDetails({
    slugRepairs: [{
      recordId: "rec7rcJAHv3rsPsZN",
      airtableName: "Sri Narayan Maharaj of Khedgoan Bed",
      resolvedSlug: "sri-narayan-maharaj-of-khedgoan-bed",
      existingSaintId: "saint-mathura",
      existingSaintSlug: "sri-narayan-maharaj",
      existingSaintName: "Sri Narayan Maharaj"
    }]
  });

  assert.deepEqual(summary.slugRepairs, [{
    recordId: "rec7rcJAHv3rsPsZN",
    airtableName: "Sri Narayan Maharaj of Khedgoan Bed",
    resolvedSlug: "sri-narayan-maharaj-of-khedgoan-bed",
    existingSaintId: "saint-mathura",
    existingSaintSlug: "sri-narayan-maharaj",
    existingSaintName: "Sri Narayan Maharaj"
  }]);
});

test("keeps historical Airtable job summaries compatible", () => {
  const summary = normalizeAirtableSummaryDetails({
    collisions: [{
      recordId: "rec-old",
      reason: "slug_collision",
      message: "Slug already exists"
    }]
  });

  assert.deepEqual(summary.slugRepairs, []);
  assert.equal(summary.collisions.length, 1);
});
