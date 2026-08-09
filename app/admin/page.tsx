import Link from "next/link";
import type { Route } from "next";
import { AssignmentWorkspace } from "@/components/admin/assignment-workspace";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { requireAdminUser } from "@/lib/admin-access";
import { hasCapability } from "@/lib/permissions";
import { canAccessSaintCatalog, getAdminSaintCatalogScope, saintCatalogWhere, type SaintCatalogScope } from "@/lib/admin-saint-access";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminDashboardPage({ searchParams }: Props) {
  const user = await requireAdminUser();
  const canViewContent = hasCapability(user.roles, "view_content");
  const canViewInstagram = hasCapability(user.roles, "view_instagram_review");
  const canViewSaints = canAccessSaintCatalog(user.roles);
  if (!canViewSaints && !canViewContent) {
    return hasCapability(user.roles, "access_museum") ? <MuseumOnlyDashboard /> : <AccessLimitedDashboard />;
  }
  const params = await searchParams;
  const canManageAssignments = hasCapability(user.roles, "manage_assignments");
  const canClaimAssignments = hasCapability(user.roles, "self_assign_content") || hasCapability(user.roles, "edit_content");
  const saintScope = getAdminSaintCatalogScope(user.roles);
  const [
    saintCounts,
    instagramNeedsReview,
    traditionsNeedsReview,
    placeCount,
    newFeedbackCount,
    assignmentRows
  ] = await Promise.all([
    db.saint.groupBy({ by: ["workflowStatus"], where: { teamVisibility: "public" }, _count: { _all: true } }),
    canViewInstagram ? db.instagramItem.count({ where: { status: "needs_review" } }) : Promise.resolve(0),
    canViewContent ? db.tradition.count({ where: { status: "needs_review" } }) : Promise.resolve(0),
    canViewContent ? db.place.count() : Promise.resolve(0),
    canViewContent ? db.feedbackSubmission.count({ where: { status: "new" } }) : Promise.resolve(0),
    db.contentAssignment.findMany({
      where: { OR: [{ assigneeId: user.id }, { assigneeId: null, state: "assigned" }] },
      select: { assigneeId: true, contentId: true, contentType: true, state: true }
    })
  ]);
  const counts = Object.fromEntries(saintCounts.map((row) => [row.workflowStatus, row._count._all]));
  const visibleAssignments = await filterVisibleAssignments(assignmentRows, { canViewContent, canViewInstagram, saintScope });
  const myWorkCount = visibleAssignments.filter((row) => row.assigneeId === user.id && ["assigned", "in_progress", "blocked"].includes(row.state)).length;
  const availableWorkCount = visibleAssignments.filter((row) => !row.assigneeId && row.state === "assigned").length;
  const blockedWorkCount = visibleAssignments.filter((row) => row.assigneeId === user.id && row.state === "blocked").length;
  const completedWorkCount = visibleAssignments.filter((row) => row.assigneeId === user.id && row.state === "completed").length;

  return (
    <div className="admin-stack">
      <div>
        <div className="eyebrow">Dashboard</div>
        <h1>Content workflow</h1>
        <p className="lede">Review shared queues, track your own workload, and coordinate assignments from one workspace.</p>
      </div>

      <section className="admin-stack" aria-labelledby="team-workflow-title">
        <div>
          <div className="eyebrow">Shared queues</div>
          <h2 id="team-workflow-title">Team Workflow</h2>
          <p className="lede">See the editorial queues and published records the whole team is moving forward.</p>
        </div>
        <div className="admin-stat-grid">
          {canViewContent ? <DashboardCard href="/admin/feedback?status=new" label="New feedback" value={newFeedbackCount} /> : null}
          <DashboardCard href="/admin/saints?scope=public&workflow=needs_review" label="Saints needing review" value={counts.needs_review ?? 0} />
          <DashboardCard href="/admin/saints?scope=public&workflow=fact_checked" label="Fact-checked saints" value={counts.fact_checked ?? 0} />
          <DashboardCard href="/admin/saints?scope=public&workflow=populated" label="Populated saints" value={counts.populated ?? 0} />
          <DashboardCard href="/admin/saints?scope=public&workflow=polished" label="Polished saints" value={counts.polished ?? 0} />
          {canViewInstagram ? <DashboardCard href="/admin/instagram?status=needs_review" label="Instagram items awaiting review" value={instagramNeedsReview} /> : null}
          {canViewContent ? <DashboardCard href="/admin/traditions" label="Traditions awaiting review" value={traditionsNeedsReview} /> : null}
          {canViewContent ? <DashboardCard href="/admin/places" label="Place records" value={placeCount} /> : null}
          {hasCapability(user.roles, "access_museum") ? <DashboardLink href="/admin/museum" label="Museum workspace" badge="Curator" /> : null}
        </div>
      </section>

      <section className="admin-stack" aria-labelledby="personal-workflow-title">
        <div>
          <div className="eyebrow">Personal queues</div>
          <h2 id="personal-workflow-title">My Workflow</h2>
          <p className="lede">Jump directly to the assignment queue that needs your attention.</p>
        </div>
        <div className="admin-stat-grid">
          <DashboardCard href={"/admin?work=mine#my-work" as Route} label="My active work" value={myWorkCount} />
          <DashboardCard href={"/admin?work=available#my-work" as Route} label="Available work" value={availableWorkCount} />
          <DashboardCard href={"/admin?work=blocked#my-work" as Route} label="My blocked work" value={blockedWorkCount} />
          <DashboardCard href={"/admin?work=completed#my-work" as Route} label="My completed work" value={completedWorkCount} />
        </div>
      </section>

      <AssignmentWorkspace
        canClaim={canClaimAssignments}
        canManage={canManageAssignments}
        canViewContent={canViewContent}
        canViewInstagram={canViewInstagram}
        params={params}
        saintScope={saintScope}
        userId={user.id}
      />
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
      <h3>{label}</h3>
    </Link>
  );
}

function DashboardLink({ href, label, badge }: { href: Route; label: string; badge: string }) {
  return <Link className="admin-stat admin-stat--link interactive-surface" href={href}><StatusBadge label={badge} /><h3>{label}</h3></Link>;
}

async function filterVisibleAssignments<T extends { contentId: string; contentType: string }>(
  rows: T[],
  access: { canViewContent: boolean; canViewInstagram: boolean; saintScope: SaintCatalogScope }
) {
  const ids = (type: string) => rows.filter((row) => row.contentType === type).map((row) => row.contentId);
  const [saints, traditions, places, posts] = await Promise.all([
    db.saint.findMany({ where: { id: { in: ids("saint") }, ...saintCatalogWhere(access.saintScope) }, select: { id: true } }),
    access.canViewContent ? db.tradition.findMany({ where: { id: { in: ids("tradition") } }, select: { id: true } }) : Promise.resolve([]),
    access.canViewContent ? db.place.findMany({ where: { id: { in: ids("place") } }, select: { id: true } }) : Promise.resolve([]),
    access.canViewInstagram ? db.instagramItem.findMany({ where: { id: { in: ids("instagram_item") } }, select: { id: true } }) : Promise.resolve([])
  ]);
  const visible = new Set([
    ...saints.map((row) => `saint:${row.id}`),
    ...traditions.map((row) => `tradition:${row.id}`),
    ...places.map((row) => `place:${row.id}`),
    ...posts.map((row) => `instagram_item:${row.id}`)
  ]);
  return rows.filter((row) => visible.has(`${row.contentType}:${row.contentId}`));
}

