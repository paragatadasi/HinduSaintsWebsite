import {createHash} from "node:crypto";
import packet from "../data/museum/spn-west-v46-guide-v1.json";
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
if(packet.contentDigest!=="15b4a09dfd8c4585323b75ff7cf40b1f400b6cbb9b95ed4fb61e8f192d787595"||hash(canonical(content))!==packet.contentDigest||hash(JSON.stringify(pairs))!==packet.assignmentDigest||
 packet.rows.length!==18||holdings.filter(row=>row.saintId).length!==18||members.length!==18||new Set(members).size!==18||
 packet.groups.some(group=>group.sourceIds.some(id=>!packet.rows.some(row=>row.sourceId===id&&row.destination===group.vitrine))||group.edges.some(edge=>!group.sourceIds.includes(edge.fromSourceId)||!group.sourceIds.includes(edge.toSourceId))))
 throw new Error("The approved Vitrine 46 roster changed.");

export const westV46GuideContext={guideVersion:packet.version,contentDigest:packet.contentDigest,assignmentDigest:packet.assignmentDigest};
export const westV46GuideDefinition:GuideDefinition={context:westV46GuideContext,
 suggestions:[...packet.groups.map(group=>({id:group.id,kind:group.kind==="family"?"family" as const:"city" as const,sourceIds:group.sourceIds.filter(id=>holdings.some(row=>row.sourceId===id)),targetVitrine:"46"})),
 ...holdings.map(row=>({id:`row:${row.sourceId}`,kind:"row" as const,sourceIds:[row.sourceId],targetVitrine:"46"}))],
 physicalScope:{allowClear:false,preparationVitrines:["46"],destinations:Object.fromEntries(pairs)}};
const holdingIds=new Set(holdings.map(row=>row.sourceId));
const group=(g:typeof packet.groups[number]):GuideGroup=>({...g,sourceIds:g.sourceIds.filter(id=>holdingIds.has(id)),suggestedVitrines:["46"],allowedTargetVitrines:[]});
export const westV46MoveGuide:StarterMoveGuide={version:packet.version,...westV46GuideContext,proposalVersion:packet.proposalVersion,title:packet.title,proposalLabel:packet.proposalLabel,
 phaseLabel:"Pandharpur–Alandi · 46",allowClear:false,preparationVitrines:["46"],
 entries:holdings.map(row=>({...row,movementBlockedReason:spnMovementBlockedReason(row.sourceId)})),
 vitrines:[{code:"46",summary:"18 entries · about 4.49 shelf spaces, plus two unmeasured holdings. Keep living saints below the top.",families:packet.groups.filter(g=>g.kind==="family").map(group),cityGroups:packet.groups.filter(g=>g.kind!=="family").map(group)}],alternatives:[],reportedPlacements:[]};

type Review={rows:Pick<ReturnType<typeof buildLatestSpnReview>["rows"][number],"sourceId"|"saintId"|"effectiveVitrine"|"reviewReason">[];proposal:{pendingPlacements:{sourceId:string;reason:string}[]}};
export function projectWestV46Guide(current:Parameters<typeof projectScopedMoveGuide>[1],physical:PhysicalState,review:Review):StarterMoveGuide {
 const guide=projectScopedMoveGuide(westV46MoveGuide,current,physical);
 const outgoing:NonNullable<StarterMoveGuide["outgoingDependencies"]>=[];
 const entries=guide.entries.flatMap(entry=>{
  const captured=packet.rows.find(row=>row.sourceId===entry.sourceId)!;
  const sources=physical.rows.filter(row=>row.sourceId===entry.sourceId),source=sources.length===1?sources[0]:null;
  const matches=review.rows.filter(row=>row.sourceId===entry.sourceId),live=matches.length===1?matches[0]:null;
  const pending=review.proposal.pendingPlacements.find(row=>row.sourceId===entry.sourceId);
  if(live&&live.effectiveVitrine!=="46"){
   outgoing.push({sourceId:entry.sourceId,name:entry.name,previousProposedVitrine:"46",proposedDestination:live.effectiveVitrine,state:"Newer curator destination retained"});return [];
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
 return {...guide,entries,outgoingDependencies:outgoing,vitrines:guide.vitrines.map(v=>({...v,families:filter(v.families),cityGroups:filter(v.cityGroups)}))};
}

export function assertWestV46Records(records:{sourceId:string;to:{kind:string;code:string;shelf?:string|null}}[],guide:StarterMoveGuide){
 for(const record of records){const entry=guide.entries.find(row=>row.sourceId===record.sourceId);
  if(record.to.shelf?.trim())throw new MuseumMoveSessionError(409,"Confirm the vitrine here; record an exact shelf through the shelf workflow.");
  if(!entry||entry.movementBlockedReason||!westV46GuideDefinition.physicalScope?.destinations[record.sourceId]||record.to.kind!=="vitrine"||record.to.code!==entry.destination)
   throw new MuseumMoveSessionError(409,"This Vitrine 46 source or proposal changed. Reload the guide before recording a move.");
 }
}
