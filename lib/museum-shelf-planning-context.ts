import type {MuseumSaintPlacement} from "./museum-proposals";
import type {GuideEntry,PhysicalState,StarterMoveGuide} from "./spn-move-guide";
import {projectCurrentGuideLifeStatus} from "./museum-guide-life-status";
import {reconcileSpnRoomProposal,type ProposalObservation,type ExplorerObservation} from "./spn-room-proposal";
import {buildLatestSpnReview} from "./spn-reviewed-proposal";

export type ShelfPlanningAllocation={
 sourceId:string;saintId?:string|null;name:string;tier?:string;capturedTier?:string;groupId:string;
 suggestedShelfIndex:number|null;reviewAlerts:{message:string}[];isContextOnly?:boolean;
 capturedBaseline?:ProposalObservation["baseline"];sourceRevision?:string|null;
 projectedLifeStatus?:GuideEntry["lifeStatus"];
};
export type ShelfPlanningCase={
 code:string;groups:{id:string;title:string;kind:string}[];allocations:ShelfPlanningAllocation[];
 relationships:{fromSourceId:string;toSourceId:string;label:string;direction:string;uncertain:boolean}[];
 contextNodes?:{id:string;label:string;physicalHolding:boolean}[];notes?:string[];
 conceptualAssignedLoads?:Record<string,number>;
};
export type ShelfPlanningPacket={version:string;vitrines:ShelfPlanningCase[];exceptions?:{code:string;band:number;knownLoad:number;warning:string}[]};
type CurrentMuseum={placements:MuseumSaintPlacement[];membersById:Map<string,Record<string,string>>};
type Destination={sourceId:string;vitrine:string;shelf:string|null};
type Addition=Destination&{saintId:string|null;sourceRevision:string};
type Review={rows:ExplorerObservation[];pendingPlacements:{sourceId:string;reason:string}[]};
export type ShelfPlanningChange={sourceId:string;name:string;capturedDestination:string;effectiveDestination:string|null;reason:string;visibility:"changed"|"pending"};
export type ShelfPlanningContext={
 version:string;mode:"recommendations_only";physicalActionsEnabled:false;
 cases:(ShelfPlanningCase&{title:string;entries:GuideEntry[];reviewedChanges:ShelfPlanningChange[];bandExceptions:NonNullable<ShelfPlanningPacket["exceptions"]>})[];
 reviewedChanges:ShelfPlanningChange[];
};

const bamanSourceId="recF52jndG5wSaY9c";
export const bamanShelfContext={sourceId:bamanSourceId,saintId:"cms0w7exp03jl07qicixobts0",baselineRevision:"7c2c46d5ad83e1fa5b4df6009ce4b3730a7870aa836810f48243fdc25bf21759",proposalRevision:"c78fa3620af56968a2941000b7ba9bffb72fd8a8c10d5ab2759b9b9c9d675b92"};
function currentPlacement(allocation:ShelfPlanningAllocation,current:CurrentMuseum){
 const matches=current.placements.filter(p=>p.sourceRecordId===allocation.sourceId||p.id===allocation.sourceId);
 return matches.length===1?matches[0]:null;
}

// This exact-source display exception records the user's co-location instruction, not an identity merge.
function bamanDestination(allocation:ShelfPlanningAllocation,placement:MuseumSaintPlacement|null,current:CurrentMuseum){
 if(allocation.sourceId!==bamanSourceId||!allocation.capturedBaseline||!placement||allocation.saintId!==bamanShelfContext.saintId||placement.saintId!==allocation.saintId)return null;
 const baseline=allocation.capturedBaseline;
 if(baseline.revision!==bamanShelfContext.baselineRevision||baseline.proposalRevision!==bamanShelfContext.proposalRevision)return null;
 if(placement.id!==baseline.placementId||placement.arrangementNeedsReview||placement.linkIssue||placement.placementState?.startsWith("Conflicting"))return null;
 if(placement.arrangement?.revision!==baseline.revision)return null;
 const proposal:ProposalObservation={sourceId:bamanSourceId,saintId:allocation.saintId,name:allocation.name,vitrine:"78",tier:baseline.tier,section:baseline.section,sourceVitrine:"",sourceShelf:"",unresolved:true,allocationKind:"Approved co-location; identity remains under review",share:null,state:"provisional",baseline};
 const [projected]=reconcileSpnRoomProposal([proposal],current.placements,{acceptedBaseline:true});
 return projected&&!projected.reviewReason?"78":null;
}

