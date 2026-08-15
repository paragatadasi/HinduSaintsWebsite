export type SearchOption = {
  label: string;
  description?: string;
  keywords?: string[];
};

export function filterAndRankSearchOptions<T extends SearchOption>(options: T[], query: string) {
  const term = normalizeSearchValue(query);
  if (!term) return options;

  return options
    .map((option, index) => ({ option, index, rank: getMatchRank(option, term) }))
    .filter((match) => match.rank !== null)
    .sort((left, right) => (left.rank ?? 0) - (right.rank ?? 0) || left.index - right.index)
    .map((match) => match.option);
}

export function normalizeSearchValue(value: string) {
  return value.trim().toLocaleLowerCase();
}

function getMatchRank(option: SearchOption, term: string) {
  const label = normalizeSearchValue(option.label);

  if (label === term) return 0;
  if (label.startsWith(term)) return 1;
  if (label.includes(term)) return 2;

  const metadata = [option.description, ...(option.keywords ?? [])]
    .filter(Boolean)
    .join(" ");

  return normalizeSearchValue(metadata).includes(term) ? 3 : null;
}
