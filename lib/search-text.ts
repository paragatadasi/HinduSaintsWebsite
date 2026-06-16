export type WeightedSearchField = {
  value?: string | null;
  weight?: number;
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
    for (const fieldForm of fieldForms) {
      for (const queryForm of uniqueQueryForms) {
        if (fieldForm === queryForm) score += 120 * weight;
        else if (fieldForm.startsWith(queryForm)) score += 80 * weight;
        else if (fieldForm.includes(queryForm)) score += 55 * weight;
      }

      const fieldTokens = getSearchTokens(fieldForm);
      for (const queryToken of queryTokens) {
        if (fieldTokens.includes(queryToken)) score += 18 * weight;
        else if (fieldTokens.some((fieldToken) => fieldToken.startsWith(queryToken))) score += 10 * weight;
        else if (fieldTokens.some((fieldToken) => fieldToken.includes(queryToken))) score += 4 * weight;
      }
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

function getSearchForms(value: string) {
  const normalized = normalizeSearchText(value);
  const withoutHonorifics = getSearchTokens(normalized)
    .filter((token) => !SEARCH_HONORIFICS.has(token))
    .join(" ");

  return [normalized, withoutHonorifics].filter(Boolean);
}

function getSearchTokens(value: string) {
  return value.split(" ").filter(Boolean);
}

function getQuerySearchForms(value: string) {
  return expandTransliterationVariants(value).flatMap((variant) => [
    ...getSearchForms(variant),
    ...getSearchTokens(variant).flatMap(expandTransliterationVariants).flatMap(getSearchForms)
  ]);
}

function expandTransliterationVariants(value: string) {
  const normalized = normalizeSearchText(value);
  const variants = new Set([normalized]);
  const substitutions: Array<[RegExp, string]> = [
    [/\bmaharishi\b/g, "maharshi"],
    [/\bmaharshi\b/g, "maharishi"],
    [/\bkrishna\b/g, "krsna"],
    [/\bkrsna\b/g, "krishna"],
    [/\bshiva\b/g, "siva"],
    [/\bsiva\b/g, "shiva"],
    [/\bchaitanya\b/g, "caitanya"],
    [/\bcaitanya\b/g, "chaitanya"],
    [/\bchandra\b/g, "candra"],
    [/\bcandra\b/g, "chandra"],
    [/\bshankar/g, "sankar"],
    [/\bsankar/g, "shankar"],
    [/\bshankara\b/g, "sankara"],
    [/\bsankara\b/g, "shankara"],
    [/\bvaishnava\b/g, "vaisnava"],
    [/\bvaisnava\b/g, "vaishnava"],
    [/\bvrindavan\b/g, "brindavan"],
    [/\bbrindavan\b/g, "vrindavan"],
    [/\bv/g, "w"],
    [/\bw/g, "v"],
    [/\bb/g, "v"],
    [/\bv/g, "b"],
    [/aa/g, "a"],
    [/ee/g, "i"],
    [/oo/g, "u"]
  ];

  for (const [pattern, replacement] of substitutions) {
    variants.add(normalized.replace(pattern, replacement));
  }

  return Array.from(variants);
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
  "paramhansa",
  "saint",
  "sant",
  "shree",
  "shri",
  "sri",
  "swami"
]);
