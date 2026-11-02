import {isFinallyReviewed} from "./museum-final-review-domain";
import type {FinalReviewDecision} from "./museum-final-review-domain";
import {db} from "./db";
import {auditedPendingAllocations} from "./spn-audited-pending-allocation";
import {projectCurrentGuideLifeStatus} from "./museum-guide-life-status";
import proposalOverlay from "../data/museum/spn-approved-proposal-overlay-v1.json";
import {SPN_REGION_GROUPS} from "./spn-region-navigation";
import {availableDeclineAlternatives} from "./museum-guide-decision-domain";
import {currentSpnProposalRelease} from "./spn-current-proposal";
import {isActiveSpnObservation} from "./spn-observation-suppression";
import {paramanandPlanningContext} from "./spn-paramanand-planning-context";
import {regionalPendingTransfer,regionalPendingSourceIds} from "./spn-regional-pending-transfers";
import {readSharedMuseumCompanionRevision,readSharedMuseumCompanionSnapshot,type MuseumCompanionReadSnapshot} from "./museum-companion-read-snapshot";
import {companionResourceRevision} from "./museum-companion-read-revision";

export function projectCatalog(snapshot:MuseumCompanionReadSnapshot,sourceId?:string){
 const {current:data,physical,additions,alternatives,valid,destinations,review:reviewed}=snapshot;
 const placements=new Map(data.placements.filter(p=>p.sourceRecordId).map(p=>[p.sourceRecordId!,p]));
 const pendingTransfer=regionalPendingTransfer(data.placements,physical.rows,destinations,
  reviewed.proposal.pendingPlacements.find(p=>regionalPendingSourceIds.includes(p.sourceId))?.previousVitrine);
 const bySource=new Map(reviewed.rows.map(row=>[row.sourceId,row]));
 const pendingBySource=new Map(reviewed.proposal.pendingPlacements.map(row=>[row.sourceId,row]));
 const additionsBySource=new Map(additions.map(row=>[row.sourceId,row]));
 const validBySource=new Map(valid.map(row=>[row.sourceId,row]));
 const confirmedBySource=new Map(snapshot.confirmedDestinations.map(row=>[row.sourceId,row]));
 const alternativesBySource=new Map(alternatives.map(row=>[row.sourceId,row]));
 const lifeEntries=projectCurrentGuideLifeStatus({entries:physical.rows.map(row=>({sourceId:row.sourceId,saintId:row.saintId,name:row.name,tier:"",city:"",relicDescription:"",destination:"",section:"",family:"",rationale:""}))},data).entries;
 const lifeBySource=new Map(lifeEntries.map(row=>[row.sourceId,row.lifeStatus]));
 return {revision:snapshot.revision,finalReviewProposals:snapshot.finalReviewProposals,finalReviewDecisions:snapshot.finalReviewStates.map((state):FinalReviewDecision=>({...state,decision:state.decision as FinalReviewDecision["decision"],plannedAt:state.plannedAt?.toISOString()??null,decisionAt:state.decisionAt?.toISOString()??null})),additions:valid,vitrines:availableDeclineAlternatives(currentSpnProposalRelease.proposal.layout.vitrines),entries:physical.rows.filter(r=>(!sourceId||r.sourceId===sourceId)&&isActiveSpnObservation(r.sourceId)&&!proposalOverlay.excludedFromMuseumDisplay.some(item=>item.sourceId===r.sourceId)).map(row=>{
  const placement=placements.get(row.sourceId),addition=validBySource.get(row.sourceId),alternative=alternativesBySource.get(row.sourceId);
  const confirmedDestination=confirmedBySource.get(row.sourceId)??null;
  const finalReview=snapshot.finalReviewProposals.find(plan=>plan.sourceId===row.sourceId)??null;
  const proposalTransfer=!confirmedDestination&&pendingTransfer?.sourceId===row.sourceId?pendingTransfer:null;
  const planningContext=paramanandPlanningContext({source:row,placement,effectiveDestination:addition?.vitrine??alternative?.vitrine??bySource.get(row.sourceId)?.effectiveVitrine??null,
   pendingReason:pendingBySource.get(row.sourceId)?.reason});
  const allocationPending=!confirmedDestination&&auditedPendingAllocations[row.sourceId]&&pendingBySource.has(row.sourceId)?{reason:pendingBySource.get(row.sourceId)!.reason}:null;
  return {...row,allocationPending,confirmedDestination,finalReview,destinationBasis:confirmedDestination?"confirmed" as const:finalReview?"final_review" as const:"proposal" as const,componentScope:confirmedDestination?.componentScope??addition?.componentScope,proposalTransfer,lifeStatus:lifeBySource.get(row.sourceId),section:placement?.section??"",region:SPN_REGION_GROUPS.find(g=>(g.sections as readonly string[]).includes(placement?.section??""))?.title??"",tier:placement?.tier??"",city:placement?.normalizedPlaces.join(" · ")??"",relicDescription:data.membersById.get(placement?.id??"")?.RelicsDescription??"",searchNames:placement?.searchNames??[],destination:confirmedDestination?confirmedDestination.vitrine:allocationPending?"":finalReview?finalReview.vitrine:planningContext?planningContext.effectiveDestination??"":addition?.vitrine??alternative?.vitrine??bySource.get(row.sourceId)?.effectiveVitrine??"",destinationShelf:confirmedDestination?confirmedDestination.shelf??"":allocationPending||proposalTransfer?"":finalReview?finalReview.shelf??"":addition?addition.shelf??"":alternative?alternative.shelf??"":planningContext?"":row.proposalDestination?.shelf??"",additionVersion:additionsBySource.get(row.sourceId)?.version??0,...(planningContext?{planningContext}: {})};
 })};
}

