import { rankWeightedTextSearch, type WeightedSearchField } from "@/lib/search-text";

export type SearchableSaint = {
  displayName: string;
  canonicalName: string;
  status?: string;
  eraLabel?: string | null;
  birthDateRaw?: string | null;
  samadhiDateRaw?: string | null;
  shortDescription?: string | null;
  biographySummary?: string | null;
  aliases?: Array<{ alias: string }>;
  places?: Array<{
    place: {
      name: string;
      alternateNames?: string[];
      region?: string | null;
      country?: string | null;
    };
  }>;
  traditions?: Array<{
    tradition: {
      name: string;
      alternateNames?: string[];
    };
  }>;
};

export function buildSaintSearchFields(saint: SearchableSaint, options: { includeAdminFields?: boolean } = {}) {
  const fields: WeightedSearchField[] = [
    { value: saint.displayName, weight: 6 },
    { value: saint.canonicalName, weight: 5 },
    ...(saint.aliases ?? []).map((alias) => ({ value: alias.alias, weight: 5 })),
    ...(saint.places ?? []).flatMap(({ place }) => [
      { value: place.name, weight: 3 },
      ...(place.alternateNames ?? []).map((name) => ({ value: name, weight: 3 })),
      { value: place.region, weight: 2 },
      { value: place.country, weight: 2 }
    ]),
    ...(saint.traditions ?? []).flatMap(({ tradition }) => [
      { value: tradition.name, weight: 2 },
      ...(tradition.alternateNames ?? []).map((name) => ({ value: name, weight: 2 }))
    ]),
    { value: saint.eraLabel, weight: 1.5 },
    { value: saint.birthDateRaw, weight: 1 },
    { value: saint.samadhiDateRaw, weight: 1 },
    { value: saint.shortDescription, weight: 0.8 }
  ];

  if (options.includeAdminFields) {
    fields.push({ value: saint.status, weight: 0.8 });
    fields.push({ value: saint.biographySummary, weight: 0.6 });
  }

  return fields;
}

export function rankSaintSearchResults<T extends SearchableSaint>(
  saints: T[],
  query: string,
  options: { includeAdminFields?: boolean; limit?: number; minimumScore?: number } = {}
) {
  return rankWeightedTextSearch(
    saints,
    query,
    (saint) => buildSaintSearchFields(saint, options),
    {
      limit: options.limit,
      minimumScore: options.minimumScore,
      tieBreaker: (left, right) => left.displayName.localeCompare(right.displayName)
    }
  );
}
