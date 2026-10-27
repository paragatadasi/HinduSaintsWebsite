import { z } from "zod";
export const moveLocation = z.object({ kind: z.enum(["vitrine", "table"]), code: z.string().trim().min(1).max(100), label: z.string().max(200), shelf: z.string().max(100).optional() }).strict();
export type MoveLocation = z.infer<typeof moveLocation>;
export const moveSnapshot = z.object({
  proposalVersion: z.string().min(1).max(200), title: z.string().max(500), vitrineCodes: z.array(z.string().min(1).max(100)),
  sourceSnapshotAt: z.string().max(200).optional(),
  initialEmptyVitrines: z.array(z.object({ code: z.string().min(1).max(100), asOfDate: z.string(), basis: z.string() })).optional(),
  guidance: z.object({ version: z.string().max(200), reviewStatus: z.string().max(200) }),
  rows: z.array(z.object({ sourceId: z.string().min(1).max(200), sourceKey: z.string().max(500).optional(), legacyPlacementId: z.string().max(200).optional(), itemId: z.string().cuid().nullable().optional(), itemIds: z.array(z.string().cuid()).optional(), name: z.string().max(500), saintId: z.string().nullable(),
    sourceReported: moveLocation.nullable(), legacyConfirmed: z.object({ location: moveLocation, confirmedAt: z.string().datetime(), scope: z.string().max(200) }).nullable().optional(),
    destination: moveLocation.nullable(), holdReason: z.string().max(2000), fixedHousing: z.boolean()
  })).min(1).max(10000)
}).refine(value => new Set(value.rows.map(row => row.sourceId)).size === value.rows.length, "Duplicate source identifiers.");
export type MoveSnapshot = z.infer<typeof moveSnapshot>;
export const createMoveSession = z.object({ museumId: z.literal("museum-spn"), proposalVersion: z.string().min(1).max(200), clientRequestId: z.string().uuid() }).strict();
const common = { sessionId: z.string().cuid(), expectedSessionVersion: z.number().int().positive(), clientRequestId: z.string().uuid() };
export const moveSessionAction = z.discriminatedUnion("action", [
  z.object({ ...common, action: z.literal("move"), moves: z.array(z.object({ sourceId: z.string().min(1).max(200), expectedLocationVersion: z.number().int().nonnegative(), expectedCurrentRevision: z.string().regex(/^[a-f0-9]{64}$/), to: moveLocation }).strict()).max(200), clearedVitrines: z.array(z.string().min(1).max(100)).max(100).optional(), physicalConfirmation: z.literal(true), inventoryAcknowledged: z.literal(true), note: z.string().max(2000).optional() }).strict(),
  z.object({ ...common, action: z.literal("close") }).strict()
]);
export class MuseumMoveSessionError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}
export function sameMoveLocation(a: MoveLocation | null, b: MoveLocation | null) {
  return a?.kind === b?.kind && a?.code === b?.code && (a?.shelf ?? "") === (b?.shelf ?? "");
}
export function assertDistinctMoveSources(moves: readonly { sourceId: string }[]) {
  if (new Set(moves.map(move => move.sourceId)).size !== moves.length) throw new MuseumMoveSessionError(400, "Choose each display once.");
}

export function assertWholeCaseClearing(codes: string[], rows: {sourceId:string;current:MoveLocation|null}[], moves: {sourceId:string;to:MoveLocation}[]) {
  for (const code of codes) for (const row of rows.filter(row => row.current?.kind === "vitrine" && row.current.code === code)) {
    const moved = moves.find(move => move.sourceId === row.sourceId);
    if (!moved || moved.to.kind !== "table" || moved.to.code !== "staging-area") throw new MuseumMoveSessionError(409, "A whole-vitrine clear must include every listed display, including displays that will return here.");
  }
}