const catalogs=new WeakMap<MuseumCompanionReadSnapshot,ReturnType<typeof projectCatalog>>();
export async function readCompanionCatalogIfChanged(knownRevisions:string[]=[]){
 const [revision,reviewRevision]=await Promise.all([readSharedMuseumCompanionRevision(),db.museumFinalReviewRevision.findUnique({where:{museumId:"museum-spn"}})]);
 const counter=String(reviewRevision?.revision??0n);
 const tag=companionResourceRevision(revision,"catalog:"+counter);
 if(knownRevisions.includes(tag))return {changed:false as const,revision:tag};
 const snapshot=await readSharedMuseumCompanionSnapshot();
 const actualTag=companionResourceRevision(snapshot.revision,"catalog:"+counter);
 if(knownRevisions.includes(actualTag))return {changed:false as const,revision:actualTag};
 let data=catalogs.get(snapshot);if(!data){data=projectCatalog(snapshot);catalogs.set(snapshot,data);}
 const versions=await db.museumFinalReviewState.findMany({where:{museumId:"museum-spn"}});
 const bySource=new Map(versions.map(row=>[row.sourceId,row.version]));
 const finalReviewProposals=data.finalReviewProposals.map(row=>({...row,reviewVersion:bySource.get(row.sourceId)??row.version}));
 const states=new Map(versions.map(row=>[row.sourceId,row]));
 const entries=data.entries.map(row=>{
  const state=states.get(row.sourceId);
  const bound=state?.sourceRevision===row.sourceRevision&&state.saintId===row.saintId?state:null;
  return {...row,finallyReviewed:isFinallyReviewed(row,row.destination||null,bound),finalReview:finalReviewProposals.find(plan=>plan.sourceId===row.sourceId)??null};
 });
 const finalReviewDecisions=versions.flatMap(state=>{
  const entry=entries.find(row=>row.sourceId===state.sourceId&&row.saintId===state.saintId&&row.sourceRevision===state.sourceRevision);
  return entry?[{sourceId:state.sourceId,saintId:state.saintId,sourceRevision:state.sourceRevision,planVersion:state.planVersion,vitrine:state.vitrine,shelf:state.shelf,plannedAt:state.plannedAt?.toISOString()??null,decision:state.decision as FinalReviewDecision["decision"],decisionAt:state.decisionAt?.toISOString()??null,decisionNote:state.decisionNote,finallyReviewed:entry.finallyReviewed}]:[];
 });
 const projected={...data,reviewRevision:counter,finalReviewProposals,finalReviewDecisions,entries};
 return {changed:true as const,revision:actualTag,data:projected};
}
export async function readCompanionCatalog(){
 const result=await readCompanionCatalogIfChanged();
 if(!result.changed)throw new Error("A catalog read without a known revision must return data.");
 return result.data;
}
