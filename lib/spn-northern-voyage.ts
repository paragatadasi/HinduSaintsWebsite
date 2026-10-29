import packet from "../data/museum/spn-northern-voyage-approved-v19.json";
import type { ProposalObservation } from "./spn-room-proposal";
import { MuseumMoveSessionError } from "./museum-move-session-domain";

export const northernVoyage = packet;

export function assertCurrentNorthernGuideTargets(input: {
  guideContext?: unknown; alternativeDecision?: unknown; curatorAddition?: unknown; clearedVitrines?: string[];
  records: { sourceId: string; to: { kind: string; code: string } }[];
}) {
  if (!input.guideContext || input.alternativeDecision || input.curatorAddition || input.clearedVitrines?.length) return;
  for (const record of input.records) {
    const assignment = packet.assignments.find(row => row.sourceId === record.sourceId);
    if (assignment && (assignment.status === "pending" || record.to.kind !== "vitrine" || record.to.code !== assignment.destination))
      throw new MuseumMoveSessionError(409, "This source has a newer Northern proposal or is pending review. Open the current phase before recording a move.");
  }
}

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
