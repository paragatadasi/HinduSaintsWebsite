const LEADING_SAINT_HONORIFIC = /^(?:(?:acharya|bhagavan|guru|mahant|maharaj|paramahamsa|paramahansa|sadhu|saint|sant|sree|shree|shri|sri|srila|srimad|srimat|swami)\b|(?:108|1008)\b)[\s,.\-\u2013\u2014]*/iu;
const LEADING_PARENTHETICAL_ALIAS = /^\([^()]*\)[\s,.\-\u2013\u2014]*/u;
const PUNCTUATION = /\p{P}+/gu;
const WHITESPACE = /\s+/gu;

export function getSaintAlphabetizationKey(displayName: string) {
  let key = displayName.trim();
  let removedLeadingHonorific = false;

  while (key) {
    const withoutHonorific = key.replace(LEADING_SAINT_HONORIFIC, "").trimStart();
    if (withoutHonorific !== key) {
      key = withoutHonorific;
      removedLeadingHonorific = true;
      continue;
    }

    if (removedLeadingHonorific) {
      const withoutParentheticalAlias = key.replace(LEADING_PARENTHETICAL_ALIAS, "").trimStart();
      if (withoutParentheticalAlias !== key) {
        key = withoutParentheticalAlias;
        continue;
      }
    }

    break;
  }

  const normalizedKey = normalizePunctuation(key);
  return normalizedKey || normalizePunctuation(displayName) || displayName.trim();
}

function normalizePunctuation(value: string) {
  return value.replace(PUNCTUATION, " ").replace(WHITESPACE, " ").trim();
}

export function compareSaintDisplayNames(left: string, right: string) {
  return getSaintAlphabetizationKey(left).localeCompare(
    getSaintAlphabetizationKey(right),
    undefined,
    { sensitivity: "base" }
  ) || left.localeCompare(right, undefined, { sensitivity: "base" });
}
