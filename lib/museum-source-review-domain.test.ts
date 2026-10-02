import assert from "node:assert/strict";
import test from "node:test";
import { museumSourceDecisionSchema } from "./museum-source-review-domain";
const input = { id: "cmuqsnbl80005ecw2lliawyu1", version: "2026-10-02T10:00:00.000Z", saintId: "saint-id" };
test("confident source links allow empty or omitted notes; supplied context is trimmed", () => {
  assert.equal(museumSourceDecisionSchema.parse({ ...input, action: "link" }).note, "");
  assert.equal(museumSourceDecisionSchema.parse({ ...input, action: "link", note: "   " }).note, "");
  assert.equal(museumSourceDecisionSchema.parse({ ...input, action: "link", note: "  Confirmed by curator  " }).note, "Confirmed by curator");
});
test("deferring or reopening still requires useful context", () => {
  for (const action of ["defer", "reopen"]) {
    assert.equal(museumSourceDecisionSchema.safeParse({ ...input, action, note: "  " }).success, false);
    assert.equal(museumSourceDecisionSchema.safeParse({ ...input, action, note: "Need curator review" }).success, true);
  }
});
