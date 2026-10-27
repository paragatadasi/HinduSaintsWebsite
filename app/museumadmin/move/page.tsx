import {requireCapability} from "@/lib/admin-access";
import proposal from "@/data/museum/spn-room-proposal-final-v8.json";
import {readSpnMoveSnapshot} from "@/lib/spn-room-move-reader";
import {SpnRoomMoveCompanion} from "@/components/admin/spn-room-move-companion";

export default async function SpnMoveCompanionPage(){
 await requireCapability("access_museum");
 await requireCapability("view_museum_catalog");
 const snapshot=await readSpnMoveSnapshot(proposal.version);
 return <SpnRoomMoveCompanion {...snapshot}/>;
}
