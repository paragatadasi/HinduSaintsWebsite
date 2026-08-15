import assert from "node:assert/strict";
import test from "node:test";
import { filterAndRankSearchOptions } from "./search-option-ranking";

const options = [
  { label: "Brahma Kund, Vrindavan" },
  { label: "Vrindavan Road" },
  { label: "Mathura", description: "Near Vrindavan" },
  { label: "Vrindavan" },
  { label: "Keshi Ghat, Vrindavan" }
];

test("ranks an exact label before other matching labels", () => {
  assert.deepEqual(
    filterAndRankSearchOptions(options, "  VRINDAVAN ").map((option) => option.label),
    [
      "Vrindavan",
      "Vrindavan Road",
      "Brahma Kund, Vrindavan",
      "Keshi Ghat, Vrindavan",
      "Mathura"
    ]
  );
});

test("preserves the supplied order for matches with the same rank", () => {
  assert.deepEqual(
    filterAndRankSearchOptions(options, "kund").map((option) => option.label),
    ["Brahma Kund, Vrindavan"]
  );
});

test("returns the original option order when the query is blank", () => {
  assert.deepEqual(filterAndRankSearchOptions(options, "   "), options);
});
