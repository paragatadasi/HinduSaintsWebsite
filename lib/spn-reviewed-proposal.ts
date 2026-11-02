import {westMountAbu} from "./spn-west-mount-abu";
import {companionLocationLabel} from "./spn-move-guide";
import {auditedPendingAllocations} from "./spn-audited-pending-allocation";
import {projectAuditedPendingAllocations} from "./spn-audited-pending-allocation";
import {curatedVitrineHeadline} from "./museum-curated-headlines";
import {easternHeadlines,easternCaseGroups} from "./spn-eastern-headlines";
import {eastRemainderMoveGuide} from "./spn-east-remainder-guide";
import puriOdisha from "../data/museum/spn-puri-odisha-approved-v4.json";
import currentRoomLayout from "../data/museum/layouts/spn-layout-2026-10-23.json";
import v5 from "../data/museum/spn-vitrine5-addon-v1.json";
import {applyBilashFollowup} from "./spn-bilash-followup";
import {applyParamanandObjectProposal,paramanandProposalResolution,paramanandObjectReview} from "./spn-paramanand-reviewed-object";
import {projectNorthernPendingReview} from "./spn-pending-review-projection";
import {northernMoveGuide} from "./spn-northern-guide";
import eastBaseline from "../data/museum/spn-east-fill-reviewed-baseline-v1.json";
import {applyNorthernVoyage,northernVoyage} from "./spn-northern-voyage";
import {fillFirstMoveGuide} from "./spn-fill-first-guide";
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
import type {CompanionRow} from "./spn-move-guide";
import {regionalPendingTransfer,regionalPendingSourceIds} from "./spn-regional-pending-transfers";

