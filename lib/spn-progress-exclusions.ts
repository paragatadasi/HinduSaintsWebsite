import overlay from "../data/museum/spn-approved-proposal-overlay-v1.json";
import {isActiveSpnObservation} from "./spn-observation-suppression";

// Confirmed empty observations, reviewed with the curator on 2 November 2026.
// Raw inventory and movement history remain intact. Unknown collection was restored.
export const confirmedEmptyProgressSources = new Set([
  "recq8jg20kMAD2Erc",
  "rec4xOqRUEzWnxTdw",
  "recPWVPc3i5A0KH7h",
  "recTIJVFjrG7OSvlI",
]);
const privateDisplaySources = new Set(overlay.excludedFromMuseumDisplay.map(row => row.sourceId));
export function isCountedSpnProgressSource(sourceId: string) {
  return isActiveSpnObservation(sourceId) && !confirmedEmptyProgressSources.has(sourceId) && !privateDisplaySources.has(sourceId);
}
