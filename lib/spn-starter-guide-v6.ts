import {createHash} from "node:crypto";
import guide from "../data/museum/spn-starter-move-guide-v6.json";
import previous from "../data/museum/spn-starter-move-guide-v5.json";
import scope from "../data/museum/spn-starter-reviewed-scope-v6.json";
import {starterAmendedProposal} from "./spn-starter-amended-proposal";
import {starterGuideContext as v5Context} from "./spn-starter-guide-v5";
import {starterGuideContext as v4Context} from "./spn-starter-guide-v4";
import {starterGuideContext as v3Context} from "./spn-starter-guide-v3";
import {starterGuideContext as v2Context} from "./spn-starter-guide-v2";
import type {GuideContext,GuideDefinition,RegisteredSuggestion} from "./spn-starter-guide-registry";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(",")}}`;
  return JSON.stringify(value) ?? "null";
}
if(hash(canonical(scope))!=="459954d08f8425bbf740800aa0846599234b3d72cd83b63337a13aabdcd29260")throw new Error("Review the changed starter decision packet before activation.");
const changes=new Map([...scope.cohortTo27.map(row=>({...row,destination:row.to})),...scope.colocatedTo78,...scope.retiredFromStarter].map(row=>[row.sourceId,row]));
if(scope.cohortTo27.length!==20||scope.colocatedTo78.length!==2||scope.retiredFromStarter.length!==13||changes.size!==35||[...changes.values()].some(change=>!previous.rows.some(row=>row.sourceId===change.sourceId&&row.saintId===change.saintId)))throw new Error("The reviewed starter source scope needs reconciliation.");
export const starterV6Proposal={...starterAmendedProposal,rows:starterAmendedProposal.rows.map(row=>({...row,...(changes.has(row.sourceId)?{vitrine:changes.get(row.sourceId)!.destination}:{})}))};
const proposal=starterV6Proposal;
const { contentDigest: _contentDigest, ...content } = guide;
const pairs = proposal.rows.map(row => [row.sourceId, row.vitrine]).sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
if (guide.version !== "spn-starter-move-guide-2026-11-01-v6" || guide.proposalVersion !== proposal.version ||
  guide.contentDigest !== "3a6a9d334f49fb4c0fa06ad1e76095dfe416797709aae52636acc1bf6aa3ba72" ||
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
if (membership.size !== 123 || guide.rows.length !== 123) throw new Error("The starter guide phase partition changed.");
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
export const starterGuideDefinition:GuideDefinition={context:starterGuideContext,suggestions,previousVersions:[v5Context.guideVersion,v4Context.guideVersion,v3Context.guideVersion,v2Context.guideVersion]};
