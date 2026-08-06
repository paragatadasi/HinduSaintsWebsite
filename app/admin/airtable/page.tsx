import { CollapsibleReviewCard } from "@/components/admin/collapsible-review-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireCapability } from "@/lib/admin-access";
import { getBulkDeletePasswordStatus } from "@/lib/admin-secrets";
import { serializeAirtableImportJob } from "@/lib/airtable-import-job-view";
import { db } from "@/lib/db";
import { collectAirtableCmsResetCounts } from "../../../scripts/reset-airtable-cms-import";
import {
  dryRunAirtableMirrorAction,
  resetAirtableCmsAction,
  writeAirtableMirrorAction
} from "./actions";
import { AirtableImportPanel } from "./airtable-import-panel";

type AirtablePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AirtablePage({ searchParams }: AirtablePageProps) {
  await requireCapability("view_source_data");
  const [params, resetCounts, passwordStatus, recentMirrorBatch, recentJobs] = await Promise.all([
    searchParams,
    collectAirtableCmsResetCounts(),
    getBulkDeletePasswordStatus(),
    db.importBatch.findFirst({
      where: { sourceType: "airtable" },
      orderBy: { startedAt: "desc" },
      select: { status: true, startedAt: true, completedAt: true }
    }),
    db.airtableImportJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 8
    })
  ]);

  return (
    <div className="admin-stack">
      <div>
        <div className="eyebrow">Source Data</div>
        <h1>Airtable</h1>
        <p className="lede">Review mirrored Airtable records and intentionally import safe changes into the website CMS.</p>
      </div>

      <StatusMessages params={params} />

      <AirtableImportPanel defaultOpen jobs={recentJobs.map(serializeAirtableImportJob)} />

      <CollapsibleReviewCard
        cardId="airtable-mirror-maintenance"
        description="Refresh the private mirror or reset Airtable-derived CMS data before a controlled reingest."
        eyebrow="Sensitive operations"
        title="Mirror and reingest maintenance"
      >
        <div className="admin-stat-grid">
          <Stat label="Airtable-linked saints" value={resetCounts.saints} />
          <Stat label="Saint relationships" value={resetCounts.saintRelationships} />
          <Stat label="Family memberships" value={resetCounts.saintFamilyMembers} />
          <Stat label="Duplicate candidates" value={resetCounts.duplicateCandidates} />
          <Stat label="Museum assignments" value={resetCounts.saintMuseumSections} />
        </div>

        <ReviewPanel
          description="Pull the configured Airtable tables into the private mirror. Run the dry-run first; this does not publish or overwrite reviewed CMS content."
          eyebrow="Maintenance step 1"
          title="Refresh Airtable mirror"
        >
          <div className="review-meta">
            <StatusBadge label={process.env.AIRTABLE_TABLES || "Saints"} />
            {recentMirrorBatch ? <StatusBadge label={`Last ${recentMirrorBatch.status}`} /> : null}
            {recentMirrorBatch?.completedAt ? <StatusBadge label={formatDate(recentMirrorBatch.completedAt)} /> : null}
          </div>
          {recentMirrorBatch ? (
            <p className="admin-settings-note">
              Last mirror run {recentMirrorBatch.status}
              {recentMirrorBatch.completedAt ? ` at ${formatDate(recentMirrorBatch.completedAt)}` : recentMirrorBatch.startedAt ? `; started ${formatDate(recentMirrorBatch.startedAt)}` : ""}.
            </p>
          ) : (
            <p className="admin-settings-note">No Airtable mirror batch has completed yet.</p>
          )}
          <div className="review-actions">
            <form action={dryRunAirtableMirrorAction}>
              <button className="admin-form-button admin-form-button--secondary" type="submit">Dry-run mirror</button>
            </form>
            <form action={writeAirtableMirrorAction} className="review-actions">
              <PasswordField />
              <button className="admin-form-button" type="submit">Refresh mirror</button>
            </form>
          </div>
        </ReviewPanel>

        <ReviewPanel
          description="Clear Airtable-derived CMS data so the next import starts from the refreshed mirror. This intentionally removes the records counted above."
          eyebrow="Maintenance step 2"
          title="Reset CMS import data"
        >
          <div className="review-meta">
            <StatusBadge label={passwordStatus.isConfigured ? "Password configured" : "Password missing"} />
            <StatusBadge label={`${resetCounts.airtableImportJobs} Airtable jobs`} />
          </div>
          <form action={resetAirtableCmsAction} className="admin-settings-form">
            <PasswordField />
            <label className="bulk-review-select-all">
              <input name="keepJobs" type="checkbox" />
              <span>Keep Airtable import job history</span>
            </label>
            <div className="review-actions admin-settings-form__actions">
              <button className="admin-form-button admin-form-button--danger" type="submit">Reset Airtable CMS data</button>
            </div>
          </form>
        </ReviewPanel>
      </CollapsibleReviewCard>
    </div>
  );
}

function ReviewPanel({
  children,
  description,
  eyebrow,
  title
}: {
  children: React.ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="review-panel admin-settings-panel">
      <div>
        <div className="review-collapsible__eyebrow">{eyebrow}</div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {children}
    </section>
  );
}

function PasswordField() {
  return (
    <label className="bulk-delete-password">
      <span>Sensitive-action password</span>
      <input autoComplete="current-password" name="bulkDeletePassword" required type="password" />
    </label>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="admin-stat">
      <StatusBadge label={String(value)} />
      <h2>{label}</h2>
    </div>
  );
}

function StatusMessages({ params }: { params: Record<string, string | string[] | undefined> }) {
  const mirrorDryRun = getParam(params.mirrorDryRun);
  const mirrorWrite = getParam(params.mirrorWrite);
  const reset = getParam(params.reset);
  const mirrorError = getParam(params.mirrorError);
  const resetError = getParam(params.resetError);
  return (
    <>
      {mirrorDryRun ? <p className="admin-notice form-status form-status--success">Mirror dry-run completed: {mirrorDryRun}</p> : null}
      {mirrorWrite ? <p className="admin-notice form-status form-status--success">Mirror refreshed: {mirrorWrite}</p> : null}
      {reset === "completed" ? <p className="admin-notice form-status form-status--success">Airtable-derived CMS data reset.</p> : null}
      {mirrorError ? <p className="admin-notice admin-notice--warning">Mirror action failed: {mirrorError}</p> : null}
      {resetError ? <p className="admin-notice admin-notice--warning">Reset failed: {resetError}</p> : null}
    </>
  );
}

function getParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function formatDate(value: Date) {
  return value.toISOString().replace("T", " ").slice(0, 16);
}
