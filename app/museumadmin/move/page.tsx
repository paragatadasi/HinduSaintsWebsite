import {requireCapability} from "@/lib/admin-access";
import {hasCapability} from "@/lib/permissions";
import {starterMoveGuide} from "@/lib/spn-starter-move-guide";
import {readMuseumPhysicalLocations} from "@/lib/museum-physical-locations";
import {readMuseumMoveSessionSource,registeredMoveProposal} from "@/lib/museum-move-session-source";
import {SpnRoomMoveCompanion} from "@/components/admin/spn-room-move-companion";
import {getMuseumData} from "@/lib/museum-data";
import {projectStarterDisplayTiers} from "@/lib/spn-live-display-tiers";
export default async function SpnMoveCompanionPage(){
 await requireCapability("access_museum");
 const user=await requireCapability("view_museum_catalog");
 const [physical,current]=await Promise.all([readMuseumPhysicalLocations(tx=>readMuseumMoveSessionSource(registeredMoveProposal.version,tx)),getMuseumData()]);
 return <SpnRoomMoveCompanion guide={projectStarterDisplayTiers(starterMoveGuide,current.placements)} initialPhysical={physical} canManage={hasCapability(user.roles,"manage_museum")}/>;
}
