import Link from "next/link";
import type { Route } from "next";
import { CollapsibleReviewCard } from "@/components/admin/collapsible-review-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getBulkDeletePasswordStatus } from "@/lib/admin-secrets";
import { db } from "@/lib/db";
import { setBulkDeletePasswordAction } from "./actions";

type AdminDashboardPageProps = {
  searchParams: Promise<{ bulkDeletePassword?: string | string[] }>;
};

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  const [
    { bulkDeletePassword },
    saintCounts,
    instagramNeedsReview,
    traditionsNeedsReview,
    placeCount,
    newFeedbackCount,
    bulkDeletePasswordStatus
  ] = await Promise.all([
    searchParams,
    db.saint.groupBy({ by: ["status"], _count: { _all: true } }),
    db.instagramItem.count({ where: { status: "needs_review" } }),
    db.tradition.count({ where: { status: "needs_review" } }),
    db.place.count(),
    db.feedbackSubmission.count({ where: { status: "new" } }),
    getBulkDeletePasswordStatus()
  ]);
  const counts = Object.fromEntries(saintCounts.map((row) => [row.status, row._count._all]));
  const passwordUpdated = getSearchParam(bulkDeletePassword) === "updated";

  return (
    <div className="admin-stack">
      <div>
        <div className="eyebrow">Dashboard</div>
        <h1>Content workflow</h1>
        <p className="lede">Review imported records, approve public saint pages, and track remaining reconciliation work.</p>
      </div>
      <div className="admin-stat-grid">
        <DashboardCard href="/admin/feedback?status=new" label="New feedback" value={newFeedbackCount} />
        <DashboardCard href="/admin/saints?status=needs_review" label="Saints awaiting review" value={counts.needs_review ?? 0} />
        <DashboardCard href="/admin/saints?status=published" label="Published saints" value={counts.published ?? 0} />
        <DashboardCard href="/admin/instagram?status=needs_review" label="Instagram items awaiting review" value={instagramNeedsReview} />
        <DashboardCard href="/admin/traditions" label="Traditions awaiting review" value={traditionsNeedsReview} />
        <DashboardCard href="/admin/places" label="Place records" value={placeCount} />
      </div>

      <CollapsibleReviewCard
        cardId="admin-bulk-delete-password"
        className="admin-settings-panel"
        defaultOpen={passwordUpdated}
        description="Set the password required before selected saints can be removed from the review queue for re-import."
        eyebrow="Admin settings"
        title="Bulk delete password"
      >
        <div className="review-meta">
          <StatusBadge label={bulkDeletePasswordStatus.isConfigured ? "Configured" : "Not configured"} />
          {bulkDeletePasswordStatus.isDatabaseConfigured ? <StatusBadge label="Managed in CMS" /> : null}
        </div>

        {passwordUpdated ? <p className="admin-notice form-status form-status--success">Bulk delete password updated.</p> : null}

        <form action={setBulkDeletePasswordAction} className="admin-settings-form">
          <label className="admin-field">
            <span>New password</span>
            <input
              autoComplete="new-password"
              minLength={10}
              name="bulkDeletePassword"
              required
              type="password"
            />
          </label>
          <label className="admin-field">
            <span>Confirm password</span>
            <input
              autoComplete="new-password"
              minLength={10}
              name="confirmBulkDeletePassword"
              required
              type="password"
            />
          </label>
          <div className="review-actions admin-settings-form__actions">
            <button className="admin-form-button" type="submit">Set password</button>
          </div>
        </form>

        {bulkDeletePasswordStatus.updatedAt ? (
          <p className="admin-settings-note">
            Last updated {bulkDeletePasswordStatus.updatedAt.toLocaleString()}
            {bulkDeletePasswordStatus.updatedByEmail ? ` by ${bulkDeletePasswordStatus.updatedByEmail}` : ""}.
          </p>
        ) : null}
      </CollapsibleReviewCard>
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

function getSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return value?.trim() ?? "";
}
