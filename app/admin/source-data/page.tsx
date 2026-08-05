import Link from "next/link";
import type { Route } from "next";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";

export default async function SourceDataPage() {
  const [openIssues, importBatches, airtableJobs, instagramJobs] = await Promise.all([
    db.reconciliationIssue.count({ where: { status: "open" } }),
    db.importBatch.count(),
    db.airtableImportJob.count(),
    db.instagramIngestionJob.count()
  ]);
  return <div className="admin-stack"><div><div className="eyebrow">Source Data</div><h1>Imports and reconciliation</h1><p className="lede">Inspect preserved external data, review import runs, and resolve conflicts without silently replacing CMS edits.</p></div><div className="admin-stat-grid"><SourceCard href={"/admin/source-data/reconciliation" as Route} label="Open reconciliation issues" value={openIssues} /><SourceCard href={"/admin/source-data/history" as Route} label="Recorded import runs" value={importBatches + airtableJobs + instagramJobs} /><SourceCard href={"/admin/airtable" as Route} label="Airtable import" value={airtableJobs} /><SourceCard href={"/admin/source-data/instagram" as Route} label="Instagram import" value={instagramJobs} /></div></div>;
}

function SourceCard({ href, label, value }: { href: Route; label: string; value: number }) {
  return <Link className="admin-stat admin-stat--link interactive-surface" href={href}><StatusBadge label={String(value)} /><h2>{label}</h2></Link>;
}
