import { ramBhaktiGuideContext, ramBhaktiGuideDefinition } from "./spn-ram-bhakti-guide";
import { dattaGuideContext, dattaGuideDefinition } from "./spn-datta-guide";
import { createHash } from "node:crypto";
import guide from "../data/museum/spn-starter-move-guide-v4.json";
import { starterAmendedProposal as proposal } from "./spn-starter-amended-proposal";
import { readStarterGuideDefinition as readV3, starterGuideContext as v3Context } from "./spn-starter-guide-v3";
import { readStarterGuideDefinition as readV2, starterGuideContext as v2Context } from "./spn-starter-guide-v2";
import { MuseumMoveSessionError } from "./museum-move-session-domain";

export type GuideContext = { guideVersion: string; contentDigest: string; assignmentDigest: string };
export type RegisteredSuggestion = { id: string; kind: "family" | "city" | "row" | "alternative"; sourceIds: string[]; targetVitrine: string };
export type GuideDefinition = { context: GuideContext; suggestions: RegisteredSuggestion[]; previousVersions?: string[]; readOnly?: boolean; physicalScope?: { allowClear: boolean; destinations: Record<string, string> } };
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(",")}}`;
  return JSON.stringify(value) ?? "null";
}
const { contentDigest: _contentDigest, ...content } = guide;
const pairs = proposal.rows.map(row => [row.sourceId, row.vitrine]).sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
if (guide.version !== "spn-starter-move-guide-handoff-2026-10-28-v4" || guide.proposalVersion !== proposal.version ||
  guide.contentDigest !== "258cade3d901c90fbd02fb9f736b1094aa6ce7c07d68cc46acb68c8699653459" ||
  hash(canonical(content)) !== guide.contentDigest ||
  hash(JSON.stringify(pairs)) !== guide.assignmentDigest || proposal.rows.length !== 1423 || new Set(pairs.map(row => row[0])).size !== 1423) throw new Error("The registered starter guide or reviewed assignment digest changed.");

export const starterGuideContext: GuideContext = { guideVersion: guide.version, contentDigest: guide.contentDigest, assignmentDigest: guide.assignmentDigest };
const suggestions: RegisteredSuggestion[] = [];
const membership = new Set<string>();
for (const vitrine of guide.vitrines) for (const [kind, groups] of [["family", vitrine.families], ["city", vitrine.cityGroups]] as const) {
  for (const group of groups) {
    for (const id of group.sourceIds) {
      if (membership.has(id) || !guide.rows.some(row => row.sourceId === id && row.vitrine === vitrine.code) || !proposal.rows.some(row => row.sourceId === id && row.vitrine === vitrine.code)) throw new Error("A starter guide row is duplicated or assigned to the wrong case.");
      membership.add(id);
    }
    suggestions.push({ id: group.id, kind, sourceIds: group.sourceIds, targetVitrine: vitrine.code });
  }
}
if (membership.size !== 136 || guide.rows.length !== 136) throw new Error("The starter guide phase partition changed.");
for (const row of guide.rows) suggestions.push({ id: `row:${row.sourceId}`, kind: "row", sourceIds: [row.sourceId], targetVitrine: row.vitrine });
for (const transition of guide.transitionRowsOutsideStarter) {
  const row = proposal.rows.find(row => row.sourceId === transition.sourceId);
  if (!row || row.vitrine !== transition.destination.vitrine || membership.has(row.sourceId)) throw new Error("A transition is missing, duplicated or targets an incorrect case.");
  suggestions.push({ id: `row:${row.sourceId}`, kind: "row", sourceIds: [row.sourceId], targetVitrine: row.vitrine });
}
const cityAlternatives = guide.cityAlternatives.map(cohort => {
  const id = hash(JSON.stringify([cohort.city, cohort.currentlySuggestedVitrine, [...cohort.sourceIds].sort()])).slice(0, 20);
  const allowed = cohort.allowedTargetVitrines ?? [];
  if (new Set(allowed).size !== allowed.length || allowed.some(code => !guide.vitrines.some(vitrine => vitrine.code === code)) || cohort.sourceIds.some(sourceId => !proposal.rows.some(row => row.sourceId === sourceId))) throw new Error("An alternative contains an unavailable source or destination.");
  const suggestionIdsByTarget = Object.fromEntries(allowed.map(code => [code, `alternative:${code}:${id}`]));
  for (const [targetVitrine, suggestionId] of Object.entries(suggestionIdsByTarget)) suggestions.push({ id: suggestionId, kind: "alternative", sourceIds: cohort.sourceIds, targetVitrine });
  return { ...cohort, id: `city-cohort:${id}`, suggestionIdsByTarget };
});
if (new Set(suggestions.map(row => row.id)).size !== suggestions.length) throw new Error("Duplicate registered suggestion identifiers.");
export const registeredStarterGuide = { ...guide, cityAlternatives, guideContext: starterGuideContext };
export function readStarterGuideDefinition(version: string): GuideDefinition {
  if (version === ramBhaktiGuideContext.guideVersion) return ramBhaktiGuideDefinition;
  if (version === dattaGuideContext.guideVersion) return dattaGuideDefinition;
  if (version === v3Context.guideVersion) return { ...readV3(version), readOnly: true };
  if (version === v2Context.guideVersion) return { ...readV2(version), readOnly: true };
  if (version !== starterGuideContext.guideVersion) throw new MuseumMoveSessionError(409, "This guide version is not registered. Reload the guide before changing a suggestion.");
  return { context: starterGuideContext, suggestions, previousVersions: [v3Context.guideVersion, v2Context.guideVersion] };
}
