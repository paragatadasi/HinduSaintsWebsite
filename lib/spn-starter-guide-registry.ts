import { createHash } from "node:crypto";
import guide from "../data/museum/spn-starter-move-guide-v2.json";
import proposal from "../data/museum/spn-starter-reviewed-proposal-v7.json";
import { MuseumMoveSessionError } from "./museum-move-session-domain";

export type GuideContext = { guideVersion: string; contentDigest: string; assignmentDigest: string };
export type RegisteredSuggestion = { id: string; kind: "family" | "city" | "row" | "alternative"; sourceIds: string[]; targetVitrine: string };
export type GuideDefinition = { context: GuideContext; suggestions: RegisteredSuggestion[] };
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(",")}}`;
  return JSON.stringify(value) ?? "null";
}
const { contentDigest: _contentDigest, ...content } = guide;
const pairs = proposal.rows.map(row => [row.sourceId, row.vitrine]).sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
if (guide.version !== "spn-starter-move-guide-handoff-2026-10-27-v2" || guide.proposalVersion !== proposal.version ||
  guide.contentDigest !== "d4dac5d28b0d947ac1d6a661830c75a839f990a0217f63ef2a497e4fe02797f0" ||
  hash(canonical(content)) !== "5ab9079cff51fff4b384dfc29e2878875eadd81edfd66d97cd12c2ed6291ca2e" ||
  hash(JSON.stringify(pairs)) !== guide.assignmentDigest || proposal.rows.length !== 1423) throw new Error("The registered starter guide or reviewed assignment digest changed.");

export const starterGuideContext: GuideContext = { guideVersion: guide.version, contentDigest: guide.contentDigest, assignmentDigest: guide.assignmentDigest };
const suggestions: RegisteredSuggestion[] = [];
const membership = new Set<string>();
for (const vitrine of guide.vitrines) for (const [kind, groups] of [["family", vitrine.families], ["city", vitrine.cityGroups]] as const) {
  for (const group of groups) {
    for (const id of group.sourceIds) {
      if (membership.has(id) || !guide.rows.some(row => row.sourceId === id && row.vitrine === vitrine.code)) throw new Error("A starter guide row is duplicated or assigned to the wrong case.");
      membership.add(id);
    }
    suggestions.push({ id: group.id, kind, sourceIds: group.sourceIds, targetVitrine: vitrine.code });
  }
}
if (membership.size !== 136 || guide.rows.length !== 136) throw new Error("The starter guide phase partition changed.");
for (const row of guide.rows) suggestions.push({ id: `row:${row.sourceId}`, kind: "row", sourceIds: [row.sourceId], targetVitrine: row.vitrine });
const cityAlternatives = guide.cityAlternatives.map(cohort => {
  const id = hash(JSON.stringify([cohort.city, cohort.currentlySuggestedVitrine, [...cohort.sourceIds].sort()])).slice(0, 20);
  const suggestionIdsByTarget = Object.fromEntries(guide.vitrines.map(vitrine => [vitrine.code, `alternative:${vitrine.code}:${id}`]));
  for (const [targetVitrine, suggestionId] of Object.entries(suggestionIdsByTarget)) suggestions.push({ id: suggestionId, kind: "alternative", sourceIds: cohort.sourceIds, targetVitrine });
  return { ...cohort, id: `city-cohort:${id}`, suggestionIdsByTarget };
});
if (new Set(suggestions.map(row => row.id)).size !== suggestions.length) throw new Error("Duplicate registered suggestion identifiers.");
export const registeredStarterGuide = { ...guide, cityAlternatives, guideContext: starterGuideContext };
export function readStarterGuideDefinition(version: string): GuideDefinition {
  if (version !== starterGuideContext.guideVersion) throw new MuseumMoveSessionError(409, "This guide version is not registered. Reload the guide before changing a suggestion.");
  return { context: starterGuideContext, suggestions };
}
