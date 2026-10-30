import {createHash} from "node:crypto";
import packet from "../data/museum/spn-vraj-remainder-guide-v1.json";
import type {MuseumSaintPlacement} from "./museum-proposals";
import type {ShelfPlanningContext} from "./museum-shelf-planning-context";
import type {GuideDefinition} from "./spn-starter-guide-registry";
import type {GuideGroup,PhysicalState,StarterMoveGuide} from "./spn-move-guide";
import {projectScopedMoveGuide} from "./spn-datta-guide";
import {spnMovementBlockedReason} from "./spn-movement-holds";
import {MuseumMoveSessionError} from "./museum-move-session-domain";

function canonical(value:unknown):string {
 if(Array.isArray(value))return `[${value.map(canonical).join(",")}]`;
 if(value&&typeof value==="object")return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonical((value as Record<string,unknown>)[key])}`).join(",")}}`;
 return JSON.stringify(value)??"null";
}
const hash=(value:string)=>createHash("sha256").update(value).digest("hex");
const {contentDigest:unusedDigest,...content}=packet;
const pairs=packet.rows.map(row=>[row.sourceId,row.destination]).sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0);
const grouped=packet.groups.flatMap(group=>group.sourceIds);
if(hash(canonical(content))!==packet.contentDigest||hash(JSON.stringify(pairs))!==packet.assignmentDigest||
 packet.rows.length!==98||new Set(grouped).size!==98||grouped.length!==98||packet.vitrines.join(",")!=="32,33,34,35,38"||
 packet.groups.some(group=>group.sourceIds.some(id=>!packet.rows.some(row=>row.sourceId===id&&row.destination===group.vitrine))||group.edges.some(edge=>!group.sourceIds.includes(edge.fromSourceId)||!group.sourceIds.includes(edge.toSourceId))))
 throw new Error("The reviewed Vraj remainder guide changed.");

export const vrajRemainderGuideContext={guideVersion:packet.version,contentDigest:packet.contentDigest,assignmentDigest:packet.assignmentDigest};
export const vrajRemainderGuideDefinition:GuideDefinition={context:vrajRemainderGuideContext,
 suggestions:[...packet.groups.map(group=>({id:group.id,kind:group.kind==="family"?"family" as const:"city" as const,sourceIds:group.sourceIds,targetVitrine:group.vitrine})),
 ...packet.rows.map(row=>({id:`row:${row.sourceId}`,kind:"row" as const,sourceIds:[row.sourceId],targetVitrine:row.destination}))],
 physicalScope:{allowClear:true,clearVitrines:packet.vitrines,clearanceRequiredDestinations:packet.vitrines,clearancePerDestination:true,preparationVitrines:packet.vitrines,destinations:Object.fromEntries(pairs)}};
const group=(value:typeof packet.groups[number]):GuideGroup=>({...value,suggestedVitrines:[value.vitrine],edges:value.edges.map(edge=>({...edge,basis:edge.uncertain?"source":"reviewed"}))});
export const vrajRemainderMoveGuide:StarterMoveGuide={...vrajRemainderGuideContext,version:packet.version,title:packet.title,proposalVersion:packet.proposalVersion,proposalLabel:packet.proposalLabel,
 phaseLabel:packet.title,allowClear:true,clearancePerDestination:true,requiredClearVitrines:packet.vitrines,clearanceRequiredDestinations:packet.vitrines,preparationVitrines:packet.vitrines,
 entries:packet.rows.map(row=>({...row,movementBlockedReason:row.movementBlockedReason||spnMovementBlockedReason(row.sourceId)})),
 vitrines:packet.vitrines.map(code=>({code,summary:[...packet.groups.filter(g=>g.vitrine===code).map(g=>g.title),...new Set(packet.fitWarnings.filter(w=>w.code===code).map(w=>w.warning)),...(code==="33"?["Known comparison load 4.9 plus an unknown footprint; confirm actual fit."]:[])].join(" · "),
 families:packet.groups.filter(g=>g.vitrine===code&&g.kind==="family").map(group),cityGroups:packet.groups.filter(g=>g.vitrine===code&&g.kind!=="family").map(group)})),alternatives:[],reportedPlacements:[]};

export function projectVrajRemainderGuide(current:MuseumSaintPlacement[],physical:PhysicalState,context:ShelfPlanningContext):StarterMoveGuide {
 const guide=projectScopedMoveGuide(vrajRemainderMoveGuide,current,physical);
 const active=new Map(context.cases.flatMap(c=>c.entries.map(entry=>[entry.sourceId,entry] as const)));
 const changes=new Map(context.reviewedChanges.map(change=>[change.sourceId,change]));
 const changed=guide.entries.filter(entry=>{const change=changes.get(entry.sourceId);return change?.visibility==="changed"&&change.effectiveDestination!==entry.destination;});
 const changedIds=new Set(changed.map(entry=>entry.sourceId));
 const entries=guide.entries.filter(entry=>!changedIds.has(entry.sourceId)).map(entry=>{
  const live=active.get(entry.sourceId),change=changes.get(entry.sourceId),row=physical.rows.find(r=>r.sourceId===entry.sourceId);
  return {...entry,...(live?{name:live.name,tier:live.tier,lifeStatus:live.lifeStatus}:{}),movementBlockedReason:entry.movementBlockedReason||(!live?change?.reason||"Refresh and review this shelf assignment before recording a move.":row?.verifiedItemIds.length?"Use the verified inventory item workflow to preserve its history.":undefined)};
 });
 const ids=new Set(entries.map(entry=>entry.sourceId));
 const filterGroups=(groups:GuideGroup[])=>groups.map(g=>({...g,sourceIds:g.sourceIds.filter(id=>ids.has(id)),edges:g.edges?.filter(e=>ids.has(e.fromSourceId)&&ids.has(e.toSourceId))})).filter(g=>g.sourceIds.length);
 return {...guide,entries,vitrines:guide.vitrines.map(v=>({...v,families:filterGroups(v.families),cityGroups:filterGroups(v.cityGroups)})),outgoingDependencies:changed.map(entry=>({sourceId:entry.sourceId,name:entry.name,previousProposedVitrine:entry.destination,proposedDestination:changes.get(entry.sourceId)!.effectiveDestination,state:"Newer curator destination retained"}))};
}

export function assertVrajRemainderRecords(records:{sourceId:string;to:{kind:string;code:string}}[],guide:StarterMoveGuide){
 for(const record of records){const entry=guide.entries.find(e=>e.sourceId===record.sourceId);
  if(!entry||entry.movementBlockedReason||record.to.kind!=="vitrine"||record.to.code!==entry.destination)
   throw new MuseumMoveSessionError(409,"This Vraj source or assignment changed. Reload its current shelf plan before recording the move.");
 }
}
