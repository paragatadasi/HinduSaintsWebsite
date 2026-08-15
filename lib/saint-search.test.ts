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

test("does not rank unrelated honorific-sharing names above a substantive name match", () => {
  const candidates: CorpusSaint[] = [
    {
      id: "rajyalakshmi",
      displayName: "Sadguru Sri Rajyalakshmi Devi",
      canonicalName: "Sadguru Sri Rajyalakshmi Devi"
    },
    {
      id: "unrelated-sri",
      displayName: "Sri Srimad Swami Lakshman Ramanuj",
      canonicalName: "Sri Srimad Swami Lakshman Ramanuj"
    }
  ];

  for (const query of ["Sri Rajyalakshmi Devi", "Rajyalakshmi Devi"]) {
    assert.equal(rankSaintSearchResults(candidates, query)[0]?.item.id, "rajyalakshmi");
  }
});

test("ranks spaced initials as a phrase instead of matching each letter everywhere", () => {
  const candidates: CorpusSaint[] = [
    {
      id: "sombari-baba",
      displayName: "Sri Sombari Baba",
      canonicalName: "Sri Sombari Baba"
    },
    {
      id: "ramakrishnananda",
      displayName: "Sri Sri Sri Avatar Digambar Bhagavan Ramakrishnananda",
      canonicalName: "Sri Sri Sri Avatar Digambar Bhagavan Ramakrishnananda"
    },
    {
      id: "narasimha-saraswati",
      displayName: "Sri Narasimha Saraswati",
      canonicalName: "Sri Narasimha Saraswati"
    },
    {
      id: "ramani-mohan-chakrabarti",
      displayName: "Sri Ramani Mohan Chakrabarti (Bholanath)",
      canonicalName: "Sri Ramani Mohan Chakrabarti (Bholanath)"
    },
    {
      id: "prabhupada",
      displayName: "A. C. Bhaktivedanta Swami Prabhupada",
      canonicalName: "Abhay Charanaravinda Bhaktivedanta Swami Prabhupada"
    }
  ];

  assert.equal(rankSaintSearchResults(candidates, "a c")[0]?.item.id, "prabhupada");
});

test("alphabetizes equally relevant results without leading honorifics", () => {
  const candidates: CorpusSaint[] = [
    {
      id: "tukaram",
      displayName: "Sant Tukaram",
      canonicalName: "Sant Tukaram",
      shortDescription: "Bhakti poet"
    },
    {
      id: "anandamayi",
      displayName: "Sri Anandamayi Ma",
      canonicalName: "Sri Anandamayi Ma",
      shortDescription: "Bhakti poet"
    }
  ];

  assert.deepEqual(
    rankSaintSearchResults(candidates, "bhakti poet").map(({ item }) => item.id),
    ["anandamayi", "tukaram"]
  );
});

test("allows an honorific-only admin search", () => {
  const results = rankSaintSearchResults(saints, "sri", { includeAdminFields: true });

  assert.ok(results.length > 0);
  assert.ok(results.every(({ item }) => item.displayName.toLowerCase().includes("sri")));
});

test("keeps an honorific-only PostgreSQL candidate term", () => {
  assert.deepEqual(getSearchQueryTerms("sri"), ["sri"]);
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
