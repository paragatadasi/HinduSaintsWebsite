"use client";

import { useMemo, useState } from "react";
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
  const [query, setQuery] = useState(initialQuery);
  const visibleSaints = useMemo(() => getVisibleSaints(saints, query), [query, saints]);

  return (
    <div className="form-stack">
      <label>
        Search saints
        <input
          name="saintSearch"
          placeholder="Search by name, alias, place, tradition, or date"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <form action={attachSaintToInstagramItem} className="form-stack">
        <input name="instagramItemId" type="hidden" value={instagramItemId} />
        <input name="returnTo" type="hidden" value={returnTo} />
        <label>
          Saint
          <select name="saintId" required>
            <option value="">Choose a saint...</option>
            {visibleSaints.map((saint) => (
              <option key={saint.id} value={saint.id}>
                {formatSaintOption(saint)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Confidence
          <select name="matchConfidence" defaultValue="medium">
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
        <div className="review-actions">
          <button className="admin-form-button" type="submit">Attach and confirm match</button>
          {query ? (
            <button className="admin-form-button admin-form-button--secondary" type="button" onClick={() => setQuery("")}>
              Show all saints
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
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

function formatSaintOption(saint: RankedSaintAttachOption) {
  return [
    saint.displayName,
    saint.confidence ? `${saint.confidence} match` : undefined,
    formatStatus(saint.status)
  ].filter(Boolean).join(" - ");
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}
