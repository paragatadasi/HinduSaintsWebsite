import Link from "next/link";
import type { ReactNode } from "react";

type ButtonProps = {
  href: string;
  children: ReactNode;
  icon?: ReactNode;
  variant?: "primary" | "secondary";
};

export function Button({ href, children, icon, variant = "primary" }: ButtonProps) {
  const isPrimary = variant === "primary";

  return (
    <Link
      href={href}
      style={{
        alignItems: "center",
        background: isPrimary ? "var(--color-accent)" : "var(--color-surface)",
        border: `1px solid ${isPrimary ? "var(--color-accent)" : "var(--color-border)"}`,
        borderRadius: "var(--radius-md)",
        color: isPrimary ? "white" : "var(--color-text)",
        display: "inline-flex",
        fontWeight: 700,
        gap: "var(--space-2)",
        minHeight: 44,
        padding: "0 var(--space-4)"
      }}
    >
      {icon}
      {children}
    </Link>
  );
}
