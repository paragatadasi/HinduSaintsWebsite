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

test("parses BC and BCE years as sortable negative values", () => {
  assert.equal(parseImportedDate("563 BCE").year, -563);
  assert.equal(parseImportedDate("483 B.C.").year, -483);
});

test("parses early AD and CE years", () => {
  assert.equal(parseImportedDate("33 AD").year, 33);
  assert.equal(parseImportedDate("70 C.E.").year, 70);
});

test("parses same-era and cross-era historical ranges", () => {
  assert.deepEqual(parseImportedDate("563–483 BCE"), {
    raw: "563–483 BCE",
    year: -563,
    endYear: -483,
    precision: "range"
  });
  assert.equal(parseImportedDate("10 BCE–20 CE").year, -10);
  assert.equal(parseImportedDate("10 BCE–20 CE").endYear, 20);
});
