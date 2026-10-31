import packet from "../data/museum/spn-approved-regional-pending-transfers-v1.json";
import type {MuseumSaintPlacement} from "./museum-proposals";
import type {CompanionRow} from "./spn-move-guide";

export type RegionalPendingTransfer = {
 version:string;sourceId:string;state:"approved_case_pending";region:string;cohort:string;
 label:string;reason:string;approvedDate:string;supersededDestination:string;
};
type Source = Pick<CompanionRow,"sourceId"|"saintId"|"sourceRevision"|"identityChanged">;
type Destination = {sourceId:string;vitrine:string};

export function regionalPendingTransfer(current:MuseumSaintPlacement[],sources:Source[],overrides:Destination[],effectiveDestination:string|undefined):RegionalPendingTransfer|null {
 if(effectiveDestination!==packet.previousDestination||overrides.some(row=>row.sourceId===packet.sourceId&&row.vitrine.trim()))return null;
 const matches=current.filter(row=>row.sourceRecordId===packet.sourceId||row.id===packet.sourceId);
 const placement=matches.length===1?matches[0]:undefined;
 const source=sources.find(row=>row.sourceId===packet.sourceId);
 if(!placement||placement.saintId!==packet.saintId||placement.linkIssue||placement.arrangementNeedsReview||placement.placementState?.startsWith("Conflicting"))return null;
 if(!source||source.saintId!==packet.saintId||source.identityChanged||source.sourceRevision!==packet.sourceRevision)return null;
 if(placement.arrangement?.revision!==packet.arrangementRevision||placement.arrangement.proposalRevision!==packet.proposalRevision)return null;
 return {version:packet.version,sourceId:packet.sourceId,state:"approved_case_pending",region:packet.region,cohort:packet.cohort,
  label:packet.label,reason:packet.reason,approvedDate:packet.approvedDate,supersededDestination:packet.previousDestination};
}

export const regionalPendingSourceIds=[packet.sourceId];
