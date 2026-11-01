import {createHash} from "node:crypto";
import packet from "../data/museum/spn-southern-guide-v2.json";
import {projectScopedMoveGuide} from "./spn-datta-guide";
import {MuseumMoveSessionError} from "./museum-move-session-domain";
import {spnMovementBlockedReason} from "./spn-movement-holds";
import type {GuideDefinition} from "./spn-starter-guide-registry";
import type {GuideGroup,PhysicalState,StarterMoveGuide} from "./spn-move-guide";
import type {buildLatestSpnReview} from "./spn-reviewed-proposal";

function canonical(value:unknown):string {
 if(Array.isArray(value))return `[${value.map(canonical).join(",")}]`;
 if(value&&typeof value==="object")return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonical((value as Record<string,unknown>)[key])}`).join(",")}}`;
 return JSON.stringify(value)??"null";
}
const hash=(value:string)=>createHash("sha256").update(value).digest("hex");
const {contentDigest:unusedDigest,...content}=packet;
const holdings=packet.rows;
const pairs=holdings.map(row=>[row.sourceId,row.destination]).sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0);
const members=packet.groups.flatMap(group=>group.sourceIds);
if(packet.contentDigest!=="109279b19d543bde3ff5cfd06e5b9e391c3a9240550a11b974ad544ecfbaf308"||hash(canonical(content))!==packet.contentDigest||hash(JSON.stringify(pairs))!==packet.assignmentDigest||
 packet.rows.length!==146||holdings.filter(row=>row.saintId).length!==145||members.length!==146||new Set(members).size!==146||packet.reserveSourceIds.some(id=>holdings.some(row=>row.sourceId===id))||
 packet.groups.some(group=>group.sourceIds.some(id=>!packet.rows.some(row=>row.sourceId===id&&row.destination===group.vitrine))||group.edges.length!==0))
 throw new Error("The approved Southern roster changed.");

export const southernGuideContext={guideVersion:packet.version,contentDigest:packet.contentDigest,assignmentDigest:packet.assignmentDigest};
export const southernGuideDefinition:GuideDefinition={context:southernGuideContext,
 suggestions:[...packet.groups.map(group=>({id:group.id,kind:group.kind==="family"?"family" as const:"city" as const,sourceIds:group.sourceIds.filter(id=>holdings.some(row=>row.sourceId===id)),targetVitrine:group.vitrine})),
 ...holdings.map(row=>({id:`row:${row.sourceId}`,kind:"row" as const,sourceIds:[row.sourceId],targetVitrine:row.destination}))],
 physicalScope:{allowClear:true,clearancePerDestination:true,previousClearanceVersions:["spn-southern-2026-11-01-v1"],clearVitrines:packet.vitrines.map(v=>v.code),destinations:Object.fromEntries(pairs)}};
const holdingIds=new Set(holdings.map(row=>row.sourceId));
const group=(g:typeof packet.groups[number]):GuideGroup=>({...g,rationale:g.rationale,sourceIds:g.sourceIds.filter(id=>holdingIds.has(id)),suggestedVitrines:[g.vitrine],allowedTargetVitrines:[]});
export const southernMoveGuide:StarterMoveGuide={version:packet.version,...southernGuideContext,proposalVersion:packet.proposalVersion,title:packet.title,proposalLabel:packet.proposalLabel,
 phaseLabel:"Southern journey",allowClear:true,clearancePerDestination:true,previousClearanceVersions:["spn-southern-2026-11-01-v1"],
 entries:holdings.map(row=>({...row,rationale:row.rationale,movementBlockedReason:row.movementBlockedReason||spnMovementBlockedReason(row.sourceId)})),
 vitrines:packet.vitrines.map(v=>({...v,families:packet.groups.filter(g=>g.vitrine===v.code&&g.kind==="family").map(group),cityGroups:packet.groups.filter(g=>g.vitrine===v.code&&g.kind!=="family").map(group)})),contextAnchors:[{sourceId:"recXXBTDJy7Tp8LoG",name:"Dilip Kumar Roy & Indira Devi",destination:"53",rationale:"Proposed together in Vitrine 61, on the opposite face from Mirra and the Puducherry display. This is a cross-face connection, not a guru chain.",reviewNotes:[]}],alternatives:[],reportedPlacements:[]};

