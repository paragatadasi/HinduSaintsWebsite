import {requireCapability} from "@/lib/admin-access";
import {hasCapability} from "@/lib/permissions";
import {getMuseumData} from "@/lib/museum-data";
import {SpnConnectedTraditions} from "@/components/admin/spn-connected-traditions";
import {SpnRoomExplorer} from "@/components/admin/spn-room-explorer";
import proposal from "@/data/museum/spn-room-proposal-v15.json";
import {reconcileSpnRoomProposal} from "@/lib/spn-room-proposal";
export default async function SpnMovePlan(){
 const user=await requireCapability("access_museum");await requireCapability("view_full_saint_catalog");
 const {sections,placements}=await getMuseumData();
 const {rows,namedOnly,...view}=proposal;
 return <div className="admin-stack"><header className="museum-layout-header"><div><p className="eyebrow">SPN museum</p><h1>Plan the move</h1><p>Explore the proposed room, review its connections, and compare with current curator decisions.</p></div></header>
 <SpnRoomExplorer proposal={view} rows={reconcileSpnRoomProposal([...rows,...namedOnly],placements)}/>
 <details className="museum-admin-panel"><summary>Connected traditions · original and saved arrangements</summary><SpnConnectedTraditions sections={sections.map(({name,slug,total})=>({name,slug,total}))} canEdit={hasCapability(user.roles,"manage_museum")}/></details></div>;
}
