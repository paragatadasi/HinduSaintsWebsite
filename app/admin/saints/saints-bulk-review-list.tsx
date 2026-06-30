"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { bulkUpdateSaintReviewStatus } from "./actions";

type SaintReviewRow = {
  id: string;
  slug: string;
  displayName: string;
};

type SaintsBulkReviewListProps = {
  saints: SaintReviewRow[];
  returnTo: string;
};

const bulkActions = [
  { status: "published", label: "Publish selected", variant: "primary" },
  { status: "draft", label: "Unpublish selected", variant: "secondary" },
  { status: "archived", label: "Archive selected", variant: "low-priority" }
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
      <div className="admin-review-empty">
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

      <div className="bulk-review-panel" data-has-selection={selectedCount > 0 ? "true" : "false"}>
        <label className="bulk-review-select-all">
          <input
            checked={allVisibleSelected}
            onChange={toggleAllVisible}
            type="checkbox"
          />
          <span>
            <strong>Select visible</strong>
            <small>{selectedCount > 0 ? `${selectedCount} selected` : `${saints.length} visible in this queue`}</small>
          </span>
        </label>
        <div className="review-actions">
          {bulkActions.map((action) => (
            <button
              className={[
                "admin-form-button",
                action.variant === "secondary" ? "admin-form-button--secondary" : null,
                action.variant === "low-priority" ? "admin-form-button--low-priority" : null
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
          <article className="review-row review-row--compact review-row--selectable interactive-surface" key={saint.id}>
            <label className="bulk-review-checkbox">
              <input
                aria-label={`Select ${saint.displayName}`}
                checked={selectedIdSet.has(saint.id)}
                onChange={() => toggleSaint(saint.id)}
                type="checkbox"
              />
            </label>
            <Link className="review-row__link" href={`/admin/saints/${saint.slug}`}>
              <h2>{saint.displayName}</h2>
            </Link>
          </article>
        ))}
      </div>
    </form>
  );
}
