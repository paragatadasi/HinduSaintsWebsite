import type { CompanionRow, PhysicalLocation } from "./spn-move-guide";

export type ProgressPosition = {
  sourceId: string; recordedAt: string; current: PhysicalLocation | null; currentBasis: string;
  currentVersion: number; currentRevision: string;
  currentConfirmed: { location: PhysicalLocation; confirmedAt: string; version: number } | null;
};

export function mergeMuseumPhysicalProgress<T extends CompanionRow & {
  legacyConfirmed?: { confirmedAt: string } | null
}>(rows: T[], positions: ProgressPosition[]) {
  const saved = new Map(positions.map(position => [position.sourceId, position]));
  let needsFullRefresh = false;
  const merged = rows.map(row => {
    const position = saved.get(row.sourceId);
    if (!position || position.currentRevision === row.currentRevision) return row;
    // The fast ledger cannot replace a newer confirmation from the legacy arrangement workflow.
    if (row.legacyConfirmed && Date.parse(row.legacyConfirmed.confirmedAt) >
      Date.parse(position.currentConfirmed?.confirmedAt ?? position.recordedAt)) {
      needsFullRefresh = true;
      return row;
    }
    return { ...row, current: position.current, currentBasis: position.currentBasis,
      currentVersion: position.currentVersion, currentRevision: position.currentRevision,
      currentConfirmed: position.currentConfirmed,
      undo: { available: false, previous: null, previousBasis: null, reason: "Refresh this record before undoing its latest placement." } };
  });
  return { rows: merged, needsFullRefresh };
}
