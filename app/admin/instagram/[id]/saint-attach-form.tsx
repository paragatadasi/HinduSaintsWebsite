"use client";

import { useId, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { rankSaintSearchResults } from "@/lib/saint-search";
import { searchScoreToConfidence } from "@/lib/search-text";
import { attachSaintToInstagramItem } from "../actions";

export type SaintAttachOption = {
  id: string;
  displayName: string;
  canonicalName: string;
  status: string;
  eraLabel: string | null;
  birthDateRaw: string | null;
  samadhiDateRaw: string | null;
  shortDescription: string | null;
  biographySummary: string | null;
  aliases: Array<{ alias: string }>;
  places: Array<{
    place: {
      name: string;
      alternateNames: string[];
      region: string | null;
      country: string | null;
    };
  }>;
  traditions: Array<{
    tradition: {
      name: string;
      alternateNames: string[];
    };
  }>;
};

type RankedSaintAttachOption = SaintAttachOption & {
  confidence?: "low" | "medium" | "high";
};

type SaintAttachFormProps = {
  initialQuery: string;
  instagramItemId: string;
  returnTo: string;
  saints: SaintAttachOption[];
};

export function SaintAttachForm({ initialQuery, instagramItemId, returnTo, saints }: SaintAttachFormProps) {
  const listboxId = useId();
  const [query, setQuery] = useState(initialQuery);
  const [selectedSaintId, setSelectedSaintId] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const visibleSaints = useMemo(() => getVisibleSaints(saints, query), [query, saints]);
  const selectedSaint = saints.find((saint) => saint.id === selectedSaintId);
  const activeSaint = visibleSaints[activeIndex];

  return (
    <form action={attachSaintToInstagramItem} className="form-stack">
      <input name="instagramItemId" type="hidden" value={instagramItemId} />
      <input name="returnTo" type="hidden" value={returnTo} />
      <input name="saintId" type="hidden" value={selectedSaintId} />
      <div className="combo-search">
        <label htmlFor={`${listboxId}-input`}>Saint</label>
        <div className="combo-search__control">
          <input
            aria-activedescendant={isDropdownOpen && activeSaint ? `${listboxId}-${activeSaint.id}` : undefined}
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={isDropdownOpen}
            autoComplete="off"
            id={`${listboxId}-input`}
            placeholder="Search by name, alias, place, tradition, or date"
            role="combobox"
            type="search"
            value={query}
            onBlur={() => {
              window.setTimeout(() => setIsDropdownOpen(false), 100);
            }}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedSaintId("");
              setActiveIndex(0);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setIsDropdownOpen(true);
                setActiveIndex((index) => (visibleSaints.length > 0 ? Math.min(index + 1, visibleSaints.length - 1) : 0));
              }

              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((index) => Math.max(index - 1, 0));
              }

              if (event.key === "Enter" && isDropdownOpen && activeSaint) {
                event.preventDefault();
                selectSaint(activeSaint);
              }

              if (event.key === "Escape") {
                setIsDropdownOpen(false);
              }
            }}
          />
          <button
            aria-label={isDropdownOpen ? "Hide saint options" : "Show saint options"}
            className="combo-search__toggle"
            type="button"
            onClick={() => {
              setIsDropdownOpen((open) => !open);
            }}
          >
            <ChevronDown aria-hidden="true" size={18} />
          </button>
        </div>
        {isDropdownOpen ? (
          <div className="combo-search__list" id={listboxId} role="listbox">
            {visibleSaints.length > 0 ? (
              visibleSaints.map((saint, index) => (
                <button
                  aria-selected={saint.id === selectedSaintId}
                  className="combo-search__option"
                  data-active={index === activeIndex ? "true" : undefined}
                  id={`${listboxId}-${saint.id}`}
                  key={saint.id}
                  role="option"
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectSaint(saint)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <span>{saint.displayName}</span>
                  <small>{formatSaintMeta(saint)}</small>
                </button>
              ))
            ) : (
              <div className="combo-search__empty">No saints match this search.</div>
            )}
          </div>
        ) : null}
        {selectedSaint ? <p className="combo-search__selection">Selected: {selectedSaint.displayName}</p> : null}
      </div>
      <label>
        Confidence
        <select name="matchConfidence" defaultValue="medium">
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </label>
      <div className="review-actions">
        <button className="admin-form-button" type="submit" disabled={!selectedSaintId}>Attach and confirm match</button>
      </div>
    </form>
  );

  function selectSaint(saint: RankedSaintAttachOption) {
    setQuery(saint.displayName);
    setSelectedSaintId(saint.id);
    setIsDropdownOpen(false);
  }
}

function getVisibleSaints(saints: SaintAttachOption[], query: string): RankedSaintAttachOption[] {
  const term = query.trim();
  if (!term) return saints;

  return rankSaintSearchResults(saints, term, { includeAdminFields: true, limit: 40 })
    .map(({ item, score }) => ({
      ...item,
      confidence: searchScoreToConfidence(score)
    }));
}

function formatSaintMeta(saint: RankedSaintAttachOption) {
  return [
    saint.confidence ? `${saint.confidence} match` : undefined,
    formatStatus(saint.status)
  ].filter(Boolean).join(" - ");
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}
