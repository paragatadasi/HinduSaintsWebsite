"use client";

import type { ReactNode } from "react";
import { useId, useRef, useState } from "react";

type ReviewEditToggleProps = {
  summary: ReactNode;
  children: ReactNode;
  editLabel?: string;
  editable?: boolean;
  summaryActions?: ReactNode;
};

export function ReviewEditToggle({
  summary,
  children,
  editLabel = "Edit",
  editable = true,
  summaryActions
}: ReviewEditToggleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const editorId = useId();
  const editButtonRef = useRef<HTMLButtonElement>(null);

  function startEditing() {
    setIsEditing(true);
    window.requestAnimationFrame(() => document.getElementById(editorId)?.querySelector<HTMLElement>("input, select, textarea, button")?.focus());
  }

  function stopEditing(event: React.MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.closest(".review-edit-toggle")?.querySelector("form[data-admin-dirty='true']");
    if (form && !window.confirm("Discard the unsaved changes in this section?")) return;
    setIsEditing(false);
    window.requestAnimationFrame(() => editButtonRef.current?.focus());
  }

  if (!editable) return <div className="review-edit-toggle">
    {summary}
    {summaryActions ? <div className="review-actions">{summaryActions}</div> : null}
  </div>;

  if (!isEditing) {
    return (
      <div className="review-edit-toggle">
        {summary}
        <div className="review-actions">
          <button aria-controls={editorId} aria-expanded="false" className="admin-form-button" ref={editButtonRef} type="button" onClick={startEditing}>
            {editLabel}
          </button>
          {summaryActions}
        </div>
      </div>
    );
  }

  return (
    <div className="review-edit-toggle">
      <div className="review-actions">
        <button aria-controls={editorId} aria-expanded="true" className="admin-form-button admin-form-button--secondary" type="button" onClick={stopEditing}>
          Cancel
        </button>
      </div>
      <div id={editorId}>{children}</div>
    </div>
  );
}
