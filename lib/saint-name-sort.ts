const LEADING_SAINT_HONORIFIC = /^(?:(?:acharya|bhagavan|guru|mahant|maharaj|paramahamsa|paramahansa|sadhu|saint|sant|sree|shree|shri|sri|srila|srimad|srimat|swami)\b|(?:108|1008)\b)[\s,.-]*/iu;

export function getSaintAlphabetizationKey(displayName: string) {
  let key = displayName.trim();
  let previous = "";

  while (key && key !== previous) {
    previous = key;
    key = key.replace(LEADING_SAINT_HONORIFIC, "").trimStart();
  }

  return key || displayName.trim();
}

export function compareSaintDisplayNames(left: string, right: string) {
  return getSaintAlphabetizationKey(left).localeCompare(
    getSaintAlphabetizationKey(right),
    undefined,
    { sensitivity: "base" }
  ) || left.localeCompare(right, undefined, { sensitivity: "base" });
}
