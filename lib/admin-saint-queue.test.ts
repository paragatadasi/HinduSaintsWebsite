import assert from "node:assert/strict";
import test from "node:test";
import { getAdminSaintCatalogScope } from "./admin-saint-access";
import { getAdminSaintsQueueUrl } from "./admin-saint-queue";

const defaultFilters = {
  publication: "all",
  workflow: "all",
  match: "all",
  description: "all",
  photo: "all",
  visibility: "all"
};

test("Public queue links keep full-catalog roles in the Public scope", () => {
  const url = new URL(getAdminSaintsQueueUrl("public", defaultFilters, ""), "https://example.test");

  assert.equal(url.searchParams.get("scope"), "public");
  assert.equal(getAdminSaintCatalogScope(["site_admin"], url.searchParams.get("scope")), "public");
});

test("Full Catalog links keep visibility but discard Public-only workflow filters", () => {
  const url = new URL(getAdminSaintsQueueUrl("full", {
    ...defaultFilters,
    workflow: "needs_review",
    photo: "missing_photo",
    visibility: "private"
  }, "Kabir"), "https://example.test");

  assert.equal(url.searchParams.get("scope"), "full");
  assert.equal(url.searchParams.get("workflow"), null);
  assert.equal(url.searchParams.get("photo"), "missing_photo");
  assert.equal(url.searchParams.get("visibility"), "private");
  assert.equal(url.searchParams.get("publication"), null);
  assert.equal(url.searchParams.get("q"), "Kabir");
});

test("Public links keep workflow but discard Full Catalog visibility filters", () => {
  const url = new URL(getAdminSaintsQueueUrl("public", {
    ...defaultFilters,
    visibility: "private",
    workflow: "polished"
  }, ""), "https://example.test");

  assert.equal(url.searchParams.get("scope"), "public");
  assert.equal(url.searchParams.get("visibility"), null);
  assert.equal(url.searchParams.get("workflow"), "polished");
});
