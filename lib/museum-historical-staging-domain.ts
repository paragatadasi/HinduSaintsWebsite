import { createHash } from "node:crypto";
import { z } from "zod";
import { MuseumMoveSessionError, type MoveLocation } from "./museum-move-session-domain";

export const historicalStarterCases = ["2", "27", "28", "76", "29", "36", "78"] as const;
const revision = z.string().regex(/^[a-f0-9]{64}$/);
export const historicalStagingRecord = z.object({
  sourceId: z.string().min(1).max(200), saintId: z.string().nullable(),
  expectedCurrentRevision: revision, expectedSourceRevision: revision,
  expectedLocationVersion: z.number().int().nonnegative()
}).strict();
export const historicalStagingInput = z.object({
  action: z.literal("historical.staging.reconcile"), museumId: z.literal("museum-spn"),
  clientRequestId: z.string().uuid(), expectedRevision: revision,
  records: z.array(historicalStagingRecord).min(1).max(200),
  reportedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
    const date = new Date(`${value}T12:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }),
  historicalClearanceAcknowledged: z.literal(true), currentStagingAcknowledged: z.literal(true)
}).strict();

type Row = {
  sourceId: string; saintId: string | null; name: string;
  current: MoveLocation | null; original: MoveLocation | null; currentBasis: string;
  currentRevision: string; sourceRevision: string; currentVersion: number;
  fixedHousing: boolean; movementBlockedReason?: string; identityChanged: boolean; verifiedItemIds: string[];
};
export function historicalStagingPreview(rows: Row[]) {
  const eligible: (z.infer<typeof historicalStagingRecord> & { name: string; from: MoveLocation })[] = [];
  const blocked: { sourceId: string; name: string; reason: string }[] = [];
  for (const row of rows) {
    if (row.currentBasis !== "source" || row.current?.kind !== "vitrine" ||
      !historicalStarterCases.some(code => code === row.current!.code)) continue;
    const reason = row.identityChanged ? "The source identity changed." : row.verifiedItemIds.length ? "Use the verified item workflow." :
      row.movementBlockedReason || (row.fixedHousing ? "Review the fixed housing." :
        row.original?.kind !== "vitrine" || row.original.code !== row.current.code ? "The original source location needs review." : null);
    if (reason) { blocked.push({ sourceId: row.sourceId, name: row.name, reason }); continue; }
    eligible.push({ sourceId: row.sourceId, saintId: row.saintId, name: row.name, from: row.current,
      expectedCurrentRevision: row.currentRevision, expectedSourceRevision: row.sourceRevision, expectedLocationVersion: row.currentVersion });
  }
  eligible.sort((a, b) => a.sourceId.localeCompare(b.sourceId));
  blocked.sort((a, b) => a.sourceId.localeCompare(b.sourceId));
  const digest = createHash("sha256").update(JSON.stringify({ historicalStarterCases, eligible, blocked })).digest("hex");
  return { museumId: "museum-spn" as const, revision: digest, reportedClearedVitrines: historicalStarterCases, eligible, blocked,
    preservedConfirmedCount: rows.filter(row => row.currentBasis === "confirmed").length,
    alreadyStagedCount: rows.filter(row => row.current?.kind === "table").length };
}

export function assertHistoricalStagingSelection(input: z.infer<typeof historicalStagingInput>, preview: ReturnType<typeof historicalStagingPreview>) {
  const expected = preview.eligible.map(({ name, from, ...record }) => record);
  const submitted = [...input.records].sort((a, b) => a.sourceId.localeCompare(b.sourceId));
  if (input.expectedRevision !== preview.revision || submitted.length !== expected.length ||
    submitted.some((record, index) => Object.entries(expected[index]).some(([key, value]) => record[key as keyof typeof record] !== value)))
    throw new MuseumMoveSessionError(409, "The remaining contents changed. Reload the staging correction before saving.");
}
