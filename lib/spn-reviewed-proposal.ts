import {spnDuplicateObservations} from "./spn-observation-suppression";
import reviewedCaseNotes from "../data/museum/spn-vraj-current-case-notes-v17.json";
import rawVraj from "../data/museum/spn-vraj-approved-v17.json";
import {vrajMoveGuide} from "./spn-vraj-guide";
import overlay from "../data/museum/spn-approved-proposal-overlay-v1.json";
import {currentSpnProposalRelease} from "./spn-current-proposal";
import {correctSpnProposal} from "./spn-proposal-corrections";
import {reconcileSpnRoomProposal} from "./spn-room-proposal";
import {projectCurrentPrimaryAnchors} from "./spn-live-display-tiers";
import {gosaijiSaiMoveGuide} from "./spn-gosaiji-sai-guide";
import {dattaMoveGuide} from "./spn-datta-guide";
import {starterMoveGuide} from "./spn-starter-move-guide";
import {ramBhaktiMoveGuide} from "./spn-ram-bhakti-guide";
import type {ProposalObservation} from "./spn-room-proposal";
const vraj: {
 version:string;
 assignments:{sourceId:string;saintId:string|null;destination:string;capturedTier:string;capturedBaseline:ProposalObservation["baseline"];spaceEstimate:number|null}[];
 caseStories:Record<string,string>;
 topPlacement:Record<string,{sourceIds:string[];label:string}>;
} = rawVraj;
import type {MuseumSaintPlacement} from "./museum-proposals";

