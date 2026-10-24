import {requireCapability} from "@/lib/admin-access";
import {hasCapability} from "@/lib/permissions";
import {getMuseumData} from "@/lib/museum-data";
import {SpnConnectedTraditions} from "@/components/admin/spn-connected-traditions";
export default async function SpnMovePlan(){
 const user=await requireCapability("access_museum");await requireCapability("view_full_saint_catalog");
 const {sections}=await getMuseumData();
 return <div className="admin-stack"><header className="museum-layout-header"><div><p className="eyebrow">SPN museum</p><h1>Plan the move</h1><p>Start with the connections between traditions. Explore arrangements and save views to compare with the team.</p></div></header><SpnConnectedTraditions sections={sections.map(({name,slug,total})=>({name,slug,total}))} canEdit={hasCapability(user.roles,"manage_museum")}/></div>;
}
