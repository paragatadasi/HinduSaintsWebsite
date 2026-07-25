"use client";

import { useFormStatus } from "react-dom";

type AirtableSubmitButtonProps = {
  children: React.ReactNode;
  pendingLabel: string;
  variant?: "primary" | "secondary" | "danger";
};

export function AirtableSubmitButton({
  children,
  pendingLabel,
  variant = "primary"
}: AirtableSubmitButtonProps) {
  const { pending } = useFormStatus();
  const className = variant === "primary"
    ? "admin-form-button"
    : `admin-form-button admin-form-button--${variant}`;

  return (
    <button className={className} disabled={pending} type="submit">
      {pending ? pendingLabel : children}
    </button>
  );
}
