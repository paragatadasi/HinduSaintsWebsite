import packet from "../data/museum/spn-northern-voyage-approved-v19.json";
import type { ProposalObservation } from "./spn-room-proposal";

export const northernVoyage = packet;

export function applyNorthernVoyage(rows: ProposalObservation[]): ProposalObservation[] {
  const assignments = new Map(packet.assignments.map(row => [row.sourceId, row]));
  if (assignments.size !== 122 || packet.assignments.some(change =>
    !rows.some(row => row.sourceId === change.sourceId && row.saintId === change.saintId)))
    throw new Error("The approved Northern source identities need reconciliation.");
  return rows.map(row => {
    const change = assignments.get(row.sourceId);
    if (!change || change.status === "pending" || !change.destination) return row;
    return { ...row, vitrine: change.destination, baseline: change.capturedBaseline };
  });
}
