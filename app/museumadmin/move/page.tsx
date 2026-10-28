import {requireCapability} from "@/lib/admin-access";
import {hasCapability} from "@/lib/permissions";
import {starterMoveGuide} from "@/lib/spn-starter-move-guide";
import {readMuseumPhysicalLocations} from "@/lib/museum-physical-locations";
import {readMuseumMoveSessionSource,registeredMoveProposal} from "@/lib/museum-move-session-source";
import {SpnRoomMoveCompanion} from "@/components/admin/spn-room-move-companion";
import {getMuseumData} from "@/lib/museum-data";
import {projectStarterDisplayTiers} from "@/lib/spn-live-display-tiers";
import {projectDattaGuide} from "@/lib/spn-datta-guide";
export default async function SpnMoveCompanionPage({searchParams}:{searchParams:Promise<{phase?:string}>}){
 await requireCapability("access_museum");
 const user=await requireCapability("view_museum_catalog");
 const [physical,current]=await Promise.all([readMuseumPhysicalLocations(tx=>readMuseumMoveSessionSource(registeredMoveProposal.version,tx)),getMuseumData()]);
 const datta=(await searchParams).phase==="datta";
 const guide=datta?projectDattaGuide(current.placements,physical):projectStarterDisplayTiers(starterMoveGuide,current.placements);
 return <SpnRoomMoveCompanion key={guide.version} guide={guide} initialPhysical={physical} allowClear={!datta} phaseLabel={datta?"Datta · 3, 81 & 82":"Starter row"} phase={datta?"datta":"starter"} canManage={hasCapability(user.roles,"manage_museum")}/>;
}
