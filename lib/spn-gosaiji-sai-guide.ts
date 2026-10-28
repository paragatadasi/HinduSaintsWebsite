import { createHash } from "node:crypto";
import packet from "../data/museum/spn-gosaiji-sai-core-guide-v1.json";
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
const {contentDigest:_digest,...content}=packet;
const pairs=packet.rows.map(row=>[row.sourceId,row.destination]).sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0);
const members=packet.groups.flatMap(group=>group.sourceIds);
if(packet.contentDigest!=="85f95c1cb8546df51d8bb8118161a6f7a766318171d8088f634b7cab5a4f9ed8" || hash(canonical(content))!==packet.contentDigest || hash(JSON.stringify(pairs))!==packet.assignmentDigest ||
 packet.rows.length!==36 || members.length!==36 || new Set(members).size!==36 ||
 packet.rows.filter(row=>row.destination==="75").length!==11 || packet.rows.filter(row=>row.destination==="37").length!==10 || packet.rows.filter(row=>row.destination==="4").length!==15 ||
 packet.groups.some(group=>group.sourceIds.some(id=>!packet.rows.some(row=>row.sourceId===id&&row.destination===group.vitrine)) || group.edges.some(edge=>!group.sourceIds.includes(edge.fromSourceId)||!group.sourceIds.includes(edge.toSourceId)))) throw new Error("The approved Gosaiji and Sai core changed.");
export const gosaijiSaiGuideContext={guideVersion:packet.version,contentDigest:packet.contentDigest,assignmentDigest:packet.assignmentDigest};
export const gosaijiSaiGuideDefinition:GuideDefinition={context:gosaijiSaiGuideContext,
 suggestions:[...packet.groups.map(group=>({id:group.id,kind:"family" as const,sourceIds:group.sourceIds,targetVitrine:group.vitrine})),...packet.rows.map(row=>({id:`row:${row.sourceId}`,kind:"row" as const,sourceIds:[row.sourceId],targetVitrine:row.destination}))],
 physicalScope:{allowClear:true,clearVitrines:["37"],clearanceRequiredDestinations:["37","4"],preparationVitrines:["75"],destinations:Object.fromEntries(pairs)}};
export const gosaijiSaiMoveGuide:StarterMoveGuide={
 version:packet.version,contentDigest:packet.contentDigest,assignmentDigest:packet.assignmentDigest,proposalVersion:packet.proposalVersion,title:packet.title,proposalLabel:packet.proposalLabel,
 phaseLabel:"Ramakrishna, Gosaiji & Sai",allowClear:true,requiredClearVitrines:["37"],clearanceRequiredDestinations:["37","4"],preparationVitrines:["75"],
 entries:packet.rows.map(row=>({...row,movementBlockedReason:spnMovementBlockedReason(row.sourceId)})),
 vitrines:[{code:"75",summary:"Fill 75 first, then clear 37. 11 inventory entries · estimated 3.32 / 5 shelf-height spaces. Bring the seven reported staged entries first; retrieve the other four directly.",families:packet.groups.filter(g=>g.vitrine==="75").map(g=>({...g,suggestedVitrines:["75"]})),cityGroups:[]},
 {code:"37",summary:"10 inventory entries · estimated 3.39 / 5 shelf-height spaces. Retain both Yogmaya entries (combined allowance 1.5); check whether they overlap before reducing space.",families:packet.groups.filter(g=>g.vitrine==="37").map(g=>({...g,suggestedVitrines:["37"]})),cityGroups:[]},
 {code:"4",summary:"15 inventory entries · estimated 5.47 / 5 shelf-height spaces. Check the complete group fits; moving Gosaiji’s circle does not empty this vitrine.",families:packet.groups.filter(g=>g.vitrine==="4").map(g=>({...g,suggestedVitrines:["4"]})),cityGroups:[]}],
 alternatives:[],reportedPlacements:[]
};
export function projectGosaijiSaiGuide(current:Parameters<typeof projectScopedMoveGuide>[1],physical:PhysicalState){return projectScopedMoveGuide(gosaijiSaiMoveGuide,current,physical);}
