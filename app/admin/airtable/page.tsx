import { StatusBadge } from "@/components/ui/status-badge";
import { getBulkDeletePasswordStatus } from "@/lib/admin-secrets";
import { db } from "@/lib/db";
import { collectAirtableCmsResetCounts } from "../../../scripts/reset-airtable-cms-import";
import {
  dryRunAirtableMirrorAction,
  queueAirtableImportAction,
  resetAirtableCmsAction,
  writeAirtableMirrorAction
} from "./actions";

type AirtableReingestPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AirtableReingestPage({ searchParams }: AirtableReingestPageProps) {
  const [params, resetCounts, passwordStatus, recentMirrorBatch, recentJobs] = await Promise.all([
    searchParams,
    collectAirtableCmsResetCounts(),
    getBulkDeletePasswordStatus(),
    db.importBatch.findFirst({
      where: { sourceType: "airtable" },
      orderBy: { startedAt: "desc" },
      select: { status: true, sourceName: true, startedAt: true, completedAt: true, rawSummary: true }
    }),
    db.airtableImportJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { mode: true, status: true, message: true, createdAt: true, completedAt: true }
    })
  ]);

  return (
    <div className="admin-stack">
      <div>
        <div className="eyebrow">Airtable</div>
        <h1>Reingest workflow</h1>
        <p className="lede">Refresh the mirror, clear Airtable-derived CMS records, and queue the saint and cleanup imports.</p>
      </div>

      <StatusMessages params={params} />

      <div className="admin-stat-grid">
        <Stat label="Airtable-linked saints" value={resetCounts.saints} />
        <Stat label="Saint relationships" value={resetCounts.saintRelationships} />
        <Stat label="Family memberships" value={resetCounts.saintFamilyMembers} />
        <Stat label="Duplicate candidates" value={resetCounts.duplicateCandidates} />
        <Stat label="Museum assignments" value={resetCounts.saintMuseumSections} />
      </div>

      <ReviewPanel
        description="Pull the configured Airtable tables into the private mirror before reimporting CMS records."
        eyebrow="Step 1"
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
        description="Clear Airtable-derived CMS data so the next import starts from the refreshed mirror."
        eyebrow="Step 2"
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

      <ReviewPanel
        description="Queue the safe CMS import jobs after the mirror has been refreshed and the reset has completed."
        eyebrow="Step 3"
        title="Queue imports"
      >
        <div className="review-actions">
          <QueueForm mode="import_missing_drafts" label="Import missing saint drafts" />
          <QueueForm mode="import_airtable_cleanup" label="Import cleanup graph" />
        </div>
        {recentJobs.length > 0 ? (
          <div className="review-list">
            {recentJobs.map((job) => (
              <article className="review-row" key={`${job.mode}:${job.createdAt.toISOString()}`}>
                <div>
                  <div className="review-meta">
                    <StatusBadge label={formatStatus(job.mode)} />
                    <StatusBadge label={formatStatus(job.status)} />
                  </div>
                  <h3>{job.message ?? formatStatus(job.mode)}</h3>
                </div>
                <div className="review-meta">
                  <StatusBadge label={formatDate(job.completedAt ?? job.createdAt)} />
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </ReviewPanel>
    </div>
  );
}

function QueueForm({ mode, label }: { mode: string; label: string }) {
  return (
    <form action={queueAirtableImportAction} className="review-actions">
      <input name="mode" type="hidden" value={mode} />
      <PasswordField />
      <button className="admin-form-button" type="submit">{label}</button>
    </form>
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
      <span>Bulk delete password</span>
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
  const job = getParam(params.job);
  const mirrorError = getParam(params.mirrorError);
  const resetError = getParam(params.resetError);
  const jobError = getParam(params.jobError);
  return (
    <>
      {mirrorDryRun ? <p className="admin-notice form-status form-status--success">Mirror dry-run completed: {mirrorDryRun}</p> : null}
      {mirrorWrite ? <p className="admin-notice form-status form-status--success">Mirror refreshed: {mirrorWrite}</p> : null}
      {reset === "completed" ? <p className="admin-notice form-status form-status--success">Airtable-derived CMS data reset.</p> : null}
      {job === "already-running" ? <p className="admin-notice admin-notice--warning">An Airtable import job is already running.</p> : null}
      {job && job !== "already-running" ? <p className="admin-notice form-status form-status--success">Queued {formatStatus(job)}.</p> : null}
      {mirrorError ? <p className="admin-notice admin-notice--warning">Mirror action failed: {mirrorError}</p> : null}
      {resetError ? <p className="admin-notice admin-notice--warning">Reset failed: {resetError}</p> : null}
      {jobError ? <p className="admin-notice admin-notice--warning">Import job action failed: {jobError}</p> : null}
    </>
  );
}

function getParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

function formatDate(value: Date) {
  return value.toISOString().replace("T", " ").slice(0, 16);
}
