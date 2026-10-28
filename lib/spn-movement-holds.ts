import { MuseumMoveSessionError, sameMoveLocation, type MoveLocation } from "./museum-move-session-domain";

// These source observations may combine a complete stick with other relics.
// A saint-level destination does not establish which objects can move together.
const housingReviewSources = new Set([
  "reck86EKve5tFAi6R", // Ramdas Tyagi: Stick
  "rec9vEn5oj7QZTXl0", // Durgaprasad: walking stick and dhoti
  "recVN6Ty3682Uz2g4", // Paramanand Das: armrest stick
  "recsm43oeUdKNUMqs", // Bimal: yoga stick and prayer book
  "rec7GxgNvmubmTvMM", // Pagal: Dandha Yoga Patta; separate stick observation in 31
]);

export function spnMovementBlockedReason(sourceId: string): string | undefined {
  return housingReviewSources.has(sourceId)
    ? "Confirm this source's separate objects and stick housing before recording a move of the whole display."
    : undefined;
}

export function assertSpnMovementAllowed(sourceId: string, from: MoveLocation | null, to: MoveLocation) {
  const reason = spnMovementBlockedReason(sourceId);
  if (reason && !sameMoveLocation(from, to)) throw new MuseumMoveSessionError(409, reason);
}
