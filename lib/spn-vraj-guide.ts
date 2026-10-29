import { createHash } from "node:crypto";
import packet from "../data/museum/spn-vraj-fill-guide-v1.json";
import { projectScopedMoveGuide } from "./spn-datta-guide";
import { spnMovementBlockedReason } from "./spn-movement-holds";
import type { GuideDefinition } from "./spn-starter-guide-registry";
import type { StarterMoveGuide, PhysicalState } from "./spn-move-guide";

function canonical(value: unknown): string {
 if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
 if (value && typeof value === "object") return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonical((value as Record<string,unknown>)[key])}`).join(",")}}`;
 return JSON.stringify(value) ?? "null";
}
const hash=(value:string)=>createHash("sha256").update(value).digest("hex");
const {contentDigest: _digest, ...content} = packet;
const pairs = packet.rows.map(row => [row.sourceId, row.destination]).sort((a,b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
const members = packet.groups.flatMap(group => group.sourceIds);
if (hash(canonical(content)) !== packet.contentDigest || hash(JSON.stringify(pairs)) !== packet.assignmentDigest ||
 packet.rows.length !== 40 || members.length !== 40 || new Set(members).size !== 40 ||
 packet.rows.filter(row => row.destination === "79").length !== 17 || packet.rows.filter(row => row.destination === "77").length !== 23 ||
 packet.groups.some(group => group.sourceIds.some(id => !packet.rows.some(row => row.sourceId === id && row.destination === group.vitrine)) ||
 group.edges.some(edge => !group.sourceIds.includes(edge.fromSourceId) || !group.sourceIds.includes(edge.toSourceId)))) throw new Error("The approved Vraj guide changed.");
export const vrajGuideContext = {guideVersion:packet.version, contentDigest:packet.contentDigest, assignmentDigest:packet.assignmentDigest};
export const vrajGuideDefinition: GuideDefinition = {context:vrajGuideContext,
 suggestions:[...packet.groups.map(group => ({id:group.id, kind:group.kind === "city" ? "city" as const : "family" as const, sourceIds:group.sourceIds,targetVitrine:group.vitrine})),
 ...packet.rows.map(row => ({id:`row:${row.sourceId}`,kind:"row" as const,sourceIds:[row.sourceId],targetVitrine:row.destination}))],
 physicalScope:{allowClear:false,preparationVitrines:["79","77"],destinations:Object.fromEntries(pairs)}};
export const vrajMoveGuide: StarterMoveGuide = {
 version:packet.version,contentDigest:packet.contentDigest,assignmentDigest:packet.assignmentDigest,proposalVersion:packet.proposalVersion,
 title:packet.title,proposalLabel:packet.proposalLabel,phaseLabel:packet.title,allowClear:false,preparationVitrines:["79","77"],
 entries:packet.rows.map(row => ({...row,movementBlockedReason:spnMovementBlockedReason(row.sourceId)})),
 vitrines:(["79","77"] as const).map(code => ({code,
 summary:`${packet.space[code].entries} inventory entries · estimated ${packet.space[code].known.toFixed(2)} / 5 shelf-height spaces. Confirm actual fit.`,
 families:packet.groups.filter(g => g.vitrine === code && g.kind === "family").map(g => ({...g,suggestedVitrines:[code]})),
 cityGroups:packet.groups.filter(g => g.vitrine === code && g.kind === "city").map(g => ({...g,suggestedVitrines:[code]}))})),
 alternatives:[],reportedPlacements:[]
};
export function projectVrajGuide(current:Parameters<typeof projectScopedMoveGuide>[1],physical:PhysicalState) {
 return projectScopedMoveGuide(vrajMoveGuide,current,physical);
}
