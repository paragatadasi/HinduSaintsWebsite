import packet from "../data/museum/spn-bilash-provisional-followup-v1.json";
import type { MuseumSaintPlacement } from "./museum-proposals";
import { reconcileSpnRoomProposal, type ProposalObservation } from "./spn-room-proposal";
import type { StarterMoveGuide } from "./spn-move-guide";
import { MuseumMoveSessionError } from "./museum-move-session-domain";

export const bilashFollowup = packet;
export function resolveBilashFollowup(current: MuseumSaintPlacement[]) {
  const matches=current.filter(row=>row.id===packet.capturedBaseline.placementId && row.sourceRecordId===packet.sourceId);
  const live=matches.length===1?matches[0]:null;
  const base={sourceId:packet.sourceId,saintId:packet.saintId,qualifier:packet.qualifier};
  if(!live||live.saintId!==packet.saintId||live.linkIssue||live.placementState?.startsWith("Conflicting")||live.arrangementNeedsReview)
    return {...base,destination:null,status:"needs_review" as const,reason:"Current source identity or arrangement needs reconciliation."};
  const saved=live.arrangement;
  if(saved?.vitrine&&["Planned","Implemented"].includes(saved.status)&&saved.revision!==packet.capturedBaseline.revision)
    return {...base,destination:saved.vitrine,status:"newer_curator_destination_retained" as const,reason:"Newer curator destination retained."};
  const row:ProposalObservation={sourceId:packet.sourceId,saintId:packet.saintId,name:packet.name,vitrine:packet.destination,
    tier:packet.capturedBaseline.tier,section:packet.capturedBaseline.section,sourceVitrine:"22",sourceShelf:"C",unresolved:true,
    allocationKind:packet.qualifier,share:null,state:"provisional_followup",baseline:packet.capturedBaseline};
  const [result]=reconcileSpnRoomProposal([row],current,{acceptedBaseline:true});
  return {...base,destination:result.reviewReason?null:packet.destination,status:result.reviewReason?"needs_review" as const:"provisional" as const,
    reason:result.reviewReason||packet.qualifier};
}

export function applyBilashFollowup<T extends ProposalObservation>(rows:T[],current:MuseumSaintPlacement[]):T[] {
  const resolution=resolveBilashFollowup(current);
  return rows.map(row=>row.sourceId!==packet.sourceId||row.saintId!==packet.saintId||resolution.status==="needs_review"?row:
    {...row,vitrine:packet.destination,baseline:packet.capturedBaseline,allocationKind:packet.qualifier});
}

// The immutable guide context and its captured destination remain historical.
export function projectBilashGuideFollowup(guide:StarterMoveGuide,current:MuseumSaintPlacement[]) {
  const resolution=resolveBilashFollowup(current);
  return {...guide,bilashFollowup:resolution,entries:guide.entries.map(entry=>entry.sourceId!==packet.sourceId?entry:{...entry,
    reviewNotes:[...(entry.reviewNotes??[]),packet.qualifier],
    movementBlockedReason:entry.destination==="57"&&resolution.destination!=="57"
      ?"This captured destination is superseded. Review the provisional Vitrine 29 follow-up or the newer curator destination."
      :entry.movementBlockedReason})};
}

export function assertBilashGuideTarget(records:{sourceId:string;to:{kind:string;code:string}}[],current:MuseumSaintPlacement[]) {
  if(records.some(row=>row.sourceId===packet.sourceId&&row.to.kind==="vitrine"&&row.to.code==="57")&&resolveBilashFollowup(current).destination!=="57")
    throw new MuseumMoveSessionError(409,"This source's captured Vitrine 57 destination is superseded. Open the current follow-up before recording a move.");
}
