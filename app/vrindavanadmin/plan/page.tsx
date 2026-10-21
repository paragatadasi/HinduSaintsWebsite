import {readMuseumPlanVariants} from "@/lib/museum-plan-variants";
import {requireCapability} from "@/lib/admin-access";
import {hasCapability} from "@/lib/permissions";
import {readVrindavanMovePlanner} from "@/lib/museum-move-planner";
import {MuseumMovePlanner} from "@/components/admin/museum-move-planner";

export default async function VrindavanMovePlan(){
 await requireCapability("access_museum");
 const user=await requireCapability("view_full_saint_catalog");
 const [data,saved]=await Promise.all([readVrindavanMovePlanner(),readMuseumPlanVariants(user.id)]);
 const variants={revision:saved.revision,activeId:saved.activeId,initialized:saved.initialized,variants:saved.variants.map(({rows,areas,sourceFingerprint,...summary})=>summary)};
 return <MuseumMovePlanner data={data} variants={variants} canEdit={hasCapability(user.roles,"manage_museum")}/>;
}
