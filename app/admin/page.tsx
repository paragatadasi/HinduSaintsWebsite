import Link from "next/link";
import type { Route } from "next";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";

export default async function AdminDashboardPage() {
  const [saintCounts, instagramNeedsReview, traditionsNeedsReview, placeCount] = await Promise.all([
    db.saint.groupBy({ by: ["status"], _count: { _all: true } }),
    db.instagramItem.count({ where: { status: "needs_review" } }),
    db.tradition.count({ where: { status: "needs_review" } }),
    db.place.count()
  ]);
  const counts = Object.fromEntries(saintCounts.map((row) => [row.status, row._count._all]));

  return (
    <div className="admin-stack">
      <div>
        <div className="eyebrow">Dashboard</div>
        <h1>Content workflow</h1>
        <p className="lede">Review imported records, approve public saint pages, and track remaining reconciliation work.</p>
      </div>
      <div className="admin-stat-grid">
        <DashboardCard href="/admin/saints?status=needs_review" label="Saints awaiting review" value={counts.needs_review ?? 0} />
        <DashboardCard href="/admin/saints?status=published" label="Published saints" value={counts.published ?? 0} />
        <DashboardCard href="/admin/instagram?status=needs_review" label="Instagram items awaiting review" value={instagramNeedsReview} />
        <DashboardCard href="/admin/traditions" label="Traditions awaiting review" value={traditionsNeedsReview} />
        <DashboardCard href="/admin/places" label="Place records" value={placeCount} />
      </div>
    </div>
  );
}

function DashboardCard({ href, label, value }: { href: Route; label: string; value: number }) {
  return (
    <Link className="admin-stat admin-stat--link interactive-surface" href={href}>
      <StatusBadge label={String(value)} />
      <h2>{label}</h2>
    </Link>
  );
}
