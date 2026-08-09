import assert from "node:assert/strict";
import test from "node:test";
import { getSaintMatchStatus, reviewedInstagramMatchWhere } from "./saint-match-status";

test("a reviewed link and reviewed Instagram item derive Matched", () => {
  assert.equal(getSaintMatchStatus([
    { matchStatus: "matched", instagramItem: { status: "published" } }
  ]), "matched");
});

test("suggested, ignored, and partially reviewed links remain Unmatched", () => {
  assert.equal(getSaintMatchStatus([
    { matchStatus: "suggested", instagramItem: { status: "needs_review" } },
    { matchStatus: "matched", instagramItem: { status: "ignored" } }
  ]), "unmatched");
});

test("the database filter uses the same reviewed states as the aggregate", () => {
  assert.deepEqual(reviewedInstagramMatchWhere(), {
    matchStatus: { in: ["matched", "published"] },
    instagramItem: { status: { in: ["matched", "published"] } }
  });
});
