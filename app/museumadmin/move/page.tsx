import {requireCapability} from "@/lib/admin-access";
import {hasCapability} from "@/lib/permissions";
import {starterMoveGuide} from "@/lib/spn-starter-move-guide";
import {readMuseumPhysicalLocations} from "@/lib/museum-physical-locations";
import {readMuseumMoveSessionSource,registeredMoveProposal} from "@/lib/museum-move-session-source";
import {SpnRoomMoveCompanion} from "@/components/admin/spn-room-move-companion";
import {getMuseumData} from "@/lib/museum-data";
import {projectStarterDisplayTiers} from "@/lib/spn-live-display-tiers";
import {projectRamBhaktiGuide} from "@/lib/spn-ram-bhakti-guide";
import {projectDattaGuide} from "@/lib/spn-datta-guide";
export default async function SpnMoveCompanionPage({searchParams}:{searchParams:Promise<{phase?:string}>}){
 await requireCapability("access_museum");
 const user=await requireCapability("view_museum_catalog");
 const [physical,current]=await Promise.all([readMuseumPhysicalLocations(tx=>readMuseumMoveSessionSource(registeredMoveProposal.version,tx)),getMuseumData()]);
 const requested=(await searchParams).phase;
 const phase=requested==="datta"||requested==="ram-bhakti"?requested:"starter";
 const phaseGuides={starter:projectStarterDisplayTiers(starterMoveGuide,current.placements),datta:projectDattaGuide(current.placements,physical),"ram-bhakti":projectRamBhaktiGuide(current.placements,physical)};
 const guide=phaseGuides[phase];
 return <SpnRoomMoveCompanion phaseGuides={phaseGuides} guide={guide} initialPhysical={physical} allowClear={phase==="starter"} phaseLabel={guide.phaseLabel??"Starter row"} phase={phase} canManage={hasCapability(user.roles,"manage_museum")}/>;
}
