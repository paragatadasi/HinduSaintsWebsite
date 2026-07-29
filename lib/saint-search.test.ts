import assert from "node:assert/strict";
import test from "node:test";
import corpus from "../data/search/saint-search-corpus.json";
import { rankSaintSearchResults, type SearchableSaint } from "./saint-search";
import { getSearchQueryTerms } from "./search-text";

type CorpusSaint = SearchableSaint & { id: string };

const saints = corpus.saints as CorpusSaint[];

for (const searchCase of corpus.cases) {
  test(`${searchCase.category}: ${searchCase.query}`, () => {
    const results = rankSaintSearchResults(saints, searchCase.query);

    assert.equal(
      results[0]?.item.id,
      searchCase.expectedFirstId,
      searchCase.reason
    );
  });
}

test("does not return an unrelated name", () => {
  assert.deepEqual(rankSaintSearchResults(saints, "Zoroaster"), []);
});

test("builds normalized PostgreSQL candidate terms from one shared query model", () => {
  const terms = getSearchQueryTerms("Śrī Caitanya Mahāprabhu");

  assert.ok(terms.includes("caitanya mahaprabhu"));
  assert.ok(terms.includes("caitanya"));
  assert.ok(terms.includes("mahaprabhu"));
});

test("includes honorific-free and folded spellings in PostgreSQL candidate terms", () => {
  const terms = getSearchQueryTerms("Sree Ramana Maharishi");

  assert.ok(terms.includes("ramana maharshi"));
  assert.ok(terms.includes("ramana"));
  assert.ok(terms.includes("maharshi"));
});
