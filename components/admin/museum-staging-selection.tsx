"use client";

export type StagingCandidate = {
 sourceId: string;
 name: string;
 shelf?: string | null;
 destination?: string | null;
 scopeNote?: string | null;
};

export function MuseumStagingSelection({vitrine, candidates, selectedIds, acknowledged, busy, confirmDisabled = false, onSelection, onAcknowledgement, onConfirm}: {
 vitrine: string;
 candidates: StagingCandidate[];
 selectedIds: string[];
 acknowledged: boolean;
 busy: boolean;
 confirmDisabled?: boolean;
 onSelection: (ids: string[]) => void;
 onAcknowledgement: (value: boolean) => void;
 onConfirm: () => void;
}) {
 const groups = new Map<string, StagingCandidate[]>();
 for (const row of candidates) {
  const destination = row.destination || "";
  groups.set(destination, [...(groups.get(destination) ?? []), row]);
 }
 function select(ids: string[]) {
  onSelection(ids);
  onAcknowledgement(false);
 }
 return <>
  <div className="review-actions">
   <button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={busy || !candidates.length} onClick={() => select(candidates.map(row => row.sourceId))}>Select listed entries</button>
   <button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={busy || !selectedIds.length} onClick={() => select([])}>Clear selection</button>
   <span role="status">{selectedIds.length} selected</span>
  </div>
  <div className="museum-clear-contents">
   {[...groups].sort(([a], [b]) => !a ? 1 : !b ? -1 : a.localeCompare(b, undefined, {numeric: true})).map(([destination, entries]) => <details open className="museum-clear-contents__group" key={destination || "pending"}>
    <summary><span>{destination ? `Vitrine ${destination}${destination === vitrine ? " · returns here" : ""}` : "Destination not assigned"}</span><span className="museum-clear-contents__count">{entries.length} {entries.length === 1 ? "entry" : "entries"}</span></summary>
    <ul>{entries.map(row => <li key={row.sourceId}>
     <label className="room-move__check"><input type="checkbox" disabled={busy} checked={selectedIds.includes(row.sourceId)} onChange={event => select(event.target.checked ? [...selectedIds, row.sourceId] : selectedIds.filter(id => id !== row.sourceId))}/><span>{row.name}{row.shelf ? <small> · Shelf {row.shelf}</small> : null}</span></label>
     {row.scopeNote ? <p className="museum-clear-contents__warning">{row.scopeNote}</p> : null}
    </li>)}</ul>
   </details>)}
  </div>
  {candidates.length ? <>
   <label className="room-move__check"><input type="checkbox" disabled={busy || !selectedIds.length} checked={acknowledged} onChange={event => onAcknowledgement(event.target.checked)}/>The selected pieces from Vitrine {vitrine} are now in the staging area.</label>
   <button type="button" className="museum-admin-button" disabled={busy || confirmDisabled || !selectedIds.length || !acknowledged} onClick={onConfirm}>{busy ? "Saving…" : "Record in staging"}</button>
  </> : <p>No remaining entries to record in staging.</p>}
 </>;
}
