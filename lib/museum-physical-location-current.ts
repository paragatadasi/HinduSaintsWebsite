import { z } from "zod";
import { createHash } from "node:crypto";
import { moveLocation, type MoveLocation } from "./museum-move-session-domain";

export const physicalFingerprint = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
export const restoredPhysicalState = z.object({ kind: z.literal("restored_recorded_state"),
  basis: z.enum(["confirmed", "source", "unknown"]), location: moveLocation.nullable(),
  effectiveConfirmedAt: z.string().datetime().nullable() }).strict().refine(state =>
    state.basis === "confirmed" ? Boolean(state.location && state.effectiveConfirmedAt) :
      state.effectiveConfirmedAt === null && (state.basis === "unknown" ? state.location === null : state.location !== null));
export function storedPhysicalLocation(value: unknown): MoveLocation | null {
  if (value === null) return null;
  const restored = restoredPhysicalState.safeParse(value);
  return restored.success ? restored.data.location : moveLocation.parse(value);
}
export function resolveMuseumPhysicalCurrent(original: MoveLocation | null,
  saved: { location: unknown; version: number; confirmedAt: Date } | undefined,
  legacy: { location: MoveLocation; confirmedAt: string; scope: string } | null | undefined) {
  const restored = saved ? restoredPhysicalState.safeParse(saved.location) : null;
  const state = restored?.success ? restored.data : null;
  const savedDate = state?.basis === "confirmed" ? state.effectiveConfirmedAt : saved?.confirmedAt.toISOString();
  const useLegacy = legacy && (!saved || Date.parse(legacy.confirmedAt) > Date.parse(savedDate ?? saved.confirmedAt.toISOString()));
  const confirmed = useLegacy ? { ...legacy, version: saved?.version ?? 0 }
    : saved && (!state || state.basis === "confirmed") ? { location: storedPhysicalLocation(saved.location)!, confirmedAt: savedDate!, version: saved.version } : null;
  const current = confirmed?.location ?? (state ? state.location : original);
  const basis = confirmed ? "confirmed" : state?.basis ?? (original ? "source" : "unknown");
  return { currentConfirmed: confirmed, current, currentBasis: basis,
    currentVersion: saved?.version ?? 0,
    currentRevision: physicalFingerprint({ version: saved?.version ?? 0, location: current, confirmedAt: confirmed?.confirmedAt ?? null }) };
}
