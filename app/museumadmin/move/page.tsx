import {maharashtraReceivingGuide} from "@/lib/spn-maharashtra-receiving-guide";
import {readApprovedReceivingGuide} from "@/lib/museum-approved-receiving-source";
import {approvedHingeGuide} from "@/lib/spn-approved-hinge-guide";
import {readSouthernGuide} from "@/lib/spn-southern-source";
import {readWest40To44Guide} from "@/lib/spn-west40-44-source";
import {readJunagadhGuide} from "@/lib/spn-junagadh-source";
import {readWestV59Guide} from "@/lib/spn-west-v59-source";
import {readWestV46Guide} from "@/lib/spn-west-v46-source";
import {readWestV1Guide} from "@/lib/spn-west-v1-source";
import {readWestV45Guide} from "@/lib/spn-west-v45-source";
import {readEastRemainderGuide} from "@/lib/spn-east-remainder-source";
import {readVrajRemainderGuide} from "@/lib/spn-vraj-remainder-source";
import {projectBilashGuideFollowup} from "@/lib/spn-bilash-followup";
import {projectNorthernGuide,removeSupersededNorthernSuggestions} from "@/lib/spn-northern-guide";
import {readGuideAlternativeDestinations} from "@/lib/museum-guide-alternatives";
import {spnDisplayTones} from "@/lib/spn-display-regions";
import {projectVrajGuide} from "@/lib/spn-vraj-guide";
import {projectRamakrishnaGuide} from "@/lib/spn-ramakrishna-guide";
import type {StarterMoveGuide} from "@/lib/spn-move-guide";
import {projectCurrentGuideLifeStatus} from "@/lib/museum-guide-life-status";
import {requireCapability} from "@/lib/admin-access";
import {hasCapability} from "@/lib/permissions";
import {starterMoveGuide} from "@/lib/spn-starter-move-guide";
import {readMuseumPhysicalLocations} from "@/lib/museum-physical-locations";
import {readMuseumMoveSessionSource,registeredMoveProposal} from "@/lib/museum-move-session-source";
import {StreamedMoveCompanion,type GuideLoadResult} from "@/components/admin/streamed-move-companion";
import type {CompanionPhase} from "@/lib/museum-companion-navigation";
import {getMuseumData} from "@/lib/museum-data";
import {projectStarterDisplayTiers} from "@/lib/spn-live-display-tiers";
import {projectRamBhaktiGuide} from "@/lib/spn-ram-bhakti-guide";
import {projectDattaGuide} from "@/lib/spn-datta-guide";
export default async function SpnMoveCompanionPage({searchParams}:{searchParams:Promise<{phase?:string}>}){
 await requireCapability("access_museum");
 const user=await requireCapability("view_museum_catalog");
 const [physical,current,alternatives]=await Promise.all([readMuseumPhysicalLocations(tx=>readMuseumMoveSessionSource(registeredMoveProposal.version,tx)),getMuseumData(),readGuideAlternativeDestinations()]);
 const requested=(await searchParams).phase;
 const phase=requested==="maharashtra"||requested==="hinge"||requested==="south"||requested==="west40-44"||requested==="saurashtra"||requested==="west47"||requested==="west46"||requested==="west1"||requested==="west45"||requested==="east2"||requested==="vraj2"||requested==="north"||requested==="vraj"||requested==="gosaiji-sai"||requested==="datta"||requested==="ram-bhakti"?requested:"starter";
 const pending:Record<CompanionPhase,Promise<StarterMoveGuide>>={
  maharashtra:readApprovedReceivingGuide(maharashtraReceivingGuide,current,physical,alternatives),
  hinge:readApprovedReceivingGuide(approvedHingeGuide,current,physical,alternatives),
  south:readSouthernGuide(current,physical,alternatives),
  "west40-44":readWest40To44Guide(current,physical,alternatives),
  saurashtra:readJunagadhGuide(current,physical,alternatives),west47:readWestV59Guide(current,physical,alternatives),
  west46:readWestV46Guide(current,physical,alternatives),west1:readWestV1Guide(current,physical,alternatives),
  west45:readWestV45Guide(current,physical,alternatives),east2:readEastRemainderGuide(current,physical,alternatives),
  vraj2:readVrajRemainderGuide(current,physical,alternatives),
  north:Promise.resolve(projectNorthernGuide(current.placements,physical)),
  vraj:Promise.resolve(projectVrajGuide(current.placements,physical)),
  starter:Promise.resolve(projectBilashGuideFollowup(projectStarterDisplayTiers(starterMoveGuide,current.placements),current.placements)),
  datta:Promise.resolve(projectDattaGuide(current.placements,physical)),
  "ram-bhakti":Promise.resolve(projectRamBhaktiGuide(current.placements,physical)),
  "gosaiji-sai":Promise.resolve(projectRamakrishnaGuide(current.placements,physical))
 };
 for(const key of Object.keys(pending) as CompanionPhase[])pending[key]=pending[key].then(guide=>projectCurrentGuideLifeStatus(
  ["starter","datta","ram-bhakti","gosaiji-sai","vraj"].includes(key)?removeSupersededNorthernSuggestions(guide):guide,current));
 const pendingGuides:Promise<GuideLoadResult>=Promise.all(Object.entries(pending).map(async([key,value])=>[key,await value] as const))
  .then(entries=>({guides:Object.fromEntries(entries) as Record<CompanionPhase,StarterMoveGuide>}))
  .catch(error=>{console.error("Museum background guides failed",error);return {error:"Other museum rows could not load."};});
 const guide=await pending[phase];
 return <StreamedMoveCompanion pendingGuides={pendingGuides} initialAlternatives={alternatives} roomTones={spnDisplayTones} guide={guide} initialPhysical={physical} allowClear={guide.allowClear??phase==="starter"} phaseLabel={guide.phaseLabel??"Starter row"} phase={phase} canConfirmPlacements={hasCapability(user.roles,"confirm_museum_placements")} canManage={hasCapability(user.roles,"manage_museum")}/>;
}
