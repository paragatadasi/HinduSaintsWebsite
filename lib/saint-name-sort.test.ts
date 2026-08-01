import assert from "node:assert/strict";
import test from "node:test";
import { compareSaintDisplayNames, getSaintAlphabetizationKey } from "./saint-name-sort";

test("omits repeated leading honorifics", () => {
  assert.equal(getSaintAlphabetizationKey("Sri Sri Hanuman Das Babaji"), "Hanuman Das Babaji");
  assert.equal(getSaintAlphabetizationKey("Paramahansa Sri Swami Nigamananda"), "Nigamananda");
});

test("keeps titles that are part of the rest of the name", () => {
  assert.equal(
    getSaintAlphabetizationKey("A. C. Bhaktivedanta Swami Prabhupada"),
    "A. C. Bhaktivedanta Swami Prabhupada"
  );
});

test("sorts by the name following the honorific", () => {
  const names = ["Sant Tukaram", "Basavanna", "Sri Anandamayi Ma"];

  assert.deepEqual(names.sort(compareSaintDisplayNames), [
    "Sri Anandamayi Ma",
    "Basavanna",
    "Sant Tukaram"
  ]);
});
