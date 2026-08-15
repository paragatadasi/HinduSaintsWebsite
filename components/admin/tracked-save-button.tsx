"use client";

import clsx from "clsx";
import { useFormStatus } from "react-dom";

type TrackedSaveButtonProps = {
  dirty: boolean;
  saveLabel: string;
};

export function TrackedSaveButton({ dirty, saveLabel }: TrackedSaveButtonProps) {
  const { pending } = useFormStatus();
  const actionable = dirty && !pending;

  return (
    <button
      className={clsx("admin-form-button", !actionable && "admin-form-button--secondary")}
      disabled={!dirty || pending}
      type="submit"
    >
      {pending ? "Saving…" : dirty ? saveLabel : "Saved"}
    </button>
  );
}
