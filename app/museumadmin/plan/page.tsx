import {buildLatestSpnReview} from "@/lib/spn-reviewed-proposal";
import Link from "next/link";
import {currentSpnProposalRelease} from "@/lib/spn-current-proposal";
import {requireCapability} from "@/lib/admin-access";
import {hasCapability} from "@/lib/permissions";
import {getMuseumData} from "@/lib/museum-data";
import {SpnConnectedTraditions} from "@/components/admin/spn-connected-traditions";
import {SpnRoomExplorer} from "@/components/admin/spn-room-explorer";
import designData from "@/data/museum/spn-room-explorer-design.json";
import proposal from "@/data/museum/spn-room-proposal-v15.json";
import proposalV16 from "@/data/museum/spn-room-proposal-v16.json";
import designV16 from "@/data/museum/spn-room-explorer-v16-design.json";
import proposalV16R1 from "@/data/museum/spn-room-proposal-v16-r1.json";
import designV16R1 from "@/data/museum/spn-room-explorer-v16-r1-design.json";
import proposalEast from "@/data/museum/spn-room-proposal-east-v2.json";
import designEast from "@/data/museum/spn-room-explorer-east-v2-design.json";
import proposalVraj from "@/data/museum/spn-room-proposal-vraj-girnar-v1.json";
import designVraj from "@/data/museum/spn-room-explorer-vraj-girnar-v1-design.json";
import {reconcileSpnRoomProposal} from "@/lib/spn-room-proposal";
import proposalSikh from "@/data/museum/spn-room-proposal-sikh-north-v1.json";
import designSikh from "@/data/museum/spn-room-explorer-sikh-north-v1-design.json";
import {correctSpnProposal} from "@/lib/spn-proposal-corrections";
import {projectCurrentPrimaryAnchors} from "@/lib/spn-live-display-tiers";
export default async function SpnMovePlan(){
 const user=await requireCapability("access_museum");await requireCapability("view_museum_catalog");
 const {sections,placements}=await getMuseumData();
 const releases=[currentSpnProposalRelease,{proposal:proposalV16R1,designData:designV16R1},{proposal:proposalVraj,designData:designVraj},{proposal:proposalSikh,designData:designSikh},{proposal:proposalEast,designData:designEast},{proposal:proposalV16,designData:designV16},{proposal,designData}].map(correctSpnProposal).map(({proposal,designData,...releasePolicy})=>{
  const {rows,namedOnly,...view}=proposal;
  const acceptedBaseline="acceptedBaseline" in releasePolicy&&releasePolicy.acceptedBaseline===true;
  const reconciled=reconcileSpnRoomProposal([...rows,...namedOnly],placements,{acceptedBaseline});
  return {proposal:view,designData:acceptedBaseline?{...designData,options:designData.options.map(option=>projectCurrentPrimaryAnchors(option,reconciled))}:designData,rows:reconciled};
 });
 releases.unshift(buildLatestSpnReview(placements));
 return <div className="admin-stack">
 <div className="review-actions"><Link className="museum-admin-button museum-admin-button--secondary" href="/museumadmin/move" prefetch={false}>Move companion</Link></div>
 <SpnRoomExplorer releases={releases}/>
 <details className="museum-admin-panel"><summary>Connected traditions · original and saved arrangements</summary><SpnConnectedTraditions sections={sections.map(({name,slug,total})=>({name,slug,total}))} canEdit={hasCapability(user.roles,"manage_museum")}/></details></div>;
}
