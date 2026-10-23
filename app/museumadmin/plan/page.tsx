import {requireCapability} from "@/lib/admin-access";
import {spnMuseumLayout} from "@/lib/spn-museum-layout";
import {readSpnLayoutInventory} from "@/lib/spn-layout-inventory";
import {MuseumLayoutWorkspace} from "@/components/admin/museum-layout-workspace";

export default async function SpnMovePlan(){
 await requireCapability("access_museum");
 await requireCapability("view_full_saint_catalog");
 const inventory=await readSpnLayoutInventory();
 return <MuseumLayoutWorkspace layout={spnMuseumLayout} {...inventory}/>;
}
