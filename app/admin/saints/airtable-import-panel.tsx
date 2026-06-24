"use client";

import { DatabaseZap, RefreshCw, Waypoints } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  rawSummary: unknown;
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
    <section className="review-panel instagram-ingestion-panel">
      <div className="admin-toolbar">
        <div>
          <h2>Airtable sync review</h2>
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

      <div className="instagram-job-history">
        <h3>Recent Airtable jobs</h3>
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
      </div>
    </section>
  );
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
