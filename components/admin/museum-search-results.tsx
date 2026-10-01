"use client";

import { useState } from "react";
import { MuseumSaintProposalDialog } from "@/components/admin/museum-saint-proposal-dialog";
import type { MuseumSaintPlacement, MuseumTier } from "@/lib/museum-proposals";
import type { MuseumAnchorOption } from "@/lib/museum-proposal-preview";

type Result = {
  row: MuseumSaintPlacement;
  member?: Record<string, string>;
  anchorOptions: MuseumAnchorOption[];
};

export function MuseumSearchResults({ results, sectionNames }: { results: Result[]; sectionNames: string[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tierById, setTierById] = useState<Record<string, MuseumTier>>({});
  const [sectionById, setSectionById] = useState<Record<string, string>>({});
  const [anchorById, setAnchorById] = useState<Record<string, string>>({});
  const selected = results.find(({ row }) => row.id === selectedId);
  return (
    <div className="museum-search-results">
      <p>{results.length ? (results.length + " matching placement" + (results.length === 1 ? "" : "s")) : "No matching placements found."}</p>
      <div className="museum-search-results__grid">
        {results.map(({ row }) => (
          <button aria-haspopup="dialog" className="museum-search-result interactive-surface" key={row.id} onClick={() => setSelectedId(row.id)} type="button">
            <strong>{row.name}</strong>
            <span>{row.section}</span>
            <small>{row.tier} - {row.confidence} confidence</small>
          </button>
        ))}
      </div>
      {selected ? <MuseumSaintProposalDialog
        anchorOptions={selected.anchorOptions}
        anchorValue={anchorById[selected.row.id] || ""}
        member={selected.member}
        onAnchorChange={(value) => {
          setAnchorById((current) => ({ ...current, [selected.row.id]: value }));
          if (value === ("saint:" + selected.row.id)) setTierById((current) => ({ ...current, [selected.row.id]: "Featured" }));
          else if (value && (tierById[selected.row.id] || selected.row.tier) === "Featured") setTierById((current) => ({ ...current, [selected.row.id]: "Secondary" }));
        }}
        onClose={() => setSelectedId(null)}
        onPrimarySectionChange={(value) => setSectionById((current) => ({ ...current, [selected.row.id]: value }))}
        onTierChange={(value) => setTierById((current) => ({ ...current, [selected.row.id]: value }))}
        primarySectionValue={sectionById[selected.row.id] || selected.row.section}
        row={selected.row}
        sectionNames={sectionNames}
        tierValue={tierById[selected.row.id] || selected.row.tier}
      /> : null}
    </div>
  );
}
