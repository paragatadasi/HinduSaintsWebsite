import {spnDuplicateObservations} from "./spn-observation-suppression";
import adjustments from "../data/museum/spn-starter-curator-adjustments-v1.json";
import { MuseumMoveSessionError, sameMoveLocation, type MoveLocation } from "./museum-move-session-domain";
import proposal from "../data/museum/spn-starter-reviewed-proposal-v16.json";

// These source observations may combine a complete stick with other relics.
// A saint-level destination does not establish which objects can move together.
const housingReviewSources = new Set(proposal.rows.filter(row => row.movementBlockedReason).map(row => row.sourceId));
export function hasOnlySpnHousingReviewHold(sourceId: string) {
  return housingReviewSources.has(sourceId) && !spnDuplicateObservations[sourceId] && !adjustments.privateSourceIds.includes(sourceId);
}

export function spnMovementBlockedReason(sourceId: string): string | undefined {
  if(spnDuplicateObservations[sourceId])return spnDuplicateObservations[sourceId].reason;
  if(adjustments.privateSourceIds.includes(sourceId))return adjustments.privateHoldReason;
  return housingReviewSources.has(sourceId)
    ? "Confirm this source's separate objects and stick housing before recording a move of the whole display."
    : undefined;
}

export function assertSpnMovementAllowed(sourceId: string, from: MoveLocation | null, to: MoveLocation) {
  const reason = spnMovementBlockedReason(sourceId);
  if (reason && (spnDuplicateObservations[sourceId] || !sameMoveLocation(from, to))) throw new MuseumMoveSessionError(409, reason);
}
