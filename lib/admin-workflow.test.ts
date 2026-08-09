import assert from "node:assert/strict";
import test from "node:test";
import { publicationCompatibilityData } from "./admin-workflow";

test("publishing also makes content visible to the wider team", () => {
  assert.deepEqual(publicationCompatibilityData("published"), {
    status: "published",
    publicationStatus: "published",
    teamVisibility: "public"
  });
});

test("unpublishing and archiving preserve independently managed team visibility", () => {
  assert.deepEqual(publicationCompatibilityData("draft"), {
    status: "draft",
    publicationStatus: "unpublished"
  });
  assert.deepEqual(publicationCompatibilityData("needs_review"), {
    status: "needs_review",
    publicationStatus: "unpublished"
  });
  assert.deepEqual(publicationCompatibilityData("archived"), {
    status: "archived",
    publicationStatus: "archived"
  });
});
