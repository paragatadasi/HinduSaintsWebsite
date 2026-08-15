"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FocalImage } from "@/components/ui/focal-image";
import { StatusBadge } from "@/components/ui/status-badge";
import { bulkDeleteSaints, bulkUpdateSaintReviewStatus, bulkUpdateSaintTeamVisibility } from "./actions";

type SaintReviewRow = {
  id: string;
  slug: string;
  displayName: string;
  birthDateRaw: string | null;
  samadhiDateRaw: string | null;
  teamVisibility: string;
  publicationStatus: string;
  workflowStatus: string;
  primaryImage: {
    focalX: number;
    focalY: number;
    height: number | null;
    url: string;
    width: number | null;
  } | null;
  matchStatus: "matched" | "unmatched";
};

type SaintsBulkReviewListProps = {
  canDelete: boolean;
  canManagePublication: boolean;
  canManageVisibility: boolean;
  saints: SaintReviewRow[];
  returnTo: string;
  showMatch: boolean;
  showThumbnail: boolean;
  showVisibility: boolean;
};

const publicationActions = [
  { status: "published", label: "Publish", variant: "primary" },
  { status: "draft", label: "Unpublish", variant: "secondary" },
  { status: "archived", label: "Archive", variant: "low-priority" }
] as const;

export function SaintsBulkReviewList({
  canDelete,
  canManagePublication,
  canManageVisibility,
  saints,
  returnTo,
  showMatch,
  showThumbnail,
  showVisibility
}: SaintsBulkReviewListProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleteArmed, setIsDeleteArmed] = useState(false);
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedCount = selectedIds.length;
  const selectedHasPublishedSaint = saints.some((saint) => selectedIdSet.has(saint.id) && saint.publicationStatus === "published");
  const allVisibleSelected = saints.length > 0 && selectedCount === saints.length;
  const hasBulkActions = canDelete || canManagePublication || canManageVisibility;

  if (saints.length === 0) {
    return <div className="admin-review-empty"><h2>No saints match this view</h2><p>Try another workflow, filter, or search.</p></div>;
  }

  return (
    <div className="bulk-review-form">
      {hasBulkActions ? (
        <div className="bulk-review-panel" data-has-selection={selectedCount > 0 ? "true" : "false"}>
          <label className="bulk-review-select-all">
            <input checked={allVisibleSelected} onChange={toggleAllVisible} type="checkbox" />
            <span><strong>Select visible</strong><small>{selectedCount > 0 ? `${selectedCount} selected` : `${saints.length} visible in this view`}</small></span>
          </label>
          <div className="bulk-review-actions">
            {canManageVisibility ? (
              <form action={bulkUpdateSaintTeamVisibility} className="review-actions">
                <BulkReviewHiddenFields returnTo={returnTo} saintIds={selectedIds} />
                <button className="admin-form-button admin-form-button--secondary" disabled={selectedCount === 0} name="teamVisibility" type="submit" value="public">Mark Public</button>
                <button
                  className="admin-form-button admin-form-button--low-priority"
                  disabled={selectedCount === 0 || selectedHasPublishedSaint}
                  name="teamVisibility"
                  title={selectedHasPublishedSaint ? "Published saints must remain Public to the team. Unpublish them first." : undefined}
                  type="submit"
                  value="private"
                >
                  Mark Private
                </button>
              </form>
            ) : null}
            {canManagePublication ? (
              <form action={bulkUpdateSaintReviewStatus} className="review-actions">
                <BulkReviewHiddenFields returnTo={returnTo} saintIds={selectedIds} />
                {publicationActions.map((action) => (
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
            ) : null}
            {canDelete ? (
              <form action={bulkDeleteSaints} className="bulk-delete-form">
                <BulkReviewHiddenFields returnTo={returnTo} saintIds={selectedIds} />
                {isDeleteArmed ? (
                  <label className="bulk-delete-password">
                    <span>Sensitive-action password</span>
                    <input autoComplete="off" name="bulkDeletePassword" placeholder="Required to remove selected saints" required type="password" />
                  </label>
                ) : null}
                <button
                  className="admin-form-button admin-form-button--low-priority"
                  disabled={selectedCount === 0}
                  onClick={isDeleteArmed ? undefined : () => setIsDeleteArmed(true)}
                  type={isDeleteArmed ? "submit" : "button"}
                >
                  {isDeleteArmed ? `Remove ${selectedCount} saints` : "Remove"}
                </button>
              </form>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="review-list">
        {saints.map((saint) => {
          const saintDates = formatSaintDates(saint);
          return (
            <article className={`review-row review-row--compact${hasBulkActions ? " review-row--selectable" : ""}${showThumbnail ? " review-row--with-thumbnail" : ""} interactive-surface`} key={saint.id}>
              {hasBulkActions ? (
                <label className="bulk-review-checkbox">
                  <input aria-label={`Select ${saint.displayName}`} checked={selectedIdSet.has(saint.id)} onChange={() => toggleSaint(saint.id)} type="checkbox" />
                </label>
              ) : null}
              <Link className="review-row__link" href={`/admin/saints/${saint.slug}`}>
                {showThumbnail ? <SaintQueueThumbnail saint={saint} /> : null}
                <div>
                  <h2 className="review-row__title"><span>{saint.displayName}</span>{saintDates ? <small>({saintDates})</small> : null}</h2>
                  <div className="review-meta">
                    {showVisibility ? <StatusBadge label={formatLabel(saint.teamVisibility)} /> : null}
                    <StatusBadge label={formatLabel(saint.publicationStatus)} />
                    <StatusBadge label={formatLabel(saint.workflowStatus)} />
                    {showMatch ? <StatusBadge label={formatLabel(saint.matchStatus)} /> : null}
                  </div>
                </div>
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );

  function toggleSaint(saintId: string) {
    setSelectedIds((current) => current.includes(saintId) ? current.filter((id) => id !== saintId) : [...current, saintId]);
  }

  function toggleAllVisible() {
    setSelectedIds(allVisibleSelected ? [] : saints.map((saint) => saint.id));
  }
}

function SaintQueueThumbnail({ saint }: { saint: SaintReviewRow }) {
  const image = saint.primaryImage;

  return (
    <span aria-hidden="true" className={`review-row__thumbnail${image ? "" : " review-row__thumbnail--placeholder"}`}>
      <FocalImage
        alt=""
        cropAspect={1}
        focalPoint={image ? { x: image.focalX, y: image.focalY } : undefined}
        height={image?.height ?? undefined}
        src={image?.url ?? "/images/hindu-saints-logo.png"}
        width={image?.width ?? undefined}
      />
    </span>
  );
}

function formatSaintDates(saint: SaintReviewRow) {
  return [saint.birthDateRaw, saint.samadhiDateRaw].filter(Boolean).join(" – ");
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

function BulkReviewHiddenFields({ returnTo, saintIds }: { returnTo: string; saintIds: string[] }) {
  return <><input name="returnTo" type="hidden" value={returnTo} />{saintIds.map((saintId) => <input key={saintId} name="saintIds" type="hidden" value={saintId} />)}</>;
}
