export type WeightedSearchField = {
  value?: string | null;
  weight?: number;
  fuzzy?: boolean;
};

export type WeightedSearchResult<T> = {
  item: T;
  score: number;
};

export function rankWeightedTextSearch<T>(
  items: T[],
  query: string,
  getFields: (item: T) => WeightedSearchField[],
  options: { limit?: number; minimumScore?: number; tieBreaker?: (left: T, right: T) => number } = {}
): WeightedSearchResult<T>[] {
  const term = query.trim();
  if (!term) return items.slice(0, options.limit).map((item) => ({ item, score: 0 }));

  const minimumScore = options.minimumScore ?? 1;
  const ranked = items
    .map((item) => ({ item, score: scoreWeightedTextSearch(term, getFields(item)) }))
    .filter(({ score }) => score >= minimumScore)
    .sort((left, right) => (
      right.score - left.score || (options.tieBreaker ? options.tieBreaker(left.item, right.item) : 0)
    ));

  return ranked.slice(0, options.limit);
}

export function scoreWeightedTextSearch(query: string, fields: WeightedSearchField[]) {
  const queryForms = getQuerySearchForms(query);
  const uniqueQueryForms = Array.from(new Set(queryForms)).filter(Boolean);
  const queryTokens = Array.from(new Set(uniqueQueryForms.flatMap(getSearchTokens)))
    .filter((token) => token.length >= 2 && !SEARCH_HONORIFICS.has(token));

  let score = 0;

  for (const field of fields) {
    if (!field.value) continue;

    const weight = field.weight ?? 1;
    const fieldForms = getSearchForms(field.value);
    let bestPhraseScore = 0;
    for (const fieldForm of fieldForms) {
      for (const queryForm of uniqueQueryForms) {
        if (fieldForm === queryForm) bestPhraseScore = Math.max(bestPhraseScore, 120);
        else if (fieldForm.startsWith(queryForm)) bestPhraseScore = Math.max(bestPhraseScore, 80);
        else if (fieldForm.includes(queryForm)) bestPhraseScore = Math.max(bestPhraseScore, 55);
      }
    }

    const fieldTokens = Array.from(new Set(fieldForms.flatMap(getSearchTokens)));
    let tokenScore = 0;
    for (const queryToken of queryTokens) {
      if (fieldTokens.includes(queryToken)) tokenScore += 18;
      else if (fieldTokens.some((fieldToken) => fieldToken.startsWith(queryToken))) tokenScore += 10;
      else if (fieldTokens.some((fieldToken) => fieldToken.includes(queryToken))) tokenScore += 4;
    }

    score += (bestPhraseScore + tokenScore) * weight;

    if (field.fuzzy) {
      score += scoreFuzzyTokenMatches(uniqueQueryForms, fieldForms) * weight;
    }
  }

  return score;
}

export function searchScoreToConfidence(score: number): "high" | "medium" | "low" {
  if (score >= 600) return "high";
  if (score >= 180) return "medium";
  return "low";
}

export function normalizeSearchText(value: string) {
  return value
    .replace(/[\u015b\u1e63]/gi, "sh")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function getSearchQueryTerms(value: string) {
  return Array.from(new Set(getQuerySearchForms(value)))
    .filter((term) => (
      term.length >= 2
      && getSearchTokens(term).some((token) => !SEARCH_HONORIFICS.has(token))
    ));
}

function getSearchForms(value: string) {
  const normalized = normalizeSearchText(value);
  const transliterationFolded = foldTransliterationVariants(normalized);

  return Array.from(new Set([
    normalized,
    removeSearchHonorifics(normalized),
    transliterationFolded,
    removeSearchHonorifics(transliterationFolded)
  ].filter(Boolean)));
}

function getSearchTokens(value: string) {
  return value.split(" ").filter(Boolean);
}

function getQuerySearchForms(value: string) {
  const forms = getSearchForms(value);
  return forms.flatMap((form) => [
    ...getSearchForms(form),
    ...getSearchTokens(form).flatMap(getSearchForms)
  ]);
}

function removeSearchHonorifics(value: string) {
  return getSearchTokens(value)
    .filter((token) => !SEARCH_HONORIFICS.has(token))
    .join(" ");
}

function foldTransliterationVariants(value: string) {
  return value
    .replace(/\bmaharishi\b/g, "maharshi")
    .replace(/\bparamahamsa\b|\bparamhansa\b/g, "paramahansa")
    .replace(/\bkrshna\b|\bkrsna\b/g, "krishna")
    .replace(/\bchaitanya\b/g, "caitanya")
    .replace(/\bchandra\b/g, "candra")
    .replace(/\bshiva\b/g, "siva")
    .replace(/\bshankar/g, "sankar")
    .replace(/\bvaish/g, "vais")
    .replace(/\bbrindavan\b/g, "vrindavan")
    .replace(/\b[wb]/g, "v")
    .replace(/aa/g, "a")
    .replace(/ee/g, "i")
    .replace(/oo/g, "u");
}

function scoreFuzzyTokenMatches(queryForms: string[], fieldForms: string[]) {
  const queryTokens = Array.from(new Set(queryForms.flatMap(getSearchTokens)))
    .filter((token) => token.length >= 4 && !SEARCH_HONORIFICS.has(token));
  const fieldTokens = Array.from(new Set(fieldForms.flatMap(getSearchTokens)));
  let score = 0;

  for (const queryToken of queryTokens) {
    if (fieldTokens.some((fieldToken) => (
      fieldToken === queryToken
      || fieldToken.startsWith(queryToken)
      || fieldToken.includes(queryToken)
    ))) {
      continue;
    }

    const maximumDistance = queryToken.length >= 7 ? 2 : 1;
    let bestDistance = maximumDistance + 1;

    for (const fieldToken of fieldTokens) {
      if (Math.abs(fieldToken.length - queryToken.length) > maximumDistance) continue;

      bestDistance = Math.min(
        bestDistance,
        levenshteinDistanceWithin(queryToken, fieldToken, maximumDistance)
      );
    }

    if (bestDistance === 1) score += 14;
    else if (bestDistance === 2) score += 8;
  }

  return score;
}

function levenshteinDistanceWithin(left: string, right: string, maximumDistance: number) {
  if (left === right) return 0;
  if (Math.abs(left.length - right.length) > maximumDistance) return maximumDistance + 1;

  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    let rowMinimum = current[0];

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      const distance = Math.min(
        previous[rightIndex] + 1,
        current[rightIndex - 1] + 1,
        previous[rightIndex - 1] + substitutionCost
      );
      current.push(distance);
      rowMinimum = Math.min(rowMinimum, distance);
    }

    if (rowMinimum > maximumDistance) return maximumDistance + 1;
    previous = current;
  }

  return previous[right.length];
}

const SEARCH_HONORIFICS = new Set([
  "acharya",
  "amma",
  "baba",
  "babaji",
  "bhagavan",
  "deva",
  "devi",
  "ji",
  "ma",
  "maharaj",
  "maharaja",
  "mata",
  "paramahamsa",
  "paramahansa",
  "paramhansa",
  "saint",
  "sant",
  "shree",
  "shri",
  "sree",
  "sri",
  "swami"
]);
