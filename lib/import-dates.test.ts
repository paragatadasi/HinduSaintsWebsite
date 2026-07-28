import assert from "node:assert/strict";
import test from "node:test";
import { buildEraLabel, parseImportedDate } from "./import-dates";

test("parses an ambiguous year range without discarding either endpoint", () => {
  assert.deepEqual(parseImportedDate("1914-1915"), {
    raw: "1914-1915",
    year: 1914,
    endYear: 1915,
    precision: "range"
  });
});

test("accepts typographic dashes in year ranges", () => {
  assert.deepEqual(parseImportedDate("1914–1915"), {
    raw: "1914–1915",
    year: 1914,
    endYear: 1915,
    precision: "range"
  });
});

test("keeps explicit unknown distinct from an empty date", () => {
  assert.deepEqual(parseImportedDate("unknown"), {
    raw: "Unknown",
    precision: "unknown"
  });
  assert.deepEqual(parseImportedDate(""), {
    precision: "empty"
  });
});

test("builds an unambiguous era label when one endpoint is a range", () => {
  assert.equal(
    buildEraLabel(parseImportedDate("1914-1915"), parseImportedDate("1980")),
    "b. 1914–1915; samadhi 1980"
  );
});
