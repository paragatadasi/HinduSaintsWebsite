import assert from "node:assert/strict";
import test from "node:test";
import { createImportedSourceTitle, getSourceDisplayTitle } from "./source-display";

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
