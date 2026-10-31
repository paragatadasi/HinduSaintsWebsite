import type {CompanionRow, GuideEntry, PhysicalState} from "@/lib/spn-move-guide";

export function groupClearContents(rows: CompanionRow[], destinations: Map<string, string>) {
  const groups = new Map<string, CompanionRow[]>();
  for (const row of rows) {
    const destination = destinations.get(row.sourceId) || "";
    groups.set(destination, [...(groups.get(destination) ?? []), row]);
  }
  return [...groups].sort(([a], [b]) => !a ? 1 : !b ? -1 : a.localeCompare(b, undefined, {numeric: true}))
    .map(([destination, entries]) => ({destination, entries: entries.sort((a,b) => a.name.localeCompare(b.name))}));
}

export function MuseumClearContents({rows, missing, entries, sourceVitrine, partialIds = []}: {
  rows: CompanionRow[];
  missing: PhysicalState["unmappedCurrentLocations"];
  entries: Pick<GuideEntry, "sourceId" | "destination">[];
  sourceVitrine: string;
  partialIds?: string[];
}) {
  const groups = groupClearContents(rows, new Map(entries.map(entry => [entry.sourceId, entry.destination])));
  return <div className="museum-clear-contents">
    <p className="museum-clear-contents__summary">{rows.length + missing.length} recorded entries · grouped by proposed destination</p>
    {groups.map(group => <details open className="museum-clear-contents__group" key={group.destination || "pending"}>
      <summary><span>{group.destination ? `Vitrine ${group.destination}${group.destination === sourceVitrine ? " · returns here" : ""}` : "Destination not assigned"}</span><span className="museum-clear-contents__count">{group.entries.length} {group.entries.length === 1 ? "entry" : "entries"}</span></summary>
      <ul>{group.entries.map(row => <li key={row.sourceId}>
        <span className="museum-clear-contents__name">{row.name}</span>
        {row.current?.shelf ? <small>Shelf {row.current.shelf}</small> : null}
        {partialIds.includes(row.sourceId) ? <p className="museum-clear-contents__warning">Only the pieces held in Vitrine 20 will be recorded as staged.</p> : row.movementBlockedReason ? <p className="museum-clear-contents__warning">{row.movementBlockedReason}</p> : null}
      </li>)}</ul>
    </details>)}
    {missing.length ? <details open className="museum-clear-contents__group"><summary><span>Records to identify</span><span className="museum-clear-contents__count">{missing.length} {missing.length === 1 ? "entry" : "entries"}</span></summary><ul>{missing.map(row => <li key={row.sourceId}><span>{row.sourceId}</span>{row.location.shelf ? <small>Shelf {row.location.shelf}</small> : null}<p className="museum-clear-contents__warning">Unlinked record: review before clearing.</p></li>)}</ul></details> : null}
  </div>;
}
