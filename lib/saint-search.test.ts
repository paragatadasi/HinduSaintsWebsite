import assert from "node:assert/strict";
import test from "node:test";
import corpus from "../data/search/saint-search-corpus.json";
import { rankSaintSearchResults, type SearchableSaint } from "./saint-search";

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
