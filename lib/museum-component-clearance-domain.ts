import { z } from "zod";
import { MuseumMoveSessionError, type MoveLocation } from "./museum-move-session-domain";

export const v20ComponentSourceIds = ["rec9vEn5oj7QZTXl0", "recVN6Ty3682Uz2g4"] as const;
export const isV20ComponentSourceId = (sourceId: string) => v20ComponentSourceIds.some(id => id === sourceId);
export const componentStagingAcknowledgements = z.array(z.object({
  sourceId: z.enum(v20ComponentSourceIds), scope: z.literal("vitrine_20_contents_only"),
  allOriginPiecesStaged: z.literal(true), walkingSticksNotInVitrine: z.literal(true)
}).strict()).max(2).refine(rows => new Set(rows.map(row => row.sourceId)).size === rows.length, "Repeated component acknowledgement.");
export type ComponentPlacement = {
  sourceId: string; receiptId: string; recordedAt: string; revision: string;
  origin: MoveLocation; location: MoveLocation; scope: "vitrine_20_contents_only";
  excludedWalkingSticks: { location: null; status: "unverified" };
  expectedSourceRevision: string; previousCurrentRevision: string; previousLocationVersion: number;
};
export type ComponentClearanceInput = {
  clearedVitrines?: string[]; initialCaseClearAcknowledged?: true;
  componentStagingAcknowledgements?: z.infer<typeof componentStagingAcknowledgements>;
  records: { sourceId: string; to: MoveLocation }[];
};

export function assertComponentClearanceScope(input: ComponentClearanceInput) {
  const acknowledgements = input.componentStagingAcknowledgements ?? [];
  if (!acknowledgements.length) return;
  if (input.clearedVitrines?.length !== 1 || input.clearedVitrines[0] !== "20" || !input.initialCaseClearAcknowledged)
    throw new MuseumMoveSessionError(400, "Component confirmations apply only to the Vitrine 20 clearing.");
  for (const ack of acknowledgements) {
    const record = input.records.find(row => row.sourceId === ack.sourceId);
    if (!record || record.to.kind !== "table" || record.to.code !== "staging-area")
      throw new MuseumMoveSessionError(400, "Confirm only the Vitrine 20 pieces moved to staging.");
  }
}

export function isComponentClearance(input: ComponentClearanceInput, row: {
  sourceId: string; current: MoveLocation | null; fixedHousing: boolean;
  verifiedItemIds: string[]; identityChanged: boolean;
}) {
  const acknowledged = input.componentStagingAcknowledgements?.some(ack => ack.sourceId === row.sourceId);
  if (!acknowledged) return false;
  assertComponentClearanceScope(input);
  if (!isV20ComponentSourceId(row.sourceId) || row.current?.kind !== "vitrine" || row.current.code !== "20" ||
      row.fixedHousing || row.verifiedItemIds.length || row.identityChanged)
    throw new MuseumMoveSessionError(409, "These components or their source changed. Review the clearing again.");
  return true;
}

export function projectComponentPlacement<T extends {
  currentVersion: number; currentRevision: string; sourceRevision?: string;
  current: MoveLocation | null; currentBasis: string; currentConfirmed?: unknown;
}>(row: T, component?: ComponentPlacement) {
  if (!component || row.currentVersion !== component.previousLocationVersion || row.currentRevision !== component.previousCurrentRevision ||
      (row.sourceRevision !== undefined && row.sourceRevision !== component.expectedSourceRevision))
    return { ...row, componentPlacement: null as ComponentPlacement | null };
  return { ...row, current: null, currentBasis: "unknown" as const, currentConfirmed: null,
    currentRevision: component.revision, componentPlacement: component };
}
