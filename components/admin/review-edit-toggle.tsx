"use client";

import type { ReactNode } from "react";
import { useState } from "react";

type ReviewEditToggleProps = {
  summary: ReactNode;
  children: ReactNode;
  editLabel?: string;
};

export function ReviewEditToggle({
  summary,
  children,
  editLabel = "Edit"
}: ReviewEditToggleProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (!isEditing) {
    return (
      <div className="review-edit-toggle">
        {summary}
        <div className="review-actions">
          <button className="admin-form-button" type="button" onClick={() => setIsEditing(true)}>
            {editLabel}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="review-edit-toggle">
      <div className="review-actions">
        <button className="admin-form-button admin-form-button--secondary" type="button" onClick={() => setIsEditing(false)}>
          Cancel
        </button>
      </div>
      {children}
    </div>
  );
}
