export function StatusBadge({ label }: { label: string }) {
  return (
    <span
      style={{
        background: "var(--color-surface-muted)",
        border: "1px solid var(--color-border)",
        borderRadius: 999,
        color: "var(--color-muted)",
        display: "inline-flex",
        fontSize: "0.78rem",
        fontWeight: 700,
        padding: "0.2rem 0.55rem"
      }}
    >
      {label}
    </span>
  );
}
