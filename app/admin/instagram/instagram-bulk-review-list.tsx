"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getInstagramLinkProps } from "@/lib/external-links";
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
  emptyMessage: string;
  items: InstagramReviewRow[];
  returnTo: string;
};

export function InstagramBulkReviewList({ emptyMessage, items, returnTo }: InstagramBulkReviewListProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleteArmed, setIsDeleteArmed] = useState(false);
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedCount = selectedIds.length;
  const allVisibleSelected = items.length > 0 && selectedCount === items.length;

  function toggleItem(itemId: string) {
    setSelectedIds((current) => (
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId]
    ));
  }

  function toggleAllVisible() {
    setSelectedIds(allVisibleSelected ? [] : items.map((item) => item.id));
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
            <strong>Select visible</strong>
            <small>{selectedCount > 0 ? `${selectedCount} selected` : `${items.length} visible in this queue`}</small>
          </span>
        </label>
        <div className="bulk-review-actions">
          <form action={bulkDeleteInstagramItems} className="bulk-delete-form">
            <BulkReviewHiddenFields itemIds={selectedIds} returnTo={returnTo} />
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
              {isDeleteArmed ? `Remove ${selectedCount} items` : "Remove"}
            </button>
          </form>
        </div>
      </div>

      <div className="instagram-review-list">
        {items.map((item) => (
          <InstagramReviewCard
            item={item}
            key={item.id}
            selected={selectedIdSet.has(item.id)}
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

function BulkReviewHiddenFields({ itemIds, returnTo }: { itemIds: string[]; returnTo: string }) {
  return (
    <>
      <input name="returnTo" type="hidden" value={returnTo} />
      {itemIds.map((itemId) => (
        <input key={itemId} name="instagramItemIds" type="hidden" value={itemId} />
      ))}
    </>
  );
}
