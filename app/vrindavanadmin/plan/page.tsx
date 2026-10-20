import {requireCapability} from "@/lib/admin-access";
import {hasCapability} from "@/lib/permissions";
import {readVrindavanMovePlanner} from "@/lib/museum-move-planner";
import {MuseumMovePlanner} from "@/components/admin/museum-move-planner";

export default async function VrindavanMovePlan(){
 await requireCapability("access_museum");
 const user=await requireCapability("view_full_saint_catalog");
 const data=await readVrindavanMovePlanner();
 return <MuseumMovePlanner data={data} canEdit={hasCapability(user.roles,"manage_museum")}/>;
}
