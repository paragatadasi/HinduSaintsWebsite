import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";

type HistoryRow = { id: string; source: string; mode: string; status: string; startedAt: Date; completedAt: Date | null; summary: string | null };

export default async function ImportHistoryPage() {
  const [batches, airtable, instagram] = await Promise.all([
    db.importBatch.findMany({ orderBy: { startedAt: "desc" }, take: 100 }),
    db.airtableImportJob.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    db.instagramIngestionJob.findMany({ orderBy: { createdAt: "desc" }, take: 100 })
  ]);
  const rows: HistoryRow[] = [
    ...batches.map((row) => ({ id: `batch:${row.id}`, source: row.sourceType, mode: row.sourceName || "import batch", status: row.status, startedAt: row.startedAt, completedAt: row.completedAt, summary: row.rawSummary || row.notes })),
    ...airtable.map((row) => ({ id: `airtable:${row.id}`, source: "airtable", mode: row.mode, status: row.status, startedAt: row.startedAt || row.createdAt, completedAt: row.completedAt, summary: row.message || row.error })),
    ...instagram.map((row) => ({ id: `instagram:${row.id}`, source: "instagram", mode: row.mode, status: row.status, startedAt: row.startedAt || row.createdAt, completedAt: row.completedAt, summary: row.message || row.error }))
  ].sort((left, right) => right.startedAt.getTime() - left.startedAt.getTime()).slice(0, 200);

  return <div className="admin-stack"><div><div className="eyebrow">Source Data</div><h1>Import history</h1><p className="lede">A unified operational history for generic, Airtable, Instagram, CSV, and manual import batches.</p></div>{rows.length ? <div className="review-list">{rows.map((row) => <article className="review-row" key={row.id}><div><div className="review-meta"><StatusBadge label={row.source} /><StatusBadge label={row.status} /></div><h2>{formatLabel(row.mode)}</h2><p>{row.summary || "No summary was recorded."}</p></div><div className="review-meta"><StatusBadge label={formatDate(row.startedAt)} />{row.completedAt ? <StatusBadge label={`Completed ${formatDate(row.completedAt)}`} /> : null}</div></article>)}</div> : <p className="empty-note">No import runs have been recorded.</p>}</div>;
}

function formatLabel(value: string) { return value.replaceAll("_", " "); }
function formatDate(value: Date) { return value.toLocaleString(); }
