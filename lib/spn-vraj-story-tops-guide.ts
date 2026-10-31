import {createHash} from "node:crypto";
import packet from "../data/museum/spn-vraj-story-tops-guide-v2.json";
import approvedProposal from "../data/museum/spn-vraj-approved-v17.json";
import type {GuideDefinition} from "./spn-starter-guide-registry";
import type {GuideGroup,StarterMoveGuide} from "./spn-move-guide";
import {spnMovementBlockedReason} from "./spn-movement-holds";

function canonical(value:unknown):string {
 if(Array.isArray(value))return `[${value.map(canonical).join(",")}]`;
 if(value&&typeof value==="object")return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonical((value as Record<string,unknown>)[key])}`).join(",")}}`;
 return JSON.stringify(value)??"null";
}
const hash=(value:string)=>createHash("sha256").update(value).digest("hex");
const {contentDigest:unusedDigest,...content}=packet;
const pairs=packet.rows.map(row=>[row.sourceId,row.destination]).sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0);
const grouped=packet.groups.flatMap(group=>group.sourceIds);
if(packet.proposalVersion!==approvedProposal.version||hash(canonical(content))!==packet.contentDigest||hash(JSON.stringify(pairs))!==packet.assignmentDigest||
 packet.rows.length!==99||new Set(grouped).size!==99||grouped.length!==99||packet.vitrines.join(",")!=="32,33,34,35,38"||
 packet.groups.some(group=>group.sourceIds.some(id=>!packet.rows.some(row=>row.sourceId===id&&row.destination===group.vitrine))||group.edges.some(edge=>!group.sourceIds.includes(edge.fromSourceId)||!group.sourceIds.includes(edge.toSourceId))))
 throw new Error("The reviewed Vraj remainder guide changed.");

export const vrajStoryTopsGuideContext={guideVersion:packet.version,contentDigest:packet.contentDigest,assignmentDigest:packet.assignmentDigest};
export const vrajStoryTopsGuideDefinition:GuideDefinition={context:vrajStoryTopsGuideContext,previousVersions:["spn-vraj-remainder-2026-10-30-v1"],
 suggestions:[...packet.groups.map(group=>({id:group.id,kind:group.kind==="family"?"family" as const:"city" as const,sourceIds:group.sourceIds,targetVitrine:group.vitrine})),
 ...packet.rows.map(row=>({id:`row:${row.sourceId}`,kind:"row" as const,sourceIds:[row.sourceId],targetVitrine:row.destination}))],
 physicalScope:{previousClearanceVersions:["spn-vraj-remainder-2026-10-30-v1"],allowClear:true,clearVitrines:packet.vitrines,clearanceRequiredDestinations:packet.vitrines,clearancePerDestination:true,preparationVitrines:packet.vitrines,destinations:Object.fromEntries(pairs)}};
const group=(value:typeof packet.groups[number]):GuideGroup=>({...value,suggestedVitrines:[value.vitrine],edges:value.edges.map(edge=>({...edge,basis:edge.uncertain?"source":"reviewed"}))});
export const vrajStoryTopsMoveGuide:StarterMoveGuide={...vrajStoryTopsGuideContext,version:packet.version,title:packet.title,proposalVersion:packet.proposalVersion,proposalLabel:packet.proposalLabel,
 phaseLabel:packet.title,previousClearanceVersions:["spn-vraj-remainder-2026-10-30-v1"],allowClear:true,clearancePerDestination:true,requiredClearVitrines:packet.vitrines,clearanceRequiredDestinations:packet.vitrines,preparationVitrines:packet.vitrines,
 entries:packet.rows.map(row=>({...row,lifeStatus:row.lifeStatus??undefined,movementBlockedReason:row.movementBlockedReason||spnMovementBlockedReason(row.sourceId)})),
 vitrines:packet.vitrines.map(code=>({code,summary:packet.groups.filter(g=>g.vitrine===code).map(g=>g.title).join(" · "),
 families:packet.groups.filter(g=>g.vitrine===code&&g.kind==="family").map(group),cityGroups:packet.groups.filter(g=>g.vitrine===code&&g.kind!=="family").map(group)})),alternatives:[],reportedPlacements:[]};

