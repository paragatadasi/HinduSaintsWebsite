"use client";

import {useState} from "react";
import {MuseumClearContents} from "@/components/admin/museum-clear-contents";
import type {CompanionRow, GuideEntry, PhysicalState} from "@/lib/spn-move-guide";

export function MuseumPartialClearing({vitrine, rows, missing, entries, editable, busy, error,
  stagedCount, ready, blockedReason, onStage, onConfirmSpace}: {
  vitrine: string;
  rows: CompanionRow[];
  missing: PhysicalState["unmappedCurrentLocations"];
  entries: Pick<GuideEntry, "sourceId" | "destination">[];
  editable: boolean;
  busy: boolean;
  error?: string;
  stagedCount: number;
  ready: boolean;
  blockedReason: (row: CompanionRow) => string | null;
  onStage: (sourceIds: string[]) => Promise<boolean>;
  onConfirmSpace: () => Promise<boolean>;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [spaceChecked, setSpaceChecked] = useState(false);
  const eligible = rows.filter(row => !blockedReason(row));
  const selectedIds = eligible.filter(row => selected.has(row.sourceId)).map(row => row.sourceId);
  async function stage() {
    if (!editable || busy || !selectedIds.length) return;
    if (await onStage(selectedIds)) setSelected(new Set());
  }
  return <section className="museum-admin-panel" aria-label={`Prepare Vitrine ${vitrine}`}>
    <h2>Prepare Vitrine {vitrine}</h2>
    <p role="status">{stagedCount > 0 ? `${stagedCount} staged · ` : ""}{rows.length + missing.length} recorded here{ready ? " · Ready for placement" : ""}</p>
    {rows.length > 0 ? <>
      <p>Select the entries you have moved to staging.</p>
      <div className="section-heading">
        <button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={!editable || busy || !eligible.length} onClick={() => setSelected(new Set(eligible.map(row => row.sourceId)))}>Select all available</button>
        <button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={busy || !selected.size} onClick={() => setSelected(new Set())}>Clear selection</button>
      </div>
      <MuseumClearContents rows={rows} missing={missing} entries={entries} sourceVitrine={vitrine}
        selection={{selectedIds: selected, disabled: !editable || busy, blockedReason,
          onToggle: (id, checked) => setSelected(previous => {const next = new Set(previous); if (checked) next.add(id); else next.delete(id); return next;})}}/>
      <button type="button" className="museum-admin-button" disabled={!editable || busy || !selectedIds.length} onClick={() => void stage()}>{busy ? "Saving…" : `Record ${selectedIds.length} in staging`}</button>
    </> : null}
    {error ? <p role="alert" className="admin-notice">{error}</p> : null}
    {!ready ? <>
      <label className="room-move__check"><input type="checkbox" checked={spaceChecked} disabled={!editable || busy} onChange={event => setSpaceChecked(event.target.checked)}/>There is enough space to start placing the incoming relics.</label>
      <button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={!editable || busy || !spaceChecked} onClick={() => void onConfirmSpace()}>Confirm space available</button>
    </> : null}
  </section>;
}
