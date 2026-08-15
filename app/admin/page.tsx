import Link from "next/link";
import type { Route } from "next";
import { AssignmentWorkspace } from "@/components/admin/assignment-workspace";
import { EditorialReviewQueue } from "@/components/admin/editorial-review-queue";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { requireAdminUser } from "@/lib/admin-access";
import { canReviewEditorialRevisions, hasCapability } from "@/lib/permissions";
import { canAccessSaintCatalog, getAdminSaintCatalogScope } from "@/lib/admin-saint-access";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminDashboardPage({ searchParams }: Props) {
  const user = await requireAdminUser();
  const canViewContent = hasCapability(user.roles, "view_content");
  const canViewFeedbackInbox = hasCapability(user.roles, "view_feedback_inbox");
  const canViewInstagram = hasCapability(user.roles, "view_instagram_review");
  const canViewSaints = canAccessSaintCatalog(user.roles);
  if (!canViewSaints && !canViewContent) {
    return hasCapability(user.roles, "access_museum") ? <MuseumOnlyDashboard /> : <AccessLimitedDashboard />;
  }
  const params = await searchParams;
  const canManageAssignments = hasCapability(user.roles, "manage_assignments");
  const canReviewRevisions = canReviewEditorialRevisions(user.roles);
  const saintScope = getAdminSaintCatalogScope(user.roles);
  const teamWorkflow = canManageAssignments
    ? await loadTeamWorkflow({ canViewContent, canViewFeedbackInbox, canViewInstagram })
    : null;

  return (
    <div className="admin-stack">
      {teamWorkflow ? (
        <>
          <div>
            <div className="eyebrow">Dashboard</div>
            <h1>Content workflow</h1>
            <p className="lede">Coordinate shared editorial queues and keep your own assignments moving from one workspace.</p>
          </div>

          <section className="admin-stack" aria-labelledby="team-workflow-title">
            <div>
              <div className="eyebrow">Shared queues</div>
              <h2 id="team-workflow-title">Team workflow</h2>
              <p className="lede">See the editorial queues and published records the whole team is moving forward.</p>
            </div>
            <div className="admin-stat-grid">
              {canViewFeedbackInbox ? <DashboardCard href="/admin/feedback?status=new" label="New feedback" value={teamWorkflow.newFeedbackCount} /> : null}
              <DashboardCard href="/admin/saints?scope=public&workflow=needs_review" label="Saints needing review" value={teamWorkflow.saintCounts.needs_review ?? 0} />
              <DashboardCard href="/admin/saints?scope=public&workflow=fact_checked" label="Fact-checked saints" value={teamWorkflow.saintCounts.fact_checked ?? 0} />
              <DashboardCard href="/admin/saints?scope=public&workflow=populated" label="Populated saints" value={teamWorkflow.saintCounts.populated ?? 0} />
              <DashboardCard href="/admin/saints?scope=public&workflow=polished" label="Polished saints" value={teamWorkflow.saintCounts.polished ?? 0} />
              {canViewInstagram ? <DashboardCard href="/admin/instagram?status=needs_review" label="Instagram items awaiting review" value={teamWorkflow.instagramNeedsReview} /> : null}
              {canViewContent ? <DashboardCard href="/admin/traditions" label="Traditions awaiting review" value={teamWorkflow.traditionsNeedsReview} /> : null}
              {canViewContent ? <DashboardCard href="/admin/places" label="Place records" value={teamWorkflow.placeCount} /> : null}
              {hasCapability(user.roles, "access_museum") ? <DashboardLink href="/admin/museum" label="Museum workspace" badge="Curator" /> : null}
            </div>
          </section>

          {canReviewRevisions ? <EditorialReviewQueue /> : null}
        </>
      ) : null}

      <AssignmentWorkspace
        canManage={canManageAssignments}
        canViewContent={canViewContent}
        canViewInstagram={canViewInstagram}
        eyebrow={teamWorkflow ? "Personal queue" : "Dashboard"}
        headingLevel={teamWorkflow ? "h2" : "h1"}
        params={params}
        saintScope={saintScope}
        userId={user.id}
      />
    </div>
  );
}

async function loadTeamWorkflow({
  canViewContent,
  canViewFeedbackInbox,
  canViewInstagram
}: {
  canViewContent: boolean;
  canViewFeedbackInbox: boolean;
  canViewInstagram: boolean;
}) {
  const [saintRows, instagramNeedsReview, traditionsNeedsReview, placeCount, newFeedbackCount] = await Promise.all([
    db.saint.groupBy({ by: ["workflowStatus"], where: { teamVisibility: "public" }, _count: { _all: true } }),
    canViewInstagram ? db.instagramItem.count({ where: { status: "needs_review" } }) : Promise.resolve(0),
    canViewContent ? db.tradition.count({ where: { status: "needs_review" } }) : Promise.resolve(0),
    canViewContent ? db.place.count() : Promise.resolve(0),
    canViewFeedbackInbox ? db.feedbackSubmission.count({ where: { status: "new" } }) : Promise.resolve(0)
  ]);
  return {
    instagramNeedsReview,
    newFeedbackCount,
    placeCount,
    saintCounts: Object.fromEntries(saintRows.map((row) => [row.workflowStatus, row._count._all])) as Record<string, number>,
    traditionsNeedsReview
  };
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

