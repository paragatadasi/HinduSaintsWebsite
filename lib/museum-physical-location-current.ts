import { createHash } from "node:crypto";
import { moveLocation, type MoveLocation } from "./museum-move-session-domain";

export const physicalFingerprint = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
export function resolveMuseumPhysicalCurrent(original: MoveLocation | null,
  saved: { location: unknown; version: number; confirmedAt: Date } | undefined,
  legacy: { location: MoveLocation; confirmedAt: string; scope: string } | null | undefined) {
  const useLegacy = legacy && (!saved || Date.parse(legacy.confirmedAt) > saved.confirmedAt.getTime());
  const confirmed = useLegacy ? { ...legacy, version: saved?.version ?? 0 }
    : saved ? { location: moveLocation.parse(saved.location), confirmedAt: saved.confirmedAt.toISOString(), version: saved.version } : null;
  const current = confirmed?.location ?? original;
  return { currentConfirmed: confirmed, current, currentBasis: confirmed ? "confirmed" : original ? "source" : "unknown",
    currentVersion: saved?.version ?? 0,
    currentRevision: physicalFingerprint({ version: saved?.version ?? 0, location: current, confirmedAt: confirmed?.confirmedAt ?? null }) };
}
