import packet from "../data/museum/spn-curated-headlines-v2.json";

type HeadlineRule = {
  headline: string;
  fallback: string;
  anchorClauses: {text: string; sourceIds: string[]; match: string}[];
};
const rules: Record<string, HeadlineRule> = packet.rules;

export function curatedVitrineHeadline(
  vitrine: string,
  entries: readonly {sourceId: string; destination: string}[],
  original: string,
): string {
  const rule = rules[vitrine];
  if (!rule) return original;
  const active = new Set(entries.filter(entry => entry.destination === vitrine).map(entry => entry.sourceId));
  const present = rule.anchorClauses.filter(clause => clause.match === "any"
    ? clause.sourceIds.some(id => active.has(id))
    : clause.sourceIds.every(id => active.has(id)));
  if (present.length === rule.anchorClauses.length) return rule.headline;
  return [...present.map(clause => clause.text), rule.fallback].join(" · ");
}
