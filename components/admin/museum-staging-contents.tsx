"use client";
import {useId, type ReactNode} from "react";
import {groupClearContents} from "./museum-clear-contents";
import type {CompanionRow, GuideEntry, PhysicalState} from "@/lib/spn-move-guide";

export function MuseumStagingContents({rows, entries, missing, renderRow}: {
  rows: CompanionRow[];
  entries: Pick<GuideEntry, "sourceId" | "destination">[];
  missing: PhysicalState["unmappedCurrentLocations"];
  renderRow: (row: CompanionRow) => ReactNode;
}) {
  const id = useId();
  const groups = groupClearContents(rows, new Map(entries.map(entry => [entry.sourceId, entry.destination])));
  const label = (destination: string) => destination ? `Vitrine ${destination}` : "Destination not assigned";
  function openGroup(key: string) {
    const group = document.getElementById(`${id}-${key}`) as HTMLDetailsElement | null;
    if (!group) return;
    group.open = true;
    group.scrollIntoView({block: "nearest"});
    group.querySelector("summary")?.focus({preventScroll: true});
  }
  if (!rows.length && !missing.length) return <p>No displays recorded in the staging area.</p>;
  return <div className="museum-clear-contents">
    <p className="museum-clear-contents__summary">Proposed destinations</p>
    <nav className="museum-destination-summary" aria-label="Staging destinations">
      {groups.map(group => <button key={group.destination || "pending"} type="button" className="museum-admin-button museum-admin-button--secondary" onClick={() => openGroup(group.destination || "pending")}>
        {label(group.destination)} <span className="museum-destination-summary__count">{group.entries.length} {group.entries.length === 1 ? "entry" : "entries"}</span>
      </button>)}
      {missing.length ? <button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={() => openGroup("unlinked")}>Records to identify <span className="museum-destination-summary__count">{missing.length} {missing.length === 1 ? "entry" : "entries"}</span></button> : null}
    </nav>
    {groups.map(group => <details open id={`${id}-${group.destination || "pending"}`} className="museum-clear-contents__group museum-staging-contents__group" key={group.destination || "pending"}>
      <summary><span>{label(group.destination)}</span><span className="museum-clear-contents__count">{group.entries.length} {group.entries.length === 1 ? "entry" : "entries"}</span></summary>
      <div className="museum-staging-contents__rows">{group.entries.map(row => <div key={row.sourceId}>{renderRow(row)}</div>)}</div>
    </details>)}
    {missing.length ? <details open id={`${id}-unlinked`} className="museum-clear-contents__group"><summary><span>Records to identify</span><span className="museum-clear-contents__count">{missing.length} {missing.length === 1 ? "entry" : "entries"}</span></summary><ul>{missing.map(row => <li key={row.sourceId}>{row.sourceId}<small>Staged record awaiting an inventory match</small></li>)}</ul></details> : null}
  </div>;
}
