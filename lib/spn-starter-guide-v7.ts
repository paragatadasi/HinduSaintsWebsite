import {createHash} from "node:crypto";
import packet from "../data/museum/spn-gaudiya-mayapur-rebalance-v3.json";
import {registeredStarterGuide as previous, starterV6Proposal, starterGuideDefinition as previousDefinition} from "./spn-starter-guide-v6";
import type {GuideContext, GuideDefinition, RegisteredSuggestion} from "./spn-starter-guide-registry";

const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const changes = new Map(packet.changes.map(row => [row.sourceId, row]));
if (changes.size !== 13 || packet.changes.some(row => row.proposed !== "28" || row.previousProposal !== "29" ||
 !previous.rows.some(old => old.sourceId === row.sourceId && old.saintId === row.saintId))) {
 throw new Error("The approved Mayapur source scope needs reconciliation.");
}
export const starterV7Proposal = {...starterV6Proposal, rows: starterV6Proposal.rows.map(row =>
 changes.has(row.sourceId) ? {...row, vitrine: "28"} : row)};
const rows = previous.rows.map(row => changes.has(row.sourceId) ? {...row, vitrine: "28", destination: {...row.destination, vitrine: "28", shelf: null}} : row);
const vitrines = previous.vitrines.map(v => {
 const trim = <T extends {id: string; sourceIds: string[]}>(g: T): T => {
  const sourceIds = g.sourceIds.filter(id => !changes.has(id));
  return sourceIds.length === g.sourceIds.length ? g : {...g, id: `v7:${g.id}`, sourceIds};
 };
 const families = v.families.map(g => trim(g)).filter(g => g.sourceIds.length).map(g => ({...g,
  edges: "edges" in g ? g.edges.filter(e => g.sourceIds.includes(e.fromSourceId) && g.sourceIds.includes(e.toSourceId)) : []}));
 const cityGroups = v.cityGroups.map(g => trim(g)).filter(g => g.sourceIds.length);
 const approved = packet.cases.find(c => c.code === v.code);
 if (v.code === "28") {
  return {...v, summary: approved!.story, families, cityGroups: approved!.groups.map((g, index) => ({
   id: `mayapur-v3:28:${index}`, city: g.title, sourceIds: g.sourceIds, rationale: g.note, suggestedVitrines: ["28"],
   spaceEstimate: {knownShelfShares: approved!.rows.filter(r => g.sourceIds.includes(r.sourceId)).reduce((sum, r) => sum + (r.knownFootprint ?? 0), 0),
    unknownFootprintCount: approved!.rows.filter(r => g.sourceIds.includes(r.sourceId) && r.knownFootprint === null).length,
    label: "Reference estimate", basis: "Dated source-shelf comparison; choose positions on site.", confidence: "planning proxy"},
  }))};
 }
 return {...v, summary: approved?.story ?? v.summary, families, cityGroups};
});
const version = "spn-starter-move-guide-2026-11-02-v7";
export const starterGuideContext: GuideContext = {guideVersion: version,
 contentDigest: hash({previous: previous.contentDigest, packet, rows, vitrines}),
 assignmentDigest: hash(starterV7Proposal.rows.map(row => [row.sourceId, row.vitrine]).sort((a,b) => a[0].localeCompare(b[0])))};
const suggestions: RegisteredSuggestion[] = vitrines.flatMap(v => [
 ...v.families.map(g => ({id: g.id, kind: "family" as const, sourceIds: g.sourceIds, targetVitrine: v.code})),
 ...v.cityGroups.map(g => ({id: g.id, kind: "city" as const, sourceIds: g.sourceIds, targetVitrine: v.code})),
]);
suggestions.push(...previousDefinition.suggestions.filter(s => s.kind === "row").map(s =>
 changes.has(s.sourceIds[0]) ? {...s, targetVitrine: "28"} : s));
const ids = vitrines.flatMap(v => [...v.families, ...v.cityGroups].flatMap(g => g.sourceIds));
if (ids.length !== rows.length || new Set(ids).size !== rows.length || rows.some(row =>
 !vitrines.some(v => v.code === row.vitrine && [...v.families, ...v.cityGroups].some(g => g.sourceIds.includes(row.sourceId))))) {
 throw new Error("The Mayapur guide must retain the exact starter source partition.");
}
export const registeredStarterGuide = {...previous, version, ...starterGuideContext,
 rows, vitrines, guideContext: starterGuideContext};
export const starterGuideDefinition: GuideDefinition = {context: starterGuideContext, suggestions,
 previousVersions: [previous.version, ...(previousDefinition.previousVersions ?? [])]};