export function projectShelfPlanningContext(packet:ShelfPlanningPacket,input:{current:CurrentMuseum;physical:PhysicalState;alternatives?:Destination[];additions?:Addition[];review?:Review;now?:Date}):ShelfPlanningContext{
 const {current,physical}=input;
 const built=input.review??(()=>{const result=buildLatestSpnReview(current.placements,input.alternatives??[]);return {rows:result.rows,pendingPlacements:result.proposal.pendingPlacements};})();
 const active=new Map(built.rows.map(r=>[r.sourceId,r]));
 const pending=new Map(built.pendingPlacements.map(r=>[r.sourceId,r.reason]));
 const physicalById=new Map(physical.rows.map(r=>[r.sourceId,r]));
 const seen=new Set<string>();
 const cases:ShelfPlanningContext["cases"]=packet.vitrines.map(plan=>{
  const allocations:ShelfPlanningAllocation[]=[];const entries:GuideEntry[]=[];const reviewedChanges:ShelfPlanningChange[]=[];
  for(const captured of plan.allocations){
   if(seen.has(captured.sourceId))throw new Error("A shelf source occurs more than once. Reconcile the recommendation packet before loading it.");
   seen.add(captured.sourceId);
   const placement=currentPlacement(captured,current),row=active.get(captured.sourceId),physicalRow=physicalById.get(captured.sourceId);
   const alternative=input.alternatives?.find(a=>a.sourceId===captured.sourceId);
   const addition=input.additions?.find(a=>a.sourceId===captured.sourceId&&a.saintId===(captured.saintId??null)&&a.sourceRevision===physicalRow?.sourceRevision&&!physicalRow.identityChanged);
   let destination=addition?.vitrine??alternative?.vitrine??row?.effectiveVitrine??null;
   if(!addition&&!alternative&&row&&plan.code==="78")destination=bamanDestination(captured,placement,current)??destination;
   let reason=pending.get(captured.sourceId)??"";
   const expectedSaint=captured.saintId??null;
   if(!row&&!addition&&!alternative)reason=reason||"This source is no longer assigned in the current proposal.";
   if(!physicalRow||physicalRow.identityChanged||(physicalRow.saintId??null)!==expectedSaint||row&&(row.saintId??null)!==expectedSaint||placement&&(placement.saintId??null)!==expectedSaint||expectedSaint&&(!placement||placement.saintId!==expectedSaint))reason="Current source identity needs reconciliation.";
   if(placement?.linkIssue||placement?.placementState?.startsWith("Conflicting")||placement?.arrangementNeedsReview)reason="The current identity or saved arrangement needs review.";
   if(captured.sourceRevision&&physicalRow&&captured.sourceRevision!==physicalRow.sourceRevision)reason="Source data changed since these shelf recommendations; review the size and source interpretation.";
   if(captured.capturedBaseline&&placement){
    const check:ProposalObservation={sourceId:captured.sourceId,saintId:expectedSaint,name:captured.name,vitrine:destination??plan.code,tier:captured.tier??captured.capturedTier??"Tertiary",section:captured.capturedBaseline.section,sourceVitrine:"",sourceShelf:"",unresolved:false,allocationKind:"Shelf recommendation",share:null,state:"provisional",baseline:captured.capturedBaseline};
    const [reconciled]=reconcileSpnRoomProposal([check],current.placements,{acceptedBaseline:true});
    if(reconciled?.reviewReason&&reconciled.reviewReason!=="Current curator destination retained")reason=reconciled.reviewReason;
   }
   if(!reason&&destination!==plan.code)reason="The current curator destination differs from this captured shelf plan.";
   if(reason){reviewedChanges.push({sourceId:captured.sourceId,name:placement?.name??physicalRow?.name??captured.name,capturedDestination:plan.code,effectiveDestination:destination,reason,visibility:destination&&destination!==plan.code?"changed":"pending"});continue;}
   const tier=placement?(placement.tier==="Featured"?"Primary":placement.tier):row?.tier??captured.tier??captured.capturedTier??"Tertiary";
   const name=placement?.name??physicalRow?.name??row?.name??captured.name;
   const alerts=captured.reviewAlerts.filter(a=>!a.message.includes("is asserted by the current CMS record"));
   if(physicalRow?.movementBlockedReason&&!alerts.some(a=>a.message===physicalRow.movementBlockedReason))alerts.push({message:physicalRow.movementBlockedReason});
   allocations.push({...captured,name,tier,reviewAlerts:alerts});
   entries.push({sourceId:captured.sourceId,saintId:expectedSaint,name,tier,city:placement?.normalizedPlaces.join(" · ")??"",relicDescription:current.membersById.get(placement?.id??"")?.RelicsDescription??"",destination:plan.code,section:placement?.section??row?.section??"",family:placement?.curatorialFamily??"",rationale:"Shelf recommendation only",lifeStatus:undefined,currentLocation:physicalRow?.current??null,currentLocationBasis:physicalRow?.currentBasis,movementBlockedReason:physicalRow?.movementBlockedReason??undefined});
  }
  const lifeGuide:StarterMoveGuide={version:packet.version,title:"Shelf recommendations",contentDigest:"",assignmentDigest:"",proposalVersion:"",entries,vitrines:[],alternatives:[],reportedPlacements:[]};
  const liveEntries=projectCurrentGuideLifeStatus(lifeGuide,current,input.now).entries;
  const lifeById=new Map(liveEntries.map(e=>[e.sourceId,e.lifeStatus]));
  const lifeConflicts=new Set<string>();
  const currentAllocations=allocations.flatMap(a=>{
   const life=lifeById.get(a.sourceId);
   if(life?.tag&&a.suggestedShelfIndex===1){
    lifeConflicts.add(a.sourceId);
    reviewedChanges.push({sourceId:a.sourceId,name:a.name,capturedDestination:plan.code,effectiveDestination:plan.code,visibility:"pending",reason:"Current living-status evidence conflicts with the captured top position; review the starting shelf."});
    return [];
   }
   return [{...a,projectedLifeStatus:life}];
  });
  const ids=new Set(currentAllocations.map(a=>a.sourceId));
  const nodes=plan.contextNodes?.map(n=>({...n,label:/\bcms[a-z0-9]+\b/.test(n.label)?"Related figure · name to confirm":n.label}));
  const endpoints=new Set([...ids,...(nodes??[]).map(n=>n.id)]);
  return {...plan,title:`Vitrine ${plan.code}`,allocations:currentAllocations,groups:plan.groups.filter(g=>currentAllocations.some(a=>a.groupId===g.id)),relationships:plan.relationships.filter(r=>endpoints.has(r.fromSourceId)&&endpoints.has(r.toSourceId)),contextNodes:nodes,entries:liveEntries.filter(e=>!lifeConflicts.has(e.sourceId)),reviewedChanges,bandExceptions:(packet.exceptions??[]).filter(e=>e.code===plan.code)};
 });
 return {version:packet.version,mode:"recommendations_only",physicalActionsEnabled:false,cases,reviewedChanges:cases.flatMap(c=>c.reviewedChanges)};
}
