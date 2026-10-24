import assert from "node:assert/strict";
import test from "node:test";
import { MuseumSourceReviewError, museumSourceDecisionSchema, museumSourceReviewErrorMessage } from "./museum-source-review-domain";
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
test("review failures expose recovery guidance without echoing arbitrary error text", () => {
  const held = new MuseumSourceReviewError("existing_link");
  assert.match(museumSourceReviewErrorMessage(held.code), /cannot replace/);
  assert.match(museumSourceReviewErrorMessage("stale_source"), /Check for museum updates/);
  for (const unknown of ["__proto__", "constructor", "<script>secret</script>"]) {
    assert.equal(museumSourceReviewErrorMessage(unknown), museumSourceReviewErrorMessage("review"));
    assert.ok(!museumSourceReviewErrorMessage(unknown).includes(unknown));
  }
});
