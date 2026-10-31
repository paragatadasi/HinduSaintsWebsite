import {createHash} from "node:crypto";
import packet from "../data/museum/spn-west-v45-guide-v1.json";
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
const holdings=packet.rows.filter(row=>!row.anchorOnly);
const pairs=holdings.map(row=>[row.sourceId,row.destination]).sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0);
const members=packet.groups.flatMap(group=>group.sourceIds);
if(packet.contentDigest!=="5fcaafa98adccbabee235069d56294446356d667bbd342f1ee905b3b48deb89b"||hash(canonical(content))!==packet.contentDigest||hash(JSON.stringify(pairs))!==packet.assignmentDigest||
 packet.rows.length!==22||holdings.length!==21||holdings.filter(row=>row.saintId).length!==19||members.length!==22||new Set(members).size!==22||
 packet.groups.some(group=>group.sourceIds.some(id=>!packet.rows.some(row=>row.sourceId===id&&row.destination===group.vitrine))||group.edges.some(edge=>!group.sourceIds.includes(edge.fromSourceId)||!group.sourceIds.includes(edge.toSourceId))))
 throw new Error("The approved Vitrine 45 roster changed.");

export const westV45GuideContext={guideVersion:packet.version,contentDigest:packet.contentDigest,assignmentDigest:packet.assignmentDigest};
export const westV45GuideDefinition:GuideDefinition={context:westV45GuideContext,
 suggestions:[...packet.groups.map(group=>({id:group.id,kind:group.kind==="family"?"family" as const:"city" as const,sourceIds:group.sourceIds.filter(id=>holdings.some(row=>row.sourceId===id)),targetVitrine:"45"})),
 ...holdings.map(row=>({id:`row:${row.sourceId}`,kind:"row" as const,sourceIds:[row.sourceId],targetVitrine:"45"}))],
 physicalScope:{allowClear:false,preparationVitrines:["45"],destinations:Object.fromEntries(pairs)}};
export const westV45ContextAnchors=packet.rows.filter(row=>row.anchorOnly);
const holdingIds=new Set(holdings.map(row=>row.sourceId));
const group=(g:typeof packet.groups[number]):GuideGroup=>({...g,sourceIds:g.sourceIds.filter(id=>holdingIds.has(id)),suggestedVitrines:["45"],allowedTargetVitrines:[]});
export const westV45MoveGuide:StarterMoveGuide={version:packet.version,...westV45GuideContext,proposalVersion:packet.proposalVersion,title:packet.title,proposalLabel:packet.proposalLabel,
 phaseLabel:"Varkari · 45",allowClear:false,preparationVitrines:["45"],
 entries:holdings.map(row=>({...row,movementBlockedReason:spnMovementBlockedReason(row.sourceId)})),
 vitrines:[{code:"45",summary:"22 display entries: 21 holding observations and one anchor only. Known comparison load 5.37 / 5 plus two unmeasured holdings. Place the three optional additions last; decline any that do not fit. Check available space on site; no whole-case clearing is required.",families:packet.groups.filter(g=>g.kind==="family").map(group),cityGroups:packet.groups.filter(g=>g.kind!=="family").map(group)}],alternatives:[],reportedPlacements:[]};

type Review={rows:Pick<ReturnType<typeof buildLatestSpnReview>["rows"][number],"sourceId"|"saintId"|"effectiveVitrine"|"reviewReason">[];proposal:{pendingPlacements:{sourceId:string;reason:string}[]}};
export function projectWestV45Guide(current:Parameters<typeof projectScopedMoveGuide>[1],physical:PhysicalState,review:Review):StarterMoveGuide & {contextAnchors:typeof westV45ContextAnchors} {
 const guide=projectScopedMoveGuide(westV45MoveGuide,current,physical);
 const outgoing:NonNullable<StarterMoveGuide["outgoingDependencies"]>=[];
 const entries=guide.entries.flatMap(entry=>{
  const captured=packet.rows.find(row=>row.sourceId===entry.sourceId)!;
  const sources=physical.rows.filter(row=>row.sourceId===entry.sourceId),source=sources.length===1?sources[0]:null;
  const matches=review.rows.filter(row=>row.sourceId===entry.sourceId),live=matches.length===1?matches[0]:null;
  const pending=review.proposal.pendingPlacements.find(row=>row.sourceId===entry.sourceId);
  // The two unlinked observations retain their exact approved display scope without acquiring a canonical identity.
  const capturedSourceOnly=!entry.saintId&&live?.effectiveVitrine===captured.capturedProposalDestination&&!live.reviewReason;
  if(live&&live.effectiveVitrine!=="45"&&!capturedSourceOnly){
   outgoing.push({sourceId:entry.sourceId,name:entry.name,previousProposedVitrine:"45",proposedDestination:live.effectiveVitrine,state:"Newer curator destination retained"});return [];
  }
  const reason=entry.movementBlockedReason||(!source||source.identityChanged||source.saintId!==entry.saintId||source.sourceRevision!==captured.sourceRevision?"This source identity or evidence changed. Review it before moving.":
   !live||pending||live.saintId!==entry.saintId?pending?.reason||"The current proposal or identity needs review.":
   live.reviewReason&&!["Curator alternative destination","Current curator destination retained"].includes(live.reviewReason)?live.reviewReason:
   source.fixedHousing?"This holding needs its fixed-display workflow.":
   source.verifiedItemIds.length?"Use the verified inventory item workflow to preserve its history.":undefined);
  return [{...entry,movementBlockedReason:reason}];
 });
 const ids=new Set(entries.map(entry=>entry.sourceId));
 const filter=(groups:GuideGroup[])=>groups.map(g=>({...g,sourceIds:g.sourceIds.filter(id=>ids.has(id)),edges:g.edges?.filter(e=>ids.has(e.fromSourceId)&&ids.has(e.toSourceId))})).filter(g=>g.sourceIds.length);
 return {...guide,entries,contextAnchors:westV45ContextAnchors,outgoingDependencies:outgoing,vitrines:guide.vitrines.map(v=>({...v,families:filter(v.families),cityGroups:filter(v.cityGroups)}))};
}

export function assertWestV45Records(records:{sourceId:string;to:{kind:string;code:string}}[],guide:StarterMoveGuide){
 for(const record of records){const entry=guide.entries.find(row=>row.sourceId===record.sourceId);
  if(!entry||entry.movementBlockedReason||!westV45GuideDefinition.physicalScope?.destinations[record.sourceId]||record.to.kind!=="vitrine"||record.to.code!==entry.destination)
   throw new MuseumMoveSessionError(409,"This Vitrine 45 source or proposal changed. Reload the guide before recording a move.");
 }
}
