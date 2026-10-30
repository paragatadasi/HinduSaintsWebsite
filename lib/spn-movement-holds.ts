import {spnDuplicateObservations} from "./spn-observation-suppression";
import adjustments from "../data/museum/spn-starter-curator-adjustments-v1.json";
import { MuseumMoveSessionError, sameMoveLocation, type MoveLocation } from "./museum-move-session-domain";
import proposal from "../data/museum/spn-starter-reviewed-proposal-v16.json";
import {paramanandReview} from "./spn-paramanand-planning-context";
import {isReviewedParamanandArmSupport,type ReviewedHousingSource} from "./spn-paramanand-reviewed-object";

// These source observations may combine a complete stick with other relics.
// A saint-level destination does not establish which objects can move together.
const housingReviewSources = new Set(proposal.rows.filter(row => row.movementBlockedReason).map(row => row.sourceId));
export function hasOnlySpnHousingReviewHold(sourceId: string) {
  return housingReviewSources.has(sourceId) && !spnDuplicateObservations[sourceId] && !adjustments.privateSourceIds.includes(sourceId);
}

export function spnMovementBlockedReason(sourceId: string,evidence?:ReviewedHousingSource): string | undefined {
  if(spnDuplicateObservations[sourceId])return spnDuplicateObservations[sourceId].reason;
  if(adjustments.privateSourceIds.includes(sourceId))return adjustments.privateHoldReason;
  if(sourceId===paramanandReview.sourceId&&housingReviewSources.has(sourceId))return isReviewedParamanandArmSupport(evidence)?undefined:paramanandReview.housingReason;
  return housingReviewSources.has(sourceId)
    ? "Confirm this source's separate objects and stick housing before recording a move of the whole display."
    : undefined;
}

export function assertSpnMovementAllowed(sourceId: string, from: MoveLocation | null, to: MoveLocation,evidence?:ReviewedHousingSource) {
  const reason = spnMovementBlockedReason(sourceId,evidence);
  if (reason && (spnDuplicateObservations[sourceId] || !sameMoveLocation(from, to))) throw new MuseumMoveSessionError(409, reason);
}
