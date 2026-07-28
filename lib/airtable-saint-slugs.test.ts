import assert from "node:assert/strict";
import test from "node:test";
import { buildAirtableSaintSlugCandidates } from "./airtable-saint-slugs";

test("retains Airtable detail as a fallback slug candidate", () => {
  assert.deepEqual(
    buildAirtableSaintSlugCandidates({
      displayName: "Sri Narayan Maharaj",
      originalName: "Sri Narayan Maharaj of Khedgoan Bed"
    }),
    {
      baseSlug: "sri-narayan-maharaj",
      detailedSlug: "sri-narayan-maharaj-of-khedgoan-bed"
    }
  );
});

test("does not invent a fallback when the detailed name normalizes to the base slug", () => {
  assert.deepEqual(
    buildAirtableSaintSlugCandidates({
      displayName: "Sri Narayan Maharaj",
      originalName: "  Sri Narayan Maharaj  "
    }),
    {
      baseSlug: "sri-narayan-maharaj"
    }
  );
});

test("normalizes punctuation consistently in detailed fallback slugs", () => {
  assert.deepEqual(
    buildAirtableSaintSlugCandidates({
      displayName: "Sri Tai Maharaj",
      originalName: "Sri Tai Maharaj (Ban Math) of Undirkhed, Maharashtra"
    }),
    {
      baseSlug: "sri-tai-maharaj",
      detailedSlug: "sri-tai-maharaj-ban-math-of-undirkhed-maharashtra"
    }
  );
});
