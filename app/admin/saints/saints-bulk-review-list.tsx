"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { bulkDeleteSaints, bulkUpdateSaintReviewStatus } from "./actions";

type SaintReviewRow = {
  id: string;
  slug: string;
  displayName: string;
  birthDateRaw: string | null;
  samadhiDateRaw: string | null;
};

type SaintsBulkReviewListProps = {
  saints: SaintReviewRow[];
  returnTo: string;
};

const bulkActions = [
  { status: "published", label: "Publish", variant: "primary" },
  { status: "draft", label: "Unpublish", variant: "secondary" },
  { status: "archived", label: "Archive", variant: "low-priority" }
] as const;

export function SaintsBulkReviewList({ saints, returnTo }: SaintsBulkReviewListProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleteArmed, setIsDeleteArmed] = useState(false);
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

  function armDelete() {
    setIsDeleteArmed(true);
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
    <div className="bulk-review-form">
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
        <div className="bulk-review-actions">
          <form action={bulkUpdateSaintReviewStatus} className="review-actions">
            <BulkReviewHiddenFields returnTo={returnTo} saintIds={selectedIds} />
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
          </form>
          <form action={bulkDeleteSaints} className="bulk-delete-form">
            <BulkReviewHiddenFields returnTo={returnTo} saintIds={selectedIds} />
            {isDeleteArmed ? (
              <label className="bulk-delete-password">
                <span>Delete password</span>
                <input
                  autoComplete="off"
                  name="bulkDeletePassword"
                  placeholder="Required to remove selected saints"
                  required
                  type="password"
                />
              </label>
            ) : null}
            <button
              className="admin-form-button admin-form-button--low-priority"
              disabled={selectedCount === 0}
              onClick={isDeleteArmed ? undefined : armDelete}
              type={isDeleteArmed ? "submit" : "button"}
            >
              {isDeleteArmed ? `Remove ${selectedCount} saints` : "Remove"}
            </button>
          </form>
        </div>
      </div>

      <div className="review-list">
        {saints.map((saint) => {
          const saintDates = formatSaintDates(saint);

          return (
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
                <h2 className="review-row__title">
                  <span>{saint.displayName}</span>
                  {saintDates ? <small>({saintDates})</small> : null}
                </h2>
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function formatSaintDates(saint: SaintReviewRow) {
  return [
    saint.birthDateRaw,
    saint.samadhiDateRaw
  ].filter(Boolean).join(" - ");
}

function BulkReviewHiddenFields({ returnTo, saintIds }: { returnTo: string; saintIds: string[] }) {
  return (
    <>
      <input name="returnTo" type="hidden" value={returnTo} />
      {saintIds.map((saintId) => (
        <input key={saintId} name="saintIds" type="hidden" value={saintId} />
      ))}
    </>
  );
}
