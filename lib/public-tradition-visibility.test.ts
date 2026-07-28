import assert from "node:assert/strict";
import test from "node:test";
import {
  getPublicTraditionPresentation,
  PUBLIC_TRADITION_STATUSES
} from "./public-tradition-visibility";

test("draft and review traditions use the basic public presentation", () => {
  assert.equal(getPublicTraditionPresentation("draft"), "basic");
  assert.equal(getPublicTraditionPresentation("needs_review"), "basic");
});

test("published traditions use the full public presentation", () => {
  assert.equal(getPublicTraditionPresentation("published"), "published");
});

test("archived and unknown traditions are not public", () => {
  assert.equal(getPublicTraditionPresentation("archived"), null);
  assert.equal(getPublicTraditionPresentation("unknown"), null);
  assert.deepEqual(PUBLIC_TRADITION_STATUSES, ["draft", "needs_review", "published"]);
});
