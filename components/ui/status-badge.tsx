import clsx from "clsx";

export function StatusBadge({ className, label }: { className?: string; label: string }) {
  return <span className={clsx("status-badge", className)}>{label}</span>;
}
