"use client";

import { CircleAlert } from "lucide-react";
import type { MuseumSaintPlacement } from "@/lib/museum-proposals";
import { MuseumArrangementIndicator } from "./museum-arrangement-indicator";

export function MuseumSaintSummary({ onSaintClick, row, showStatus = true }: { onSaintClick: (id: string) => void; row: MuseumSaintPlacement; showStatus?: boolean }) {
  return (
    <span className="museum-saint-summary">
      <button aria-haspopup="dialog" className="museum-saint-link" onClick={() => onSaintClick(row.id)} type="button">{row.name}</button>
      {row.needsResearch ? <button type="button" className="museum-research-indicator" aria-label={`Research needed for ${row.name}: open details`} title="Needs research - open details" onClick={() => onSaintClick(row.id)}><CircleAlert aria-hidden="true" size={16} /></button> : null}
      {showStatus && row.placementState ? <MuseumArrangementIndicator className="museum-placement-status" status={row.arrangement?.status} name={row.name} onClick={()=>onSaintClick(row.id)}/> : null}
    </span>
  );
}
