"use client";

import { Maximize2, X } from "lucide-react";
import type { ReactNode } from "react";
import { useId, useRef } from "react";

type AdminImageEditorDialogProps = {
  children: ReactNode;
  description?: string;
  title: string;
  triggerLabel?: string;
};

export function AdminImageEditorDialog({
  children,
  description,
  title,
  triggerLabel = "Open larger editor"
}: AdminImageEditorDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  return (
    <>
      <button
        className="admin-form-button admin-form-button--secondary admin-image-editor-dialog__trigger"
        type="button"
        onClick={() => dialogRef.current?.showModal()}
      >
        <Maximize2 aria-hidden="true" size={16} />
        {triggerLabel}
      </button>
      <dialog
        aria-labelledby={titleId}
        className="admin-image-editor-dialog"
        ref={dialogRef}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        <div className="admin-image-editor-dialog__panel">
          <div className="admin-image-editor-dialog__header">
            <div>
              <div className="eyebrow">Image editor</div>
              <h2 id={titleId}>{title}</h2>
              {description ? <p>{description}</p> : null}
            </div>
            <button
              aria-label="Close larger image editor"
              className="admin-image-editor-dialog__close"
              type="button"
              onClick={() => dialogRef.current?.close()}
            >
              <X aria-hidden="true" size={20} />
            </button>
          </div>
          <div className="admin-image-editor-dialog__body">{children}</div>
        </div>
      </dialog>
    </>
  );
}