type Review={rows:Pick<ReturnType<typeof buildLatestSpnReview>["rows"][number],"sourceId"|"saintId"|"effectiveVitrine"|"reviewReason">[];proposal:{pendingPlacements:{sourceId:string;reason:string}[]}};
export function projectSouthernGuide(current:Parameters<typeof projectScopedMoveGuide>[1],physical:PhysicalState,review:Review):StarterMoveGuide {
 const guide=projectScopedMoveGuide(southernMoveGuide,current,physical);
 const outgoing:NonNullable<StarterMoveGuide["outgoingDependencies"]>=[];
 const entries=guide.entries.flatMap(entry=>{
  const captured=packet.rows.find(row=>row.sourceId===entry.sourceId)!;
  const sources=physical.rows.filter(row=>row.sourceId===entry.sourceId),source=sources.length===1?sources[0]:null;
  const matches=review.rows.filter(row=>row.sourceId===entry.sourceId),live=matches.length===1?matches[0]:null;
  const pending=review.proposal.pendingPlacements.find(row=>row.sourceId===entry.sourceId);
  if(!captured.saintId){
   return [{...entry,reviewOnly:true,movementBlockedReason:captured.movementBlockedReason,reviewNotes:[...(entry.reviewNotes??[]),`Current proposed destination: ${live?.effectiveVitrine??captured.capturedProposalDestination??"not recorded"}.`]}];
  }
  if(live&&live.effectiveVitrine!==captured.destination){
   outgoing.push({sourceId:entry.sourceId,name:entry.name,previousProposedVitrine:captured.destination,proposedDestination:live.effectiveVitrine,state:"Newer curator destination retained"});return [];
  }
  const unlocated=["recxP4lgXzCTsJ95J","recOFEIOFhdTwZXa1"].includes(entry.sourceId)&&!source?.current?"Locate and verify this holding before recording a move.":undefined;
  const reason=entry.movementBlockedReason||unlocated||(!source||source.identityChanged||source.saintId!==entry.saintId||source.sourceRevision!==captured.sourceRevision?"This source identity or evidence changed. Review it before moving.":
   !live||pending||live.saintId!==entry.saintId?pending?.reason||"The current proposal or identity needs review.":
   live.reviewReason&&!["Curator alternative destination","Current curator destination retained"].includes(live.reviewReason)?live.reviewReason:
   source.fixedHousing?"This holding needs its fixed-display workflow.":
   source.verifiedItemIds.length?"Use the verified inventory item workflow to preserve its history.":undefined);
  return [{...entry,movementBlockedReason:reason}];
 });
 const ids=new Set(entries.map(entry=>entry.sourceId));
 const filter=(groups:GuideGroup[])=>groups.map(g=>({...g,sourceIds:g.sourceIds.filter(id=>ids.has(id)),edges:g.edges?.filter(e=>ids.has(e.fromSourceId)&&ids.has(e.toSourceId))})).filter(g=>g.sourceIds.length);
 return {...guide,entries,outgoingDependencies:outgoing,vitrines:guide.vitrines.map(v=>({...v,families:filter(v.families),cityGroups:filter(v.cityGroups)}))};
}

export function assertSouthernRecords(records:{sourceId:string;to:{kind:string;code:string;shelf?:string|null}}[],guide:StarterMoveGuide){
 for(const record of records){const entry=guide.entries.find(row=>row.sourceId===record.sourceId);
  if(record.to.shelf?.trim())throw new MuseumMoveSessionError(409,"Confirm the vitrine here; record an exact shelf through the shelf workflow.");
  if(!entry||entry.movementBlockedReason||!southernGuideDefinition.physicalScope?.destinations[record.sourceId]||record.to.kind!=="vitrine"||record.to.code!==entry.destination)
   throw new MuseumMoveSessionError(409,"This Southern source or proposal changed. Reload the guide before recording a move.");
 }
}

export function applySouthernLivingReview(guide:StarterMoveGuide):StarterMoveGuide {
 return {...guide,entries:guide.entries.map(entry=>entry.sourceId==="rec1WWN7Xb1ZRGGhA"?{...entry,lifeStatus:{tag:"Still alive",basis:"Curator confirmed living on 1 November 2026; bottom-shelf placement."}}:entry)};
}
