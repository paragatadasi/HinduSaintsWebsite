"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import type { AssignmentState } from "@/lib/generated/prisma/client";

type AssignmentUpdateButtonProps = {
  defaultAssigneeId?: string | null;
  defaultBlockedReason?: string | null;
  defaultStatus: AssignmentState;
};

export function AssignmentUpdateButton({
  defaultAssigneeId,
  defaultBlockedReason,
  defaultStatus
}: AssignmentUpdateButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [eligible, setEligible] = useState(false);
  const { pending } = useFormStatus();

  useEffect(() => {
    const form = buttonRef.current?.form;
    if (!form) return;
    let frame = 0;

    const updateEligibility = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const data = new FormData(form);
        const statusChanged = data.get("taskStatus") !== defaultStatus;
        const reasonChanged = String(data.get("blockedReason") ?? "").trim() !== (defaultBlockedReason ?? "").trim();
        const assigneeChanged = data.has("assigneeId") && data.get("assigneeId") !== (defaultAssigneeId ?? "");
        const controlsAreValid = Array.from(form.elements).every((element) => {
          if (!(element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement)) return true;
          return element.validity.valid;
        });
        setEligible((statusChanged || reasonChanged || assigneeChanged) && controlsAreValid);
      });
    };

    form.addEventListener("change", updateEligibility);
    form.addEventListener("input", updateEligibility);
    updateEligibility();
    return () => {
      window.cancelAnimationFrame(frame);
      form.removeEventListener("change", updateEligibility);
      form.removeEventListener("input", updateEligibility);
    };
  }, [defaultAssigneeId, defaultBlockedReason, defaultStatus]);

  return (
    <button
      className={`admin-form-button${eligible ? "" : " admin-form-button--secondary"}`}
      disabled={!eligible || pending}
      ref={buttonRef}
      type="submit"
    >
      {pending ? "Updating…" : "Update"}
    </button>
  );
}
