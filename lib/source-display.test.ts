import assert from "node:assert/strict";
import test from "node:test";
import {
  createImportedSourceTitle,
  getSourceDisplayTitle,
  getSourceMatchKind,
  normalizeSourceUrl
} from "./source-display";

test("keeps an editorial source title", () => {
  assert.equal(getSourceDisplayTitle({ title: "The Five Perfect Masters" }), "The Five Perfect Masters");
});

test("turns legacy URL titles into readable labels", () => {
  assert.equal(
    createImportedSourceTitle("https://en.wikipedia.org/wiki/Hazrat_Babajan"),
    "Hazrat Babajan — Wikipedia"
  );
});

test("uses the site name when a URL has no page slug", () => {
  assert.equal(createImportedSourceTitle("https://vedanta.org/"), "Vedanta");
});

test("normalizes source URLs without tracking noise", () => {
  assert.equal(
    normalizeSourceUrl("https://Example.com/path/?utm_source=feed&b=2&a=1#section"),
    "https://example.com/path?a=1&b=2"
  );
});

test("treats normalized URLs as the same source", () => {
  assert.equal(getSourceMatchKind(
    { title: "Existing title", url: "https://example.com/article?utm_source=feed" },
    { title: "A revised title", url: "https://example.com/article/" }
  ), "exact_url");
});

test("suggests matching bibliographic details without claiming an exact URL match", () => {
  assert.equal(getSourceMatchKind(
    { author: "A. Teacher", publicationYear: 1980, title: "Collected Talks" },
    { author: "a. teacher", publicationYear: 1980, title: "  Collected talks " }
  ), "matching_details");
});
