import type { ReactNode } from "react";

export function Card({ children }: { children: ReactNode }) {
  return (
    <article
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-soft)",
        padding: "var(--space-5, 1.25rem)"
      }}
    >
      {children}
    </article>
  );
}
