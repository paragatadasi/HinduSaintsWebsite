import assert from "node:assert/strict";
import test from "node:test";
import { formatSaintDate, formatSaintEraLabel } from "./public-date-format";

test("formats saint year ranges with a typographic dash", () => {
  assert.equal(formatSaintDate({ raw: "1914-1915", precision: "range" }), "1914–1915");
  assert.equal(formatSaintDate({ raw: "c. 1914—1915", precision: "range" }), "c. 1914–1915");
});

test("renders an explicit unknown date while a blank date remains absent", () => {
  assert.equal(formatSaintDate({ raw: "Unknown", precision: "unknown" }), "Unknown");
  assert.equal(formatSaintDate({}), undefined);
});

test("normalizes era ranges without mojibake", () => {
  assert.equal(formatSaintEraLabel("1914-1915"), "1914–1915");
});
