"use client";

import { RefreshCw, Wrench } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/ui/status-badge";

type InstagramIngestionJobView = {
  id: string;
  mode: string;
  status: string;
  sourceName: string | null;
  totalRows: number;
  processedRows: number;
  importedRows: number;
  skippedRows: number;
  updatedRows: number;
  failedRows: number;
  mediaCachedRows: number;
  incompleteRefetchedRows: number;
  message: string | null;
  error: string | null;
  rawSummary: unknown;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

type InstagramIngestionPanelProps = {
  incompleteCount: number;
  jobs: InstagramIngestionJobView[];
};

type JobsResponse = {
  jobs: InstagramIngestionJobView[];
  incompleteCount: number;
};

const runningStatuses = new Set(["queued", "running"]);

export function InstagramIngestionPanel({ incompleteCount: initialIncompleteCount, jobs: initialJobs }: InstagramIngestionPanelProps) {
  const router = useRouter();
  const [jobs, setJobs] = useState(initialJobs);
  const [incompleteCount, setIncompleteCount] = useState(initialIncompleteCount);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const refreshedAfterJobRef = useRef<string | undefined>(undefined);
  const activeJob = useMemo(() => jobs.find((job) => runningStatuses.has(job.status)), [jobs]);
  const isBusy = Boolean(activeJob) || isPending;

  useEffect(() => {
    if (!activeJob) return;

    const interval = window.setInterval(() => {
      fetchJobs().catch((fetchError) => {
        setError(fetchError instanceof Error ? fetchError.message : "Could not refresh Instagram job status.");
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
    const response = await fetch("/api/admin/instagram-ingestion", { cache: "no-store" });
    const json = await response.json() as JobsResponse | { error?: string };
    if (!response.ok) throw new Error("error" in json && json.error ? json.error : "Could not load Instagram jobs.");
    if ("jobs" in json) {
      setJobs(json.jobs);
      setIncompleteCount(json.incompleteCount);
    }
  }

  function startJob(intent: "refresh" | "repair_incomplete") {
    setError(undefined);
    startTransition(async () => {
      const response = await fetch("/api/admin/instagram-ingestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent })
      });
      const json = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) {
        setError(json.error ?? "Could not start Instagram ingestion.");
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
          <h2>Queue ingestion</h2>
          <p>Refresh imports new Instagram posts, extracts first-page biodata, caches media, and records job history for review.</p>
        </div>
        <div className="review-actions">
          <button className="admin-form-button" type="button" disabled={isBusy} onClick={() => startJob("refresh")}>
            <RefreshCw aria-hidden="true" size={16} />
            Refresh Queue
          </button>
          <button className="admin-form-button admin-form-button--secondary" type="button" disabled={isBusy || incompleteCount === 0} onClick={() => startJob("repair_incomplete")}>
            <Wrench aria-hidden="true" size={16} />
            Re-fetch incomplete
          </button>
        </div>
      </div>

      {error ? <p className="admin-notice admin-notice--warning">{error}</p> : null}
      {activeJob ? <JobProgress job={activeJob} /> : null}

      <div className="instagram-ingestion-summary">
        <StatusBadge label={`${incompleteCount} incomplete`} />
        <span>Incomplete means missing cached media or first-page extraction.</span>
      </div>

      <div className="instagram-job-history">
        <h3>Recent ingestion jobs</h3>
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
          <p>No ingestion jobs have run yet.</p>
        )}
      </div>
    </section>
  );
}

function JobProgress({ job }: { job: InstagramIngestionJobView }) {
  const percent = job.totalRows > 0 ? Math.min(100, Math.round((job.processedRows / job.totalRows) * 100)) : 0;

  return (
    <div className="instagram-job-progress">
      <div>
        <strong>{job.message ?? "Instagram ingestion is running."}</strong>
        <span>{job.totalRows > 0 ? `${job.processedRows} of ${job.totalRows} processed` : "Preparing rows"}</span>
      </div>
      <progress aria-label="Instagram ingestion progress" max={100} value={percent} />
      <div className="review-meta">
        <StatusBadge label={`${job.importedRows} imported`} />
        <StatusBadge label={`${job.updatedRows} updated`} />
        <StatusBadge label={`${job.skippedRows} skipped`} />
        <StatusBadge label={`${job.failedRows} failed`} />
        <StatusBadge label={`${job.mediaCachedRows} cached`} />
      </div>
    </div>
  );
}

function formatVisibleJobCounts(job: InstagramIngestionJobView) {
  if (job.mode === "repair_incomplete") {
    const fixedRows = getSummaryNumber(job.rawSummary, "fixedRows");
    const remainingIncompleteRows = getSummaryNumber(job.rawSummary, "remainingIncompleteRows");
    const checkedRows = job.incompleteRefetchedRows || job.updatedRows;

    return [
      `${checkedRows} checked`,
      fixedRows == null ? undefined : `${fixedRows} fixed`,
      remainingIncompleteRows == null ? undefined : `${remainingIncompleteRows} still incomplete`,
      `${job.failedRows} failed`,
      `${job.mediaCachedRows} media cached`
    ].filter(Boolean).join(" - ");
  }

  return [
    `${job.importedRows} imported`,
    `${job.updatedRows} updated`,
    `${job.skippedRows} skipped`,
    `${job.failedRows} failed`,
    `${job.mediaCachedRows} media cached`
  ].filter(Boolean).join(" - ");
}

function getSummaryNumber(rawSummary: unknown, key: string) {
  if (!rawSummary || typeof rawSummary !== "object" || Array.isArray(rawSummary)) return undefined;
  const value = (rawSummary as Record<string, unknown>)[key];
  return typeof value === "number" ? value : undefined;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}
