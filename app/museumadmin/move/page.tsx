import {requireCapability} from "@/lib/admin-access";
import {hasCapability} from "@/lib/permissions";
import {starterMoveGuide} from "@/lib/spn-starter-move-guide";
import {readMuseumPhysicalLocations} from "@/lib/museum-physical-locations";
import {readMuseumMoveSessionSource,registeredMoveProposal} from "@/lib/museum-move-session-source";
import {SpnRoomMoveCompanion} from "@/components/admin/spn-room-move-companion";
export default async function SpnMoveCompanionPage(){
 await requireCapability("access_museum");
 const user=await requireCapability("view_museum_catalog");
 const physical=await readMuseumPhysicalLocations(tx=>readMuseumMoveSessionSource(registeredMoveProposal.version,tx));
 return <SpnRoomMoveCompanion guide={starterMoveGuide} initialPhysical={physical} canManage={hasCapability(user.roles,"manage_museum")}/>;
}