const currentCaseNotes: Record<string, string | null> = reviewedCaseNotes;
export const latestSpnReviewVersion=vraj.version;
export function buildLatestSpnReview(current:MuseumSaintPlacement[], alternatives:{sourceId:string;vitrine:string;shelf:string|null}[]=[]){
 const base=correctSpnProposal(currentSpnProposalRelease);
 const overrides=new Map(overlay.overrides.map(row=>[row.sourceId,row]));
 const originals=[...base.proposal.rows,...base.proposal.namedOnly];
 if(overrides.size!==85||[...overrides.values()].some(change=>!originals.some(row=>row.sourceId===change.sourceId&&row.saintId===change.saintId)))throw new Error("The approved proposal refinements need source reconciliation.");
 const amended=originals.map(row=>{const change=overrides.get(row.sourceId);return change?{...row,vitrine:change.proposedVitrine,
  tier:change.capturedTier??row.tier,baseline:change.capturedBaseline??row.baseline}:row;});
 const vrajById=new Map(vraj.assignments.map(row=>[row.sourceId,row]));
 if(vrajById.size!==167||vraj.assignments.some(change=>!originals.some(row=>row.sourceId===change.sourceId&&row.saintId===change.saintId)))throw new Error("The approved Vraj source identities changed.");
 const scoped:ProposalObservation[]=amended.map(row=>{const change=vrajById.get(row.sourceId);return change?{...row,vitrine:change.destination,tier:change.capturedTier,baseline:change.capturedBaseline??row.baseline}:row;});
 const reconciled=reconcileSpnRoomProposal(scoped,current,{acceptedBaseline:true}).map(row=>{const alternative=alternatives.find(a=>a.sourceId===row.sourceId);return alternative?{...row,effectiveVitrine:alternative.vitrine,reviewReason:"Curator alternative destination"}:row;});
 const privateIds=new Set(overlay.excludedFromMuseumDisplay.map(row=>row.sourceId));
 const pendingIds=new Set(overlay.pendingReceiverSourceIds);
 const pendingPlacements=reconciled.filter(row=>privateIds.has(row.sourceId)||pendingIds.has(row.sourceId)&&row.effectiveVitrine===row.vitrine&&!current.some(record=>record.id===row.baseline?.placementId&&record.arrangement?.vitrine&&["Planned","Implemented"].includes(record.arrangement.status)&&record.arrangement.revision!==row.baseline?.revision)).map(row=>({sourceId:row.sourceId,name:row.name,previousVitrine:row.effectiveVitrine,reason:privateIds.has(row.sourceId)?"Privately held; excluded from museum display":"Outside the approved core; destination still to review"}));
 pendingPlacements.push(...scoped.filter(row=>spnDuplicateObservations[row.sourceId]).map(row=>({sourceId:row.sourceId,name:row.name,previousVitrine:row.vitrine,reason:spnDuplicateObservations[row.sourceId].reason})));
 const withheld=new Set(pendingPlacements.map(row=>row.sourceId));
 const rows=reconciled.filter(row=>!withheld.has(row.sourceId));
 const estimates=new Map(base.proposal.rows.map(row=>[row.sourceId,row.planningShelfEstimate]));
 for(const change of overlay.overrides)if("spaceEstimate" in change)estimates.set(change.sourceId,change.spaceEstimate??null);
 for(const change of vraj.assignments)estimates.set(change.sourceId,change.spaceEstimate);
 const indicators=base.proposal.indicators.map(indicator=>{
  const occupants=rows.filter(row=>row.effectiveVitrine===indicator.vitrine);
  const unknown=occupants.filter(row=>estimates.get(row.sourceId)==null);
  const estimate=occupants.reduce((sum,row)=>sum+(estimates.get(row.sourceId)??0),0);
  const unresolved=occupants.filter(row=>row.unresolved);
  return {...indicator,estimatedRequiredShelfShares:estimate,planningHeadroomShelfShares:5-estimate,unknownPlanningFootprintCount:unknown.length,unknownPlanningFootprintSourceIds:unknown.map(row=>row.sourceId),namedOnlyUnknownFootprintCount:0,
   potentialFlexibleSpace:!indicator.flexibleSpaceExclusion&&!unknown.length&&estimate<=4,
   hasUnresolvedHoldings:!!unresolved.length,unresolvedSourceObservationCount:unresolved.length,
   specialFitNote:Object.hasOwn(currentCaseNotes,indicator.vitrine)?currentCaseNotes[indicator.vitrine]:indicator.vitrine==="38"?null:indicator.vitrine==="4"?"Approved core: 15 source entries, estimated 5.47 / 5 shelf-height spaces. Check fit before filling. Other current occupants need separate review.":indicator.vitrine==="37"?"Approved core: 10 source entries, estimated 3.39 / 5 shelf-height spaces. Yogmaya’s two observations retain a combined allowance of 1.5. Seven city entries await separate destinations.":indicator.specialFitNote};
 });
 const guides=[{...starterMoveGuide,vitrines:starterMoveGuide.vitrines.filter(v=>v.code==="28")},dattaMoveGuide,ramBhaktiMoveGuide,gosaijiSaiMoveGuide,vrajMoveGuide];
 const reviewedFamilies=guides.flatMap(guide=>guide.vitrines.map(v=>({...v,families:v.families.map(group=>{const present=new Set(rows.filter(row=>row.effectiveVitrine===v.code).map(row=>row.sourceId));return {...group,sourceIds:group.sourceIds.filter(id=>present.has(id)),edges:group.edges?.filter(edge=>present.has(edge.fromSourceId)&&present.has(edge.toSourceId))};}),entries:guide.entries.map(entry=>{const row=rows.find(row=>row.sourceId===entry.sourceId);return row?{...entry,name:row.name,tier:row.tier}:entry;})})));
 const caseTitles=new Map(reviewedFamilies.map(v=>[v.code,v.families.map(g=>g.title).join(" · ")]));
 for(const [code,title] of Object.entries(vraj.caseStories))caseTitles.set(code,title);
 const options=base.designData.options.map(original=>{
  const option=projectCurrentPrimaryAnchors(original,rows);
  const assignments=option.assignments.map(a=>({...a,subsection:caseTitles.get(a.number)??a.subsection}));
  return {...option,id:latestSpnReviewVersion,title:"East–North connections · current refinements",summary:"",assignments,
   displayPackets:assignments.map(a=>({unitId:`current-case-${a.number}`,label:a.subsection,group:a.group,cases:[Number(a.number)],navigationKind:"neighborhood"})),
   drivers:option.drivers.filter(d=>!d.places.some(n=>caseTitles.has(String(n)))).concat(reviewedFamilies.map(v=>({connection:caseTitles.get(v.code)!,places:[Number(v.code)],reason:v.summary}))) };
 });
 const tertiaryCityClusters=base.proposal.layout.vitrines.map(vitrine=>{const cities=new Map<string,{saintId:string;name:string}[]>();for(const row of rows.filter(r=>r.effectiveVitrine===vitrine.number)){const record=current.find(p=>p.sourceRecordId===row.sourceId||p.id===row.sourceId);const city=record?.normalizedPlaces[0];if(city&&row.saintId)cities.set(city,[...(cities.get(city)??[]),{saintId:row.saintId,name:row.name}]);}return {vitrine:Number(vitrine.number),groups:[...cities].map(([city,members])=>({city,members:[...new Map(members.map(m=>[m.saintId,m])).values()]}))};});
 return {proposal:{...base.proposal,version:latestSpnReviewVersion,title:"East–North connections · current refinements",reviewStatus:"Approved Vraj refinement · 29 October",reviewNote:"Newer curator destinations take precedence. Pending city placements and privately held records are listed separately.",indicators,tertiaryCityClusters,reviewedFamilies,pendingPlacements,topPlacement:vraj.topPlacement,liveEstimates:true},
  designData:{...base.designData,options,placements:rows.flatMap(row=>row.saintId?[{saintId:row.saintId,vitrine:row.effectiveVitrine,rationale:row.reviewReason||row.allocationKind}]:[])},rows};
}