const currentCaseNotes: Record<string, string | null> = reviewedCaseNotes;
export const latestSpnReviewVersion=northernVoyage.version;
export function buildLatestSpnReview(current:MuseumSaintPlacement[], alternatives:{sourceId:string;vitrine:string;shelf:string|null;version?:number}[]=[], sources:(Pick<CompanionRow,"sourceId"|"saintId"|"sourceRevision"|"identityChanged"> & Partial<Pick<CompanionRow,"current"|"original"|"componentPlacement">>)[]=[]){
 const base=correctSpnProposal(currentSpnProposalRelease);
 const overrides=new Map(overlay.overrides.map(row=>[row.sourceId,row]));
 const originals=[...base.proposal.rows,...base.proposal.namedOnly];
 if(overrides.size!==85||[...overrides.values()].some(change=>!originals.some(row=>row.sourceId===change.sourceId&&row.saintId===change.saintId)))throw new Error("The approved proposal refinements need source reconciliation.");
 const amended=originals.map(row=>{const change=overrides.get(row.sourceId);return change?{...row,vitrine:change.proposedVitrine,
  tier:change.capturedTier??row.tier,baseline:change.capturedBaseline??row.baseline}:row;});
 const vrajById=new Map(vraj.assignments.map(row=>[row.sourceId,row]));
 if(vrajById.size!==167||vraj.assignments.some(change=>!originals.some(row=>row.sourceId===change.sourceId&&row.saintId===change.saintId)))throw new Error("The approved Vraj source identities changed.");
 const vrajScoped:ProposalObservation[]=amended.map(row=>{const change=vrajById.get(row.sourceId);return change?{...row,vitrine:change.destination,tier:change.capturedTier,baseline:change.capturedBaseline??row.baseline}:row;});
 const eastById=new Map(eastBaseline.assignments.map(row=>[row.sourceId,row]));
 if(eastById.size!==50||eastBaseline.assignments.some(change=>!vrajScoped.some(row=>row.sourceId===change.sourceId&&row.saintId===change.saintId)))throw new Error("The approved East source identities need reconciliation.");
 const eastScoped=vrajScoped.map(row=>{const change=eastById.get(row.sourceId);return change?{...row,vitrine:change.destination,baseline:change.capturedBaseline}:row;});
 const scoped=applyNorthernVoyage(eastScoped).map(row=>{const change=v5.rows.find(r=>r.sourceId===row.sourceId&&r.saintId===row.saintId);return change?{...row,vitrine:"5",baseline:change.capturedBaseline,tier:change.capturedTier}:row;});
 const reconciled=reconcileSpnRoomProposal(applyParamanandObjectProposal(applyBilashFollowup(scoped,current),current),current,{acceptedBaseline:true}).map(row=>{const alternative=alternatives.find(a=>a.sourceId===row.sourceId);return alternative?{...row,effectiveVitrine:alternative.vitrine,reviewReason:"Curator alternative destination"}:row;});
 const privateIds=new Set(overlay.excludedFromMuseumDisplay.map(row=>row.sourceId));
 const pendingIds=new Set([...overlay.pendingReceiverSourceIds,...eastBaseline.heldSourceIds]);
 if(paramanandProposalResolution(current).destination)pendingIds.delete(paramanandObjectReview.sourceId);
 const pendingPlacements=reconciled.filter(row=>privateIds.has(row.sourceId)&&!alternatives.some(a=>a.sourceId===row.sourceId)||pendingIds.has(row.sourceId)&&!alternatives.some(a=>a.sourceId===row.sourceId)&&row.effectiveVitrine===row.vitrine&&!current.some(record=>record.id===row.baseline?.placementId&&record.arrangement?.vitrine&&["Planned","Implemented"].includes(record.arrangement.status)&&record.arrangement.revision!==row.baseline?.revision)).map(row=>({sourceId:row.sourceId,name:row.name,previousVitrine:row.effectiveVitrine,reason:privateIds.has(row.sourceId)?"Privately held; excluded from museum display":"Outside the approved core; destination still to review"}));
 for(const sourceId of regionalPendingSourceIds){
  const row=reconciled.find(item=>item.sourceId===sourceId);
  const transfer=regionalPendingTransfer(current,sources,alternatives,row?.effectiveVitrine);
  if(row&&transfer)pendingPlacements.push({sourceId,name:row.name,previousVitrine:row.effectiveVitrine,reason:`${transfer.label}. ${transfer.reason}`});
 }
 pendingPlacements.push(...scoped.filter(row=>spnDuplicateObservations[row.sourceId]).map(row=>({sourceId:row.sourceId,name:row.name,previousVitrine:row.vitrine,reason:spnDuplicateObservations[row.sourceId].reason})));
 for(const pending of projectNorthernPendingReview(reconciled,current,alternatives).pendingPlacements)if(!pendingPlacements.some(p=>p.sourceId===pending.sourceId))pendingPlacements.push(pending);
 for(const pending of projectAuditedPendingAllocations(reconciled,current,alternatives,sources))if(!pendingPlacements.some(p=>p.sourceId===pending.sourceId))pendingPlacements.push(pending);
 const withheld=new Set(pendingPlacements.map(row=>row.sourceId));
 const rows=reconciled.filter(row=>!withheld.has(row.sourceId));
 const estimates=new Map(base.proposal.rows.map(row=>[row.sourceId,row.planningShelfEstimate]));
 for(const change of overlay.overrides)if("spaceEstimate" in change)estimates.set(change.sourceId,change.spaceEstimate??null);
 for(const change of vraj.assignments)estimates.set(change.sourceId,change.spaceEstimate);
 for(const change of [...eastBaseline.assignments,...northernVoyage.assignments])estimates.set(change.sourceId,change.spaceEstimate);
 for(const v of easternHeadlines.vitrines)for(const a of v.allocations)estimates.set(a.sourceId,a.knownFootprint);
 estimates.set("rec9vEn5oj7QZTXl0",null);
 const indicators=base.proposal.indicators.map(indicator=>{
  const occupants=rows.filter(row=>row.effectiveVitrine===indicator.vitrine);
  const unknown=occupants.filter(row=>estimates.get(row.sourceId)==null);
  const estimate=occupants.reduce((sum,row)=>sum+(estimates.get(row.sourceId)??0),0);
  const unresolved=occupants.filter(row=>row.unresolved);
  return {...indicator,estimatedRequiredShelfShares:estimate,planningHeadroomShelfShares:5-estimate,unknownPlanningFootprintCount:unknown.length,unknownPlanningFootprintSourceIds:unknown.map(row=>row.sourceId),namedOnlyUnknownFootprintCount:0,
   potentialFlexibleSpace:!indicator.flexibleSpaceExclusion&&!unknown.length&&estimate<=4,
   hasUnresolvedHoldings:!!unresolved.length,unresolvedSourceObservationCount:unresolved.length,
   specialFitNote:westMountAbu.vitrines.some(v=>v.code===indicator.vitrine)?westMountAbu.vitrines.find(v=>v.code===indicator.vitrine)!.notes.join(" ")||null:indicator.vitrine==="26"?"Durgaprasad’s large display and the arm support remain unmeasured. Shelf recommendations are pending.":indicator.vitrine==="25"?"Shelf recommendations are pending.":Object.hasOwn(currentCaseNotes,indicator.vitrine)?currentCaseNotes[indicator.vitrine]:indicator.vitrine==="38"?null:indicator.vitrine==="4"?"Approved core: 15 source entries, estimated 5.47 / 5 shelf-height spaces. Check fit before filling. Other current occupants need separate review.":indicator.vitrine==="37"?"Approved core: 10 source entries, estimated 3.39 / 5 shelf-height spaces. Yogmayaâ€™s two observations retain a combined allowance of 1.5. Seven city entries await separate destinations.":indicator.specialFitNote};
 });
 const guides=[{...eastRemainderMoveGuide,vitrines:eastRemainderMoveGuide.vitrines.filter(v=>v.code==="25"||v.code==="26")},{...starterMoveGuide,vitrines:starterMoveGuide.vitrines.filter(v=>["27","28","29"].includes(v.code))},dattaMoveGuide,ramBhaktiMoveGuide,{...gosaijiSaiMoveGuide,vitrines:gosaijiSaiMoveGuide.vitrines.filter(v=>v.code!=="75")},vrajMoveGuide,fillFirstMoveGuide,northernMoveGuide];
 const reviewedFamilies=guides.flatMap(guide=>guide.vitrines.map(v=>({...v,families:v.families.map(group=>{const present=new Set(rows.filter(row=>row.effectiveVitrine===v.code).map(row=>row.sourceId));return {...group,sourceIds:group.sourceIds.filter(id=>present.has(id)),edges:group.edges?.filter(edge=>present.has(edge.fromSourceId)&&present.has(edge.toSourceId))};}),entries:guide.entries.map(entry=>{const row=rows.find(row=>row.sourceId===entry.sourceId);return row?{...entry,name:row.name,tier:row.tier}:entry;})})));
 for(const v of easternHeadlines.vitrines){
  const entries=rows.filter(row=>row.effectiveVitrine===v.code).map(row=>({sourceId:row.sourceId,saintId:row.saintId,name:row.name,tier:row.tier,city:"",relicDescription:"",destination:v.code,section:row.section,family:"",rationale:""}));
  const groups=easternCaseGroups(v.code,entries)!;
  const index=reviewedFamilies.findIndex(caseRow=>caseRow.code===v.code);
  const updated={code:v.code,...groups,entries};
  if(index>=0)reviewedFamilies[index]=updated;else reviewedFamilies.push(updated);
 }
 const caseTitles=new Map(reviewedFamilies.map(v=>[v.code,v.families.map(g=>g.title).join(" Â· ")]));
 for(const [code,title] of Object.entries({...vraj.caseStories,...northernVoyage.caseStories}))caseTitles.set(code,title);
 for(const [code,story] of Object.entries(puriOdisha.headlineStories))caseTitles.set(code,story.title);
 for(const v of easternHeadlines.vitrines)caseTitles.set(v.code,v.summary);
 for(const code of ["27","28","56"])caseTitles.set(code,curatedVitrineHeadline(code,rows.map(r=>({sourceId:r.sourceId,destination:r.effectiveVitrine??""})),caseTitles.get(code)??""));
 for(const v of westMountAbu.vitrines)if(v.groups.some(g=>g.sources.some(s=>rows.some(r=>r.sourceId===s.sourceId&&r.saintId===s.saintId&&r.effectiveVitrine===v.code))))caseTitles.set(v.code,v.headline);
 const options=base.designData.options.map(original=>{
  const option=projectCurrentPrimaryAnchors(original,rows);
  const assignments=option.assignments.map(a=>{const positioned=(a.number==="47"||a.number==="59")?option.assignments.find(other=>other.number===(a.number==="47"?"59":"47"))??a:a;return {...positioned,number:a.number,subsection:caseTitles.get(a.number)??positioned.subsection};});
  return {...option,id:latestSpnReviewVersion,title:"Eastâ€“North connections Â· current refinements",summary:"",assignments,
   displayPackets:assignments.map(a=>({unitId:`current-case-${a.number}`,label:a.subsection,group:a.group,cases:[Number(a.number)],navigationKind:"neighborhood"})),
   drivers:option.drivers.filter(d=>!d.places.some(n=>caseTitles.has(String(n)))).concat(reviewedFamilies.map(v=>({connection:caseTitles.get(v.code)??v.summary,places:[Number(v.code)],reason:v.summary}))) };
 });
 const tertiaryCityClusters=base.proposal.layout.vitrines.map(vitrine=>{const cities=new Map<string,{saintId:string;name:string}[]>();for(const row of rows.filter(r=>r.effectiveVitrine===vitrine.number)){const record=current.find(p=>p.sourceRecordId===row.sourceId||p.id===row.sourceId);const city=record?.normalizedPlaces[0];if(city&&row.saintId)cities.set(city,[...(cities.get(city)??[]),{saintId:row.saintId,name:row.name}]);}return {vitrine:Number(vitrine.number),groups:[...cities].map(([city,members])=>({city,members:[...new Map(members.map(m=>[m.saintId,m])).values()]}))};});
 return {proposal:{...base.proposal,layout:currentRoomLayout,version:latestSpnReviewVersion,title:"Eastâ€“North connections Â· current refinements",reviewStatus:"Approved Northern journey Â· 29 October",reviewNote:"Newer curator destinations take precedence. Pending city placements and privately held records are listed separately.",indicators,tertiaryCityClusters,reviewedFamilies,pendingPlacements,allocationPendingSearch:pendingPlacements.filter(p=>auditedPendingAllocations[p.sourceId]).map(p=>{const source=sources.find(s=>s.sourceId===p.sourceId);const record=current.find(r=>r.sourceRecordId===p.sourceId);return {...p,searchNames:record?.searchNames??[],currentLocation:companionLocationLabel({...source,current:source?.current??null})};}),topPlacement:vraj.topPlacement,liveEstimates:true},
  designData:{...base.designData,options,placements:rows.flatMap(row=>row.saintId?[{saintId:row.saintId,vitrine:row.effectiveVitrine,rationale:row.reviewReason||row.allocationKind}]:[])},rows};
}
