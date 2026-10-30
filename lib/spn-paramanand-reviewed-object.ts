import packet from "../data/museum/spn-paramanand-reviewed-arm-support-v1.json";
import type {MuseumSaintPlacement} from "./museum-proposals";
import {reconcileSpnRoomProposal,type ProposalObservation} from "./spn-room-proposal";
export const paramanandObjectReview=packet;
export type ReviewedHousingSource={sourceId:string;saintId:string|null;sourceRevision:string;identityChanged:boolean;housingEvidenceRevision?:string};
export function isReviewedParamanandArmSupport(source?:ReviewedHousingSource){
 return !!source&&source.sourceId===packet.sourceId&&source.saintId===packet.saintId&&source.sourceRevision===packet.sourceRevision&&source.housingEvidenceRevision===packet.housingEvidenceRevision&&!source.identityChanged;
}
export function paramanandProposalResolution(current:MuseumSaintPlacement[]){
 const matches=current.filter(p=>p.id===packet.capturedBaseline.placementId&&p.sourceRecordId===packet.sourceId);
 const live=matches.length===1?matches[0]:null;
 if(!live||live.saintId!==packet.saintId||live.sourceHousingEvidenceRevision!==packet.housingEvidenceRevision||live.linkIssue||live.placementState?.startsWith("Conflicting")||live.arrangementNeedsReview)return {destination:null,reason:"Current source identity, housing evidence or arrangement needs reconciliation."};
 const proposal:ProposalObservation={sourceId:packet.sourceId,saintId:packet.saintId,name:live.name,vitrine:packet.destination,tier:packet.capturedBaseline.tier,section:packet.capturedBaseline.section,sourceVitrine:"20",sourceShelf:"B",unresolved:false,allocationKind:"Reviewed complete yoga-patta arm-support; Puri display",share:null,state:"reviewed_arm_support",baseline:packet.capturedBaseline};
 const [row]=reconcileSpnRoomProposal([proposal],current,{acceptedBaseline:true});
 if(row.reviewReason&&row.reviewReason!=="Current curator destination retained")return {destination:null,reason:row.reviewReason};
 return {destination:row.effectiveVitrine,reason:row.reviewReason||packet.fitNote};
}
export function applyParamanandObjectProposal<T extends ProposalObservation>(rows:T[],current:MuseumSaintPlacement[]):T[]{
 if(!paramanandProposalResolution(current).destination)return rows;
 return rows.map(row=>row.sourceId!==packet.sourceId||row.saintId!==packet.saintId?row:{...row,vitrine:packet.destination,baseline:packet.capturedBaseline,unresolved:false,allocationKind:"Reviewed complete yoga-patta arm-support; check fit in the Puri display"});
}
