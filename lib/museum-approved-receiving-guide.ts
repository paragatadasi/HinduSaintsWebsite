import {createHash} from "node:crypto";
import {projectScopedMoveGuide} from "./spn-datta-guide";
import {MuseumMoveSessionError} from "./museum-move-session-domain";
import {spnMovementBlockedReason} from "./spn-movement-holds";
import type {GuideDefinition} from "./spn-starter-guide-registry";
import type {GuideEntry,GuideGroup,PhysicalState,StarterMoveGuide} from "./spn-move-guide";

export type ApprovedReceivingPacket={
 version:string;proposalVersion:string;title:string;proposalLabel:string;phaseLabel:string;
 contentDigest:string;assignmentDigest:string;allowClear:boolean;previousClearanceVersions?:string[];
 rows:(GuideEntry&{sourceRevision:string;capturedProposalDestination:string|null})[];
 vitrines:{code:string;summary:string;placementGuidance?:string;movementFitHold?:string;relocationDependency?:{sourceId:string;fromVitrine:string;reason:string}}[];
 groups:(Omit<GuideGroup,"suggestedVitrines">&{kind:"family"|"city";vitrine:string})[];
};
export type ApprovedReceivingReview={rows:{sourceId:string;saintId:string|null;effectiveVitrine:string|null;reviewReason?:string|null}[];proposal:{pendingPlacements:{sourceId:string;reason:string}[]}};
function canonical(value:unknown):string {
 if(Array.isArray(value))return `[${value.map(canonical).join(",")}]`;
 if(value&&typeof value==="object")return `{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${canonical((value as Record<string,unknown>)[k])}`).join(",")}}`;
 return JSON.stringify(value)??"null";
}
const hash=(value:string)=>createHash("sha256").update(value).digest("hex");
export function approvedReceivingDigests(packet:Omit<ApprovedReceivingPacket,"contentDigest"|"assignmentDigest">){
 const pairs=packet.rows.map(r=>[r.sourceId,r.destination]).sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0);
 const assignmentDigest=hash(JSON.stringify(pairs));
 return {assignmentDigest,contentDigest:hash(canonical({...packet,assignmentDigest}))};
}
export function createApprovedReceivingGuide(input:ApprovedReceivingPacket,expectedContentDigest:string){
 const packet=structuredClone(input);
 const {contentDigest,assignmentDigest,...content}=packet;
 const calculated=approvedReceivingDigests(content);
 const ids=new Set(packet.rows.map(r=>r.sourceId)),codes=new Set(packet.vitrines.map(v=>v.code));
 const members=packet.groups.flatMap(g=>g.sourceIds);
 const suggestionIds=[...packet.groups.map(g=>g.id),...packet.rows.map(r=>`row:${r.sourceId}`)];
 if(contentDigest!==expectedContentDigest||contentDigest!==calculated.contentDigest||assignmentDigest!==calculated.assignmentDigest||
 !packet.version||!packet.rows.length||ids.size!==packet.rows.length||codes.size!==packet.vitrines.length||
 packet.vitrines.some(v=>v.relocationDependency&&(!v.relocationDependency.sourceId.trim()||v.relocationDependency.fromVitrine!==v.code||!v.relocationDependency.reason.trim()))||
 packet.rows.some(r=>!r.sourceId||!r.sourceRevision||!codes.has(r.destination)||r.capturedProposalDestination===undefined||r.componentScope)||
 members.length!==ids.size||new Set(members).size!==ids.size||new Set(suggestionIds).size!==suggestionIds.length||
 packet.groups.some(g=>!codes.has(g.vitrine)||!g.sourceIds.length||g.sourceIds.some(id=>!packet.rows.some(r=>r.sourceId===id&&r.destination===g.vitrine))||g.edges?.some(e=>!g.sourceIds.includes(e.fromSourceId)||!g.sourceIds.includes(e.toSourceId))))throw new Error("The approved receiving guide or group partition changed.");
 const context={guideVersion:packet.version,contentDigest,assignmentDigest};
 const definition:GuideDefinition={context,suggestions:[...packet.groups.map(g=>({id:g.id,kind:g.kind,sourceIds:[...g.sourceIds],targetVitrine:g.vitrine})),...packet.rows.map(r=>({id:`row:${r.sourceId}`,kind:"row" as const,sourceIds:[r.sourceId],targetVitrine:r.destination}))],physicalScope:{allowClear:packet.allowClear,clearancePerDestination:packet.allowClear,preparationVitrines:packet.allowClear?undefined:[...codes],clearVitrines:packet.allowClear?[...codes]:[],previousClearanceVersions:packet.previousClearanceVersions,destinations:Object.fromEntries(packet.rows.map(r=>[r.sourceId,r.destination]))}};
 const group=(g:ApprovedReceivingPacket["groups"][number]):GuideGroup=>({...g,suggestedVitrines:[g.vitrine],allowedTargetVitrines:[]});
 const guide:StarterMoveGuide={...context,version:packet.version,proposalVersion:packet.proposalVersion,title:packet.title,proposalLabel:packet.proposalLabel,phaseLabel:packet.phaseLabel,allowClear:packet.allowClear,receivingOnly:!packet.allowClear,preparationVitrines:packet.allowClear?undefined:[...codes],clearancePerDestination:packet.allowClear,previousClearanceVersions:packet.previousClearanceVersions,
 entries:packet.rows.map(r=>({...r,reviewOnly:r.reviewOnly||!r.saintId,movementBlockedReason:r.movementBlockedReason||(!r.saintId||r.reviewOnly?"Review this holding before recording a move.":undefined)||spnMovementBlockedReason(r.sourceId)||packet.vitrines.find(v=>v.code===r.destination)?.movementFitHold})),
 vitrines:packet.vitrines.map(v=>({...v,fitGuidance:[v.placementGuidance,v.movementFitHold,v.relocationDependency?.reason].filter(Boolean).join(" ")||undefined,families:packet.groups.filter(g=>g.vitrine===v.code&&g.kind==="family").map(group),cityGroups:packet.groups.filter(g=>g.vitrine===v.code&&g.kind==="city").map(group)})),alternatives:[],reportedPlacements:[]};
 function relocationHold(destination:string,physical:PhysicalState):string|undefined{
  const dependency=packet.vitrines.find(v=>v.code===destination)?.relocationDependency;
  if(!dependency)return undefined;
  const matches=physical.rows.filter(row=>row.sourceId===dependency.sourceId);
  const source=matches.length===1?matches[0]:null;
  const relocated=source&&!source.identityChanged&&source.currentBasis==="confirmed"&&source.current&&source.current.code.trim()&&
   (source.current.kind==="table"||(source.current.kind==="vitrine"&&source.current.code!==dependency.fromVitrine));
  return relocated?undefined:dependency.reason;
 }
 function assertRelocationDependencies(records:{to:{kind:string;code:string}}[],physical:PhysicalState){
  for(const record of records){
   if(record.to.kind!=="vitrine")continue;
   const reason=relocationHold(record.to.code,physical);
   if(reason)throw new MuseumMoveSessionError(409,reason);
  }
 }
 function project(current:Parameters<typeof projectScopedMoveGuide>[1],physical:PhysicalState,review:ApprovedReceivingReview):StarterMoveGuide{
  const projected=projectScopedMoveGuide(guide,current,physical);
  const outgoing:NonNullable<StarterMoveGuide["outgoingDependencies"]>=[];
  const entries=projected.entries.flatMap(entry=>{
   const captured=packet.rows.find(r=>r.sourceId===entry.sourceId)!;
   const matches=review.rows.filter(r=>r.sourceId===entry.sourceId),live=matches.length===1?matches[0]:null;
   const sources=physical.rows.filter(r=>r.sourceId===entry.sourceId),source=sources.length===1?sources[0]:null;
   if(!entry.reviewOnly&&live&&live.effectiveVitrine!==entry.destination){outgoing.push({sourceId:entry.sourceId,name:entry.name,previousProposedVitrine:entry.destination,proposedDestination:live.effectiveVitrine,state:"Current curator destination retained"});return [];}
   const pending=review.proposal.pendingPlacements.find(r=>r.sourceId===entry.sourceId);
   const dependencyHold=relocationHold(entry.destination,physical);
   const reason=entry.movementBlockedReason||dependencyHold||(!source||source.identityChanged||source.saintId!==entry.saintId||source.sourceRevision!==captured.sourceRevision?"This source identity or evidence changed. Review it before moving.":
    !live||pending||live.saintId!==entry.saintId?pending?.reason||"The current proposal or identity needs review.":
    live.reviewReason&&!["Curator alternative destination","Current curator destination retained"].includes(live.reviewReason)?live.reviewReason:
    source.fixedHousing?"This holding needs its fixed-display workflow.":source.verifiedItemIds.length?"Use the verified inventory item workflow to preserve its history.":undefined);
   return [{...entry,movementBlockedReason:reason}];
  });
  const active=new Set(entries.map(e=>e.sourceId));
  const filter=(groups:GuideGroup[])=>groups.map(g=>({...g,sourceIds:g.sourceIds.filter(id=>active.has(id)),edges:g.edges?.filter(e=>active.has(e.fromSourceId)&&active.has(e.toSourceId))})).filter(g=>g.sourceIds.length);
  return {...projected,entries,outgoingDependencies:outgoing,vitrines:projected.vitrines.map(v=>({...v,families:filter(v.families),cityGroups:filter(v.cityGroups)}))};
 }
 function assertRecords(records:{sourceId:string;to:{kind:string;code:string;shelf?:string|null}}[],projected:StarterMoveGuide){
  if(projected.version!==context.guideVersion||projected.contentDigest!==contentDigest||projected.assignmentDigest!==assignmentDigest)throw new MuseumMoveSessionError(409,"Reload this receiving guide before recording a move.");
  for(const record of records){
   const entry=projected.entries.find(e=>e.sourceId===record.sourceId);
   if(record.to.shelf?.trim())throw new MuseumMoveSessionError(409,"Confirm the vitrine here; record an exact shelf through the shelf workflow.");
   if(!entry||entry.reviewOnly||!entry.saintId||entry.movementBlockedReason||record.to.kind!=="vitrine"||record.to.code!==entry.destination||definition.physicalScope?.destinations[record.sourceId]!==record.to.code)throw new MuseumMoveSessionError(409,"This source or proposal changed. Reload the guide before recording a move.");
  }
 }
 return {context,definition,guide,project,assertRecords,assertRelocationDependencies};
}
