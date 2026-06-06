import { StatusBadge } from "@/components/ui/status-badge";

const widgets = [
  ["Unmatched Instagram items", "3"],
  ["Low-confidence matches", "2"],
  ["Saints missing required fields", "8"],
  ["Biographies awaiting review", "1"],
  ["Sampradaya drafts", "3"],
  ["Recently edited", "5"]
];

export default function AdminDashboardPage() {
  return (
    <div className="site-grid">
      <div>
        <div className="eyebrow">Dashboard</div>
        <h1>Content workflow</h1>
        <p className="lede">This shell will become the protected CMS for volunteers, reviewers, and admins.</p>
      </div>
      <div className="card-grid">
        {widgets.map(([label, count]) => (
          <article key={label} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "var(--space-4)" }}>
            <StatusBadge label={count} />
            <h3>{label}</h3>
          </article>
        ))}
      </div>
    </div>
  );
}
