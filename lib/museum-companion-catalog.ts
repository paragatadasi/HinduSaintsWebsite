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

function projectCatalog(snapshot:MuseumCompanionReadSnapshot){
 const {current:data,physical,additions,alternatives,valid,destinations,review:reviewed}=snapshot;
 const placements=new Map(data.placements.filter(p=>p.sourceRecordId).map(p=>[p.sourceRecordId!,p]));
 const pendingTransfer=regionalPendingTransfer(data.placements,physical.rows,destinations,
  reviewed.proposal.pendingPlacements.find(p=>regionalPendingSourceIds.includes(p.sourceId))?.previousVitrine);
 const bySource=new Map(reviewed.rows.map(row=>[row.sourceId,row]));
 const pendingBySource=new Map(reviewed.proposal.pendingPlacements.map(row=>[row.sourceId,row]));
 const additionsBySource=new Map(additions.map(row=>[row.sourceId,row]));
 const validBySource=new Map(valid.map(row=>[row.sourceId,row]));
 const alternativesBySource=new Map(alternatives.map(row=>[row.sourceId,row]));
 const lifeEntries=projectCurrentGuideLifeStatus({entries:physical.rows.map(row=>({sourceId:row.sourceId,saintId:row.saintId,name:row.name,tier:"",city:"",relicDescription:"",destination:"",section:"",family:"",rationale:""}))},data).entries;
 const lifeBySource=new Map(lifeEntries.map(row=>[row.sourceId,row.lifeStatus]));
 return {revision:snapshot.revision,additions:valid,vitrines:availableDeclineAlternatives(currentSpnProposalRelease.proposal.layout.vitrines),entries:physical.rows.filter(r=>isActiveSpnObservation(r.sourceId)&&!proposalOverlay.excludedFromMuseumDisplay.some(item=>item.sourceId===r.sourceId)).map(row=>{
  const placement=placements.get(row.sourceId),addition=validBySource.get(row.sourceId),alternative=alternativesBySource.get(row.sourceId);
  const proposalTransfer=pendingTransfer?.sourceId===row.sourceId?pendingTransfer:null;
  const planningContext=paramanandPlanningContext({source:row,placement,effectiveDestination:addition?.vitrine??alternative?.vitrine??bySource.get(row.sourceId)?.effectiveVitrine??null,
   pendingReason:pendingBySource.get(row.sourceId)?.reason});
  const allocationPending=auditedPendingAllocations[row.sourceId]&&pendingBySource.has(row.sourceId)&&!addition&&!alternative?{reason:pendingBySource.get(row.sourceId)!.reason}:null;
  return {...row,allocationPending,componentScope:addition?.componentScope,proposalTransfer,lifeStatus:lifeBySource.get(row.sourceId),section:placement?.section??"",region:SPN_REGION_GROUPS.find(g=>(g.sections as readonly string[]).includes(placement?.section??""))?.title??"",tier:placement?.tier??"",city:placement?.normalizedPlaces.join(" · ")??"",searchNames:placement?.searchNames??[],destination:allocationPending?"":planningContext?planningContext.effectiveDestination??"":addition?.vitrine??alternative?.vitrine??bySource.get(row.sourceId)?.effectiveVitrine??"",destinationShelf:allocationPending||proposalTransfer?"":addition?addition.shelf??"":alternative?alternative.shelf??"":planningContext?"":row.proposalDestination?.shelf??"",additionVersion:additionsBySource.get(row.sourceId)?.version??0,...(planningContext?{planningContext}: {})};
 })};
}

const catalogs=new WeakMap<MuseumCompanionReadSnapshot,ReturnType<typeof projectCatalog>>();
export async function readCompanionCatalogIfChanged(knownRevisions:string[]=[]){
 const revision=await readSharedMuseumCompanionRevision();
 const tag=companionResourceRevision(revision,"catalog");
 if(knownRevisions.includes(tag))return {changed:false as const,revision:tag};
 const snapshot=await readSharedMuseumCompanionSnapshot();
 const actualTag=companionResourceRevision(snapshot.revision,"catalog");
 if(knownRevisions.includes(actualTag))return {changed:false as const,revision:actualTag};
 let data=catalogs.get(snapshot);if(!data){data=projectCatalog(snapshot);catalogs.set(snapshot,data);}
 return {changed:true as const,revision:actualTag,data};
}
export async function readCompanionCatalog(){
 const result=await readCompanionCatalogIfChanged();
 if(!result.changed)throw new Error("A catalog read without a known revision must return data.");
 return result.data;
}
