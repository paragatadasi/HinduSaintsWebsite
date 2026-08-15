"use client";

import { UserRoundMinus, X } from "lucide-react";
import { useFormStatus } from "react-dom";
import { useId, useRef } from "react";
import { leaveAssignment } from "@/app/admin/work/actions";

type AssignmentLeaveControlProps = {
  assignmentId: string;
  contentLabel?: string;
  returnTo?: string;
};

export function AssignmentLeaveControl({
  assignmentId,
  contentLabel = "this task",
  returnTo
}: AssignmentLeaveControlProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const descriptionId = useId();
  const titleId = useId();

  return (
    <div className="assignment-leave">
      <button
        className="admin-form-button admin-form-button--secondary assignment-leave__trigger"
        type="button"
        onClick={() => dialogRef.current?.showModal()}
      >
        <UserRoundMinus aria-hidden="true" size={16} />
        Leave task
      </button>
      <dialog
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        className="admin-image-editor-dialog assignment-leave__dialog"
        ref={dialogRef}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        <div className="admin-image-editor-dialog__panel assignment-leave__dialog-panel">
          <div className="admin-image-editor-dialog__header">
            <div className="assignment-leave__copy">
              <div className="eyebrow">Assignment</div>
              <h2 id={titleId}>Leave this task?</h2>
              <p id={descriptionId}>
                {contentLabel} will become available from its content review page so another contributor can claim it. Its task status, blocking reason, and content edits will stay intact.
              </p>
            </div>
            <button
              aria-label="Close leave task confirmation"
              className="admin-image-editor-dialog__close"
              type="button"
              onClick={() => dialogRef.current?.close()}
            >
              <X aria-hidden="true" size={20} />
            </button>
          </div>
          <form action={leaveAssignment} className="review-actions assignment-leave__actions">
            <input name="assignmentId" type="hidden" value={assignmentId} />
            {returnTo ? <input name="returnTo" type="hidden" value={returnTo} /> : null}
            <button
              autoFocus
              className="admin-form-button admin-form-button--secondary"
              type="button"
              onClick={() => dialogRef.current?.close()}
            >
              Keep task
            </button>
            <LeaveTaskSubmit />
          </form>
        </div>
      </dialog>
    </div>
  );
}

function LeaveTaskSubmit() {
  const { pending } = useFormStatus();
  return (
    <button className="admin-form-button assignment-leave__confirm" disabled={pending} type="submit">
      <UserRoundMinus aria-hidden="true" size={16} />
      {pending ? "Leaving…" : "Leave task"}
    </button>
  );
}
