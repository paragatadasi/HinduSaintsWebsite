"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getInstagramLinkProps } from "@/lib/external-links";
import type { InstagramQueueStatus } from "@/lib/instagram-admin-queue";
import { bulkDeleteInstagramItems } from "./actions";

type InstagramReviewRow = {
  id: string;
  instagramUrl: string;
  previewAlt: string;
  previewLabel: string;
  previewUrl?: string | null;
  summary: string;
  title: string;
};

type InstagramBulkReviewListProps = {
  activeStatus: InstagramQueueStatus;
  emptyMessage: string;
  items: InstagramReviewRow[];
  query: string;
  returnTo: string;
  totalMatchingCount: number;
};

export function InstagramBulkReviewList({
  activeStatus,
  emptyMessage,
  items,
  query,
  returnTo,
  totalMatchingCount
}: InstagramBulkReviewListProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [allMatchingSelected, setAllMatchingSelected] = useState(false);
  const [isDeleteArmed, setIsDeleteArmed] = useState(false);
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedCount = allMatchingSelected ? totalMatchingCount : selectedIds.length;
  const allVisibleSelected = items.length > 0 && (allMatchingSelected || selectedIds.length === items.length);
  const canSelectAllMatching = allVisibleSelected && !allMatchingSelected && totalMatchingCount > items.length;

  function toggleItem(itemId: string) {
    if (allMatchingSelected) {
      setAllMatchingSelected(false);
      setSelectedIds(items.filter((item) => item.id !== itemId).map((item) => item.id));
      setIsDeleteArmed(false);
      return;
    }

    setSelectedIds((current) => (
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId]
    ));
  }

  function toggleAllVisible() {
    setAllMatchingSelected(false);
    setSelectedIds(allVisibleSelected ? [] : items.map((item) => item.id));
    setIsDeleteArmed(false);
  }

  function selectAllMatching() {
    setAllMatchingSelected(true);
    setSelectedIds([]);
    setIsDeleteArmed(false);
  }

  function clearSelection() {
    setAllMatchingSelected(false);
    setSelectedIds([]);
    setIsDeleteArmed(false);
  }

  function armDelete() {
    setIsDeleteArmed(true);
  }

  if (items.length === 0) {
    return (
      <div className="admin-review-empty">
        <h2>No imported Instagram items in this queue</h2>
        <p>{emptyMessage}</p>
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
            <strong>{allMatchingSelected ? "All matching selected" : "Select visible"}</strong>
            <small>
              {allMatchingSelected
                ? `All ${totalMatchingCount.toLocaleString()} matching items selected`
                : selectedCount > 0
                  ? `${selectedCount.toLocaleString()} selected on this page`
                  : `${items.length.toLocaleString()} visible on this page`}
            </small>
          </span>
        </label>
        <div className="bulk-review-actions">
          {canSelectAllMatching ? (
            <button
              className="admin-form-button admin-form-button--secondary"
              onClick={selectAllMatching}
              type="button"
            >
              Select all {totalMatchingCount.toLocaleString()} matching items
            </button>
          ) : null}
          {allMatchingSelected ? (
            <button
              className="admin-form-button admin-form-button--secondary"
              onClick={clearSelection}
              type="button"
            >
              Clear selection
            </button>
          ) : null}
          <form action={bulkDeleteInstagramItems} className="bulk-delete-form">
            <BulkReviewHiddenFields
              activeStatus={activeStatus}
              allMatchingSelected={allMatchingSelected}
              itemIds={selectedIds}
              query={query}
              returnTo={returnTo}
            />
            {isDeleteArmed ? (
              <label className="bulk-delete-password">
                <span>Delete password</span>
                <input
                  autoComplete="off"
                  name="bulkDeletePassword"
                  placeholder="Required to remove selected items"
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
              {isDeleteArmed ? `Remove ${selectedCount.toLocaleString()} items` : "Remove"}
            </button>
          </form>
        </div>
      </div>

      <div className="instagram-review-list">
        {items.map((item) => (
          <InstagramReviewCard
            item={item}
            key={item.id}
            selected={allMatchingSelected || selectedIdSet.has(item.id)}
            toggleItem={toggleItem}
          />
        ))}
      </div>
    </div>
  );
}

function InstagramReviewCard({
  item,
  selected,
  toggleItem
}: {
  item: InstagramReviewRow;
  selected: boolean;
  toggleItem: (itemId: string) => void;
}) {
  return (
    <article className="instagram-review-card instagram-review-card--compact instagram-review-card--selectable interactive-surface">
      <label className="bulk-review-checkbox instagram-review-card__checkbox">
        <input
          aria-label={`Select ${item.title}`}
          checked={selected}
          onChange={() => toggleItem(item.id)}
          type="checkbox"
        />
      </label>
      <Link className="instagram-review-card__media" href={`/admin/instagram/${item.id}`} aria-label={`Review ${item.title}`}>
        {item.previewUrl ? (
          <img src={item.previewUrl} alt={item.previewAlt} />
        ) : (
          <span>{item.previewLabel}</span>
        )}
      </Link>
      <span className="instagram-review-card__body">
        <Link className="instagram-review-card__link" href={`/admin/instagram/${item.id}`}>
          <span className="instagram-review-card__title">{item.title}</span>
          <span className="instagram-review-card__caption">{item.summary}</span>
        </Link>
        <span className="instagram-review-card__actions">
          <Link className="admin-form-button" href={`/admin/instagram/${item.id}`}>Review</Link>
          <a className="admin-form-button admin-form-button--outline" href={item.instagramUrl} {...getInstagramLinkProps(item.instagramUrl)}>Open on Instagram</a>
        </span>
      </span>
    </article>
  );
}

function BulkReviewHiddenFields({
  activeStatus,
  allMatchingSelected,
  itemIds,
  query,
  returnTo
}: {
  activeStatus: InstagramQueueStatus;
  allMatchingSelected: boolean;
  itemIds: string[];
  query: string;
  returnTo: string;
}) {
  return (
    <>
      <input name="returnTo" type="hidden" value={returnTo} />
      <input name="selectionMode" type="hidden" value={allMatchingSelected ? "matching" : "visible"} />
      {allMatchingSelected ? <input name="status" type="hidden" value={activeStatus} /> : null}
      {allMatchingSelected && query ? <input name="query" type="hidden" value={query} /> : null}
      {itemIds.map((itemId) => (
        <input key={itemId} name="instagramItemIds" type="hidden" value={itemId} />
      ))}
    </>
  );
}
