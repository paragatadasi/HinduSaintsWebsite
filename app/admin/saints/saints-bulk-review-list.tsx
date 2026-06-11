"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { bulkUpdateSaintReviewStatus } from "./actions";

type SaintReviewRow = {
  id: string;
  slug: string;
  displayName: string;
  status: string;
  shortDescription: string | null;
  biographySummary: string | null;
  eraLabel: string | null;
  placeName: string | null;
  hasInstagramContent: boolean;
  isAirtableLinked: boolean;
};

type SaintsBulkReviewListProps = {
  saints: SaintReviewRow[];
  returnTo: string;
};

const bulkActions = [
  { status: "published", label: "Publish selected", variant: "primary" },
  { status: "needs_review", label: "Unpublish selected", variant: "secondary" },
  { status: "hidden", label: "Hide selected", variant: "warning" },
  { status: "archived", label: "Archive selected", variant: "warning" }
] as const;

export function SaintsBulkReviewList({ saints, returnTo }: SaintsBulkReviewListProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedCount = selectedIds.length;
  const allVisibleSelected = saints.length > 0 && selectedCount === saints.length;

  function toggleSaint(saintId: string) {
    setSelectedIds((current) => (
      current.includes(saintId)
        ? current.filter((id) => id !== saintId)
        : [...current, saintId]
    ));
  }

  function toggleAllVisible() {
    setSelectedIds(allVisibleSelected ? [] : saints.map((saint) => saint.id));
  }

  if (saints.length === 0) {
    return (
      <div className="review-panel">
        <h2>No saints in this queue</h2>
        <p>Try another status filter.</p>
      </div>
    );
  }

  return (
    <form action={bulkUpdateSaintReviewStatus} className="bulk-review-form">
      <input name="returnTo" type="hidden" value={returnTo} />
      {selectedIds.map((saintId) => (
        <input key={saintId} name="saintIds" type="hidden" value={saintId} />
      ))}

      <div className="bulk-review-panel">
        <div>
          <strong>{selectedCount} selected</strong>
          <span>{saints.length} visible in this queue</span>
        </div>
        <div className="review-actions">
          <button className="admin-form-button admin-form-button--secondary" type="button" onClick={toggleAllVisible}>
            {allVisibleSelected ? "Clear visible" : "Select visible"}
          </button>
          {selectedCount > 0 ? (
            <button className="admin-form-button admin-form-button--secondary" type="button" onClick={() => setSelectedIds([])}>
              Clear selection
            </button>
          ) : null}
          {bulkActions.map((action) => (
            <button
              className={[
                "admin-form-button",
                action.variant === "secondary" ? "admin-form-button--secondary" : null,
                action.variant === "warning" ? "admin-form-button--warning" : null
              ].filter(Boolean).join(" ")}
              disabled={selectedCount === 0}
              key={action.status}
              name="status"
              type="submit"
              value={action.status}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <div className="review-list">
        {saints.map((saint) => (
          <article className="review-row review-row--selectable" key={saint.id}>
            <label className="bulk-review-checkbox">
              <input
                aria-label={`Select ${saint.displayName}`}
                checked={selectedIdSet.has(saint.id)}
                onChange={() => toggleSaint(saint.id)}
                type="checkbox"
              />
            </label>
            <Link className="review-row__link" href={`/admin/saints/${saint.slug}`}>
              <div>
                <div className="review-meta">
                  <StatusBadge label={formatStatus(saint.status)} />
                  {saint.hasInstagramContent ? <StatusBadge label="Instagram content" /> : null}
                  {saint.isAirtableLinked ? <StatusBadge label="Airtable linked" /> : null}
                </div>
                <h2>{saint.displayName}</h2>
                <p>{saint.shortDescription ?? saint.biographySummary ?? "No public summary yet."}</p>
              </div>
              <div className="review-meta">
                <StatusBadge label={saint.eraLabel ?? "Dates pending"} />
                <StatusBadge label={saint.placeName ?? "Place pending"} />
              </div>
            </Link>
          </article>
        ))}
      </div>
    </form>
  );
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}
