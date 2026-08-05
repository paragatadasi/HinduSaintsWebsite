import Link from "next/link";
import type { Route } from "next";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { requireAdminUser } from "@/lib/admin-access";
import { hasCapability } from "@/lib/permissions";

export default async function AdminDashboardPage() {
  const user = await requireAdminUser();
  if (!hasCapability(user.roles, "view_content")) {
    return hasCapability(user.roles, "access_museum") ? <MuseumOnlyDashboard /> : <AccessLimitedDashboard />;
  }
  const [
    saintCounts,
    instagramNeedsReview,
    traditionsNeedsReview,
    placeCount,
    newFeedbackCount,
    myWorkCount,
    availableWorkCount,
    blockedWorkCount,
    completedWorkCount
  ] = await Promise.all([
    db.saint.groupBy({ by: ["status"], _count: { _all: true } }),
    db.instagramItem.count({ where: { status: "needs_review" } }),
    db.tradition.count({ where: { status: "needs_review" } }),
    db.place.count(),
    db.feedbackSubmission.count({ where: { status: "new" } }),
    db.contentAssignment.count({ where: { assigneeId: user.id, state: { in: ["assigned", "in_progress", "blocked"] } } }),
    db.contentAssignment.count({ where: { assigneeId: null, state: "assigned" } }),
    db.contentAssignment.count({ where: { assigneeId: user.id, state: "blocked" } }),
    db.contentAssignment.count({ where: { assigneeId: user.id, state: "completed" } })
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
        <DashboardCard href={"/admin/work" as Route} label="My active work" value={myWorkCount} />
        <DashboardCard href={"/admin/work" as Route} label="Available work" value={availableWorkCount} />
        <DashboardCard href={"/admin/work" as Route} label="My blocked work" value={blockedWorkCount} />
        <DashboardCard href={"/admin/work" as Route} label="My completed work" value={completedWorkCount} />
        <DashboardCard href="/admin/feedback?status=new" label="New feedback" value={newFeedbackCount} />
        <DashboardCard href="/admin/saints?status=needs_review" label="Saints awaiting review" value={counts.needs_review ?? 0} />
        <DashboardCard href="/admin/saints?status=published" label="Published saints" value={counts.published ?? 0} />
        <DashboardCard href="/admin/instagram?status=needs_review" label="Instagram items awaiting review" value={instagramNeedsReview} />
        <DashboardCard href="/admin/traditions" label="Traditions awaiting review" value={traditionsNeedsReview} />
        <DashboardCard href="/admin/places" label="Place records" value={placeCount} />
      </div>

    </div>
  );
}

function MuseumOnlyDashboard() {
  return <div className="admin-stack"><div><div className="eyebrow">Dashboard</div><h1>Museum workspace</h1><p className="lede">Your current role is focused on Museum planning and curation.</p></div><div className="admin-stat-grid"><Link className="admin-stat admin-stat--link interactive-surface" href="/museumadmin"><StatusBadge label="Curator" /><h2>Open Museum Admin</h2></Link></div></div>;
}

function AccessLimitedDashboard() {
  return <div className="admin-stack"><div><div className="eyebrow">Dashboard</div><h1>No workspace assigned</h1><p className="lede">Your account is active, but its current roles do not grant an admin workspace.</p></div></div>;
}
function DashboardCard({ href, label, value }: { href: Route; label: string; value: number }) {
  return (
    <Link className="admin-stat admin-stat--link interactive-surface" href={href}>
      <StatusBadge label={String(value)} />
      <h2>{label}</h2>
    </Link>
  );
}

