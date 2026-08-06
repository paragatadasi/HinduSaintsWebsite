import assert from "node:assert/strict";
import test from "node:test";
import { compareSaintDisplayNames, getSaintAlphabetizationKey } from "./saint-name-sort";

test("omits repeated leading honorifics", () => {
  assert.equal(getSaintAlphabetizationKey("Sri Sri Hanuman Das Babaji"), "Hanuman Das Babaji");
  assert.equal(getSaintAlphabetizationKey("Paramahansa Sri Swami Nigamananda"), "Nigamananda");
});

test("omits a leading parenthetical alias after an honorific", () => {
  assert.equal(
    getSaintAlphabetizationKey("Sri (Ishwar) Tota Puri Baba"),
    "Tota Puri Baba"
  );
});

test("ignores punctuation without joining adjacent words", () => {
  assert.equal(
    getSaintAlphabetizationKey("A. C. Bhaktivedanta Swami Prabhupada"),
    "A C Bhaktivedanta Swami Prabhupada"
  );
  assert.equal(getSaintAlphabetizationKey("Anne-Marie D'Souza"), "Anne Marie D Souza");
  assert.equal(getSaintAlphabetizationKey("(Abhedananda)"), "Abhedananda");
  assert.equal(getSaintAlphabetizationKey("Sri—Anandamayi Ma"), "Anandamayi Ma");
});

test("does not give parenthetical punctuation precedence over following words", () => {
  const names = [
    "Sri Radha Raman (deity in Vrindavan)",
    "Sri Radha Raman Charan Das of Bengal"
  ];

  assert.deepEqual(names.sort(compareSaintDisplayNames), [
    "Sri Radha Raman Charan Das of Bengal",
    "Sri Radha Raman (deity in Vrindavan)"
  ]);
});

test("keeps titles that are part of the rest of the name", () => {
  assert.equal(
    getSaintAlphabetizationKey("A. C. Bhaktivedanta Swami Prabhupada"),
    "A C Bhaktivedanta Swami Prabhupada"
  );
});

test("sorts by the name following the honorific", () => {
  const names = [
    "Sri (Ishwar) Tota Puri Baba",
    "Sant Tukaram",
    "Basavanna",
    "Sri Anandamayi Ma",
    "A. C. Bhaktivedanta Swami Prabhupada"
  ];

  assert.deepEqual(names.sort(compareSaintDisplayNames), [
    "A. C. Bhaktivedanta Swami Prabhupada",
    "Sri Anandamayi Ma",
    "Basavanna",
    "Sri (Ishwar) Tota Puri Baba",
    "Sant Tukaram"
  ]);
});
