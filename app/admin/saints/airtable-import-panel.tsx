"use client";

import type { Route } from "next";
import Link from "next/link";
import { ChevronDown, DatabaseZap, RefreshCw, Waypoints } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AirtableImportSummaryDetails } from "@/lib/airtable-import-job-view";
import { CollapsibleReviewCard } from "@/components/admin/collapsible-review-card";
import { StatusBadge } from "@/components/ui/status-badge";

type AirtableImportJobView = {
  id: string;
  mode: string;
  status: string;
  sourceName: string | null;
  mirrorRowsChecked: number;
  existingCmsSaintsSkipped: number;
  newDraftSaintsCreated: number;
  slugNameCollisionsSkipped: number;
  guruRelationshipsCreated: number;
  guruRelationshipsExisting: number;
  guruRelationshipsUnresolved: number;
  skippedSelfRelationships: number;
  failedRows: number;
  message: string | null;
  error: string | null;
  rawSummary: AirtableImportSummaryDetails;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

type AirtableImportPanelProps = {
  jobs: AirtableImportJobView[];
};

type JobsResponse = {
  jobs: AirtableImportJobView[];
};

type AirtableImportIntent = "check" | "import_missing_drafts" | "import_guru_relationships";

const runningStatuses = new Set(["queued", "running"]);

export function AirtableImportPanel({ jobs: initialJobs }: AirtableImportPanelProps) {
  const router = useRouter();
  const [jobs, setJobs] = useState(initialJobs);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const refreshedAfterJobRef = useRef<string | undefined>(undefined);
  const activeJob = useMemo(() => jobs.find((job) => runningStatuses.has(job.status)), [jobs]);
  const latestJob = jobs[0];
  const latestJobStatus = latestJob ? `${formatStatus(latestJob.mode)} ${formatStatus(latestJob.status)}` : "No Airtable jobs have run yet.";
  const isBusy = Boolean(activeJob) || isPending;

  useEffect(() => {
    if (!activeJob) return;

    const interval = window.setInterval(() => {
      fetchJobs().catch((fetchError) => {
        setError(fetchError instanceof Error ? fetchError.message : "Could not refresh Airtable job status.");
      });
    }, 2000);

    return () => window.clearInterval(interval);
  }, [activeJob?.id]);

  useEffect(() => {
    const latestJob = jobs[0];
    if (!latestJob || runningStatuses.has(latestJob.status) || refreshedAfterJobRef.current === latestJob.id) return;
    refreshedAfterJobRef.current = latestJob.id;
    router.refresh();
  }, [jobs, router]);

  async function fetchJobs() {
    const response = await fetch("/api/admin/airtable-saint-import", { cache: "no-store" });
    const json = await response.json() as JobsResponse | { error?: string };
    if (!response.ok) throw new Error("error" in json && json.error ? json.error : "Could not load Airtable import jobs.");
    if ("jobs" in json) setJobs(json.jobs);
  }

  function startJob(intent: AirtableImportIntent) {
    setError(undefined);
    startTransition(async () => {
      const response = await fetch("/api/admin/airtable-saint-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent })
      });
      const json = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) {
        setError(json.error ?? "Could not start Airtable import.");
        await fetchJobs();
        return;
      }
      await fetchJobs();
    });
  }

  return (
    <CollapsibleReviewCard
      cardId="saints-airtable-sync"
      className="instagram-ingestion-panel"
      defaultOpen={Boolean(activeJob)}
      description={activeJob ? activeJob.message ?? "Airtable import is running." : latestJobStatus}
      eyebrow="Import tools"
      title="Airtable sync"
    >
      <div className="admin-toolbar">
        <div>
          <p>Check mirrored Airtable saint rows, create missing CMS saints as drafts, and optionally import guru links for editorial review.</p>
        </div>
        <div className="review-actions">
          <button className="admin-form-button admin-form-button--secondary" type="button" disabled={isBusy} onClick={() => startJob("check")}>
            <RefreshCw aria-hidden="true" size={16} />
            Check Airtable
          </button>
          <button className="admin-form-button" type="button" disabled={isBusy} onClick={() => startJob("import_missing_drafts")}>
            <DatabaseZap aria-hidden="true" size={16} />
            Import missing drafts
          </button>
          <button className="admin-form-button admin-form-button--secondary" type="button" disabled={isBusy} onClick={() => startJob("import_guru_relationships")}>
            <Waypoints aria-hidden="true" size={16} />
            Import guru relationships
          </button>
        </div>
      </div>

      {error ? <p className="admin-notice admin-notice--warning">{error}</p> : null}
      {activeJob ? <JobProgress job={activeJob} /> : null}

      <details className="instagram-job-history airtable-job-history">
        <summary>
          <span>Recent Airtable jobs</span>
          <StatusBadge label={`${jobs.length} jobs`} />
          <ChevronDown aria-hidden="true" size={14} />
        </summary>
        {jobs.length > 0 ? (
          <div className="review-list">
            {jobs.map((job) => (
              <article className="review-row" key={job.id}>
                <div>
                  <div className="review-meta">
                    <StatusBadge label={formatStatus(job.status)} />
                    <StatusBadge label={formatStatus(job.mode)} />
                    {job.sourceName ? <StatusBadge label={job.sourceName} /> : null}
                  </div>
                  <h3>{job.message ?? formatStatus(job.mode)}</h3>
                  {job.error ? <p className="admin-notice admin-notice--warning">{job.error}</p> : null}
                  <p>{formatVisibleJobCounts(job)}</p>
                  <AffectedRecordDetails job={job} />
                </div>
                <div className="review-meta">
                  <StatusBadge label={formatDate(job.completedAt ?? job.startedAt ?? job.createdAt)} />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p>No Airtable jobs have run yet.</p>
        )}
      </details>
    </CollapsibleReviewCard>
  );
}

function AffectedRecordDetails({ job }: { job: AirtableImportJobView }) {
  const details = getAffectedRecords(job.rawSummary);
  if (details.length === 0) return null;

  return (
    <details className="airtable-job-details">
      <summary>
        <span>Review affected records</span>
        <StatusBadge label={`${details.length} records`} />
        <ChevronDown aria-hidden="true" size={14} />
      </summary>
      <div className="airtable-job-detail-list">
        {details.map((detail) => (
          <div className="airtable-job-detail-row" key={detail.key}>
            <div className="review-meta">
              <StatusBadge label={detail.kind} />
              <StatusBadge label={detail.message} />
            </div>
            <div className="airtable-job-detail-row__body">
              <strong>{detail.primary}</strong>
              {detail.secondary ? <span>{detail.secondary}</span> : null}
              {detail.href ? <Link className="admin-text-link" href={detail.href as Route}>{detail.linkLabel}</Link> : null}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

function getAffectedRecords(summary: AirtableImportSummaryDetails) {
  return [
    ...summary.collisions.map((item) => ({
      key: `collision:${item.recordId}:${item.existingSaintSlug ?? item.existingSaintId ?? item.reason}`,
      kind: item.reason === "name_collision" ? "Name collision" : "Slug collision",
      message: item.message,
      primary: `Airtable saint: ${item.airtableName ?? item.recordId}`,
      secondary: item.existingSaintName ? `Existing CMS saint: ${item.existingSaintName}` : `Airtable record: ${item.recordId}`,
      href: item.existingSaintSlug ? `/admin/saints/${item.existingSaintSlug}` : undefined,
      linkLabel: "Open existing CMS saint"
    })),
    ...summary.unresolvedGuruRelationships.map((item) => ({
      key: `guru-unresolved:${item.discipleRecordId}:${item.guruRecordId}:${item.reason}`,
      kind: "Guru issue",
      message: item.message,
      primary: `${item.discipleName ?? item.discipleRecordId} -> ${item.guruName ?? item.guruRecordId}`,
      secondary: formatGuruRelationshipContext(item),
      href: item.reason === "unmapped_guru" && item.discipleSaintSlug ? `/admin/saints/${item.discipleSaintSlug}` : item.guruSaintSlug ? `/admin/saints/${item.guruSaintSlug}` : undefined,
      linkLabel: "Open linked CMS saint"
    })),
    ...summary.selfSkippedGuruRelationships.map((item) => ({
      key: `guru-self:${item.discipleRecordId}:${item.guruRecordId}:${item.saintSlug ?? "unlinked"}`,
      kind: "Self skipped",
      message: item.message,
      primary: item.saintName ?? item.discipleName ?? item.guruName ?? item.discipleRecordId,
      secondary: `${item.discipleName ?? item.discipleRecordId} -> ${item.guruName ?? item.guruRecordId}`,
      href: item.saintSlug ? `/admin/saints/${item.saintSlug}` : undefined,
      linkLabel: "Open CMS saint"
    })),
    ...summary.errors.map((item) => ({
      key: `error:${item.recordId}:${item.message}`,
      kind: "Failed",
      message: item.message,
      primary: item.discipleRecordId && item.guruRecordId
        ? `${item.discipleName ?? item.discipleRecordId} -> ${item.guruName ?? item.guruRecordId}`
        : item.airtableName ?? item.recordId,
      secondary: item.discipleRecordId && item.guruRecordId
        ? `Disciple Airtable record: ${item.discipleRecordId} - Guru Airtable record: ${item.guruRecordId}`
        : `Airtable record: ${item.recordId}`,
      href: undefined,
      linkLabel: "Open CMS saint"
    }))
  ];
}

function formatGuruRelationshipContext(item: AirtableImportSummaryDetails["unresolvedGuruRelationships"][number]) {
  const disciple = item.discipleSaintName ? `Disciple CMS saint: ${item.discipleSaintName}` : `Disciple Airtable record: ${item.discipleRecordId}`;
  const guru = item.guruSaintName ? `Guru CMS saint: ${item.guruSaintName}` : `Guru Airtable record: ${item.guruRecordId}`;
  return `${disciple} - ${guru}`;
}

function JobProgress({ job }: { job: AirtableImportJobView }) {
  return (
    <div className="instagram-job-progress">
      <div>
        <strong>{job.message ?? "Airtable import is running."}</strong>
        <span>{job.mirrorRowsChecked > 0 ? `${job.mirrorRowsChecked} mirror rows checked` : "Preparing rows"}</span>
      </div>
      <progress aria-label="Airtable import progress" max={100} value={job.status === "completed" ? 100 : 20} />
      <div className="review-meta">
        <StatusBadge label={`${job.newDraftSaintsCreated} drafts`} />
        <StatusBadge label={`${job.existingCmsSaintsSkipped} existing skipped`} />
        <StatusBadge label={`${job.slugNameCollisionsSkipped} collisions`} />
        <StatusBadge label={`${job.guruRelationshipsCreated} gurus created`} />
        <StatusBadge label={`${job.failedRows} failed`} />
      </div>
    </div>
  );
}

function formatVisibleJobCounts(job: AirtableImportJobView) {
  if (job.mode === "import_guru_relationships") {
    return [
      `${job.mirrorRowsChecked} mirror rows checked`,
      `${job.guruRelationshipsCreated} created`,
      `${job.guruRelationshipsExisting} existing`,
      `${job.guruRelationshipsUnresolved} unresolved`,
      `${job.skippedSelfRelationships} self skipped`,
      `${job.failedRows} failed`
    ].join(" - ");
  }

  return [
    `${job.mirrorRowsChecked} mirror rows checked`,
    `${job.newDraftSaintsCreated} drafts ${job.mode === "check" ? "available" : "created"}`,
    `${job.existingCmsSaintsSkipped} existing skipped`,
    `${job.slugNameCollisionsSkipped} collisions skipped`,
    `${job.failedRows} failed`
  ].join(" - ");
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}
