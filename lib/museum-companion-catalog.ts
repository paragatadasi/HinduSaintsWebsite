import {currentCompanionAdditions} from "./museum-companion-addition-validation";
import proposalOverlay from "../data/museum/spn-approved-proposal-overlay-v1.json";
import {readEffectiveCompanionAdditions} from "./museum-companion-additions-state";
import {readGuideAlternativeDestinations} from "./museum-guide-alternatives";
import {db} from "./db";
import {readPhysicalLocationView} from "./museum-physical-locations";
import {readMuseumMoveSessionSource,registeredMoveProposal} from "./museum-move-session-source";
import {readMuseumData} from "./museum-working-data";
import {readCompanionAdditions} from "./museum-companion-additions";
import {SPN_REGION_GROUPS} from "./spn-region-navigation";
import {availableDeclineAlternatives} from "./museum-guide-decision-domain";
import {currentSpnProposalRelease} from "./spn-current-proposal";
import {isActiveSpnObservation} from "./spn-observation-suppression";
export async function readCompanionCatalog(){
 const [physical,data,additions]=await Promise.all([db.$transaction(tx=>readPhysicalLocationView(sourceTx=>readMuseumMoveSessionSource(registeredMoveProposal.version,sourceTx),tx,undefined,false),{isolationLevel:"RepeatableRead",timeout:60000}),readMuseumData(),readCompanionAdditions()]);
 const alternatives=await readGuideAlternativeDestinations();
 const effective=await readEffectiveCompanionAdditions();
 const valid=currentCompanionAdditions(effective,physical.rows);
 const placements=new Map(data.placements.filter(p=>p.sourceRecordId).map(p=>[p.sourceRecordId!,p]));
 return {additions:valid,vitrines:availableDeclineAlternatives(currentSpnProposalRelease.proposal.layout.vitrines),entries:physical.rows.filter(r=>isActiveSpnObservation(r.sourceId)&&!proposalOverlay.excludedFromMuseumDisplay.some(item=>item.sourceId===r.sourceId)).map(row=>{
  const placement=placements.get(row.sourceId),addition=valid.find(a=>a.sourceId===row.sourceId),alternative=alternatives.find(a=>a.sourceId===row.sourceId);
  return {...row,section:placement?.section??"",region:SPN_REGION_GROUPS.find(g=>(g.sections as readonly string[]).includes(placement?.section??""))?.title??"",tier:placement?.tier??"",city:placement?.normalizedPlaces.join(" · ")??"",searchNames:placement?.searchNames??[],destination:addition?.vitrine??alternative?.vitrine??row.proposalDestination?.code??"",destinationShelf:addition?addition.shelf??"":alternative?alternative.shelf??"":row.proposalDestination?.shelf??"",additionVersion:additions.find(a=>a.sourceId===row.sourceId)?.version??0};
 })};
}
