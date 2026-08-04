import { InstagramIngestionPanel } from "@/app/admin/instagram/instagram-ingestion-panel";
import { requireCapability } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { getIncompleteInstagramItemSummaries, getIncompleteInstagramItemWhere } from "@/lib/instagram-ingestion";

export default async function InstagramImportPage() {
  await requireCapability("view_source_data");
  const [rows, incompleteCount, incompleteItems] = await Promise.all([
    db.instagramIngestionJob.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    db.instagramItem.count({ where: getIncompleteInstagramItemWhere() }),
    getIncompleteInstagramItemSummaries()
  ]);
  const jobs = rows.map((job) => ({ ...job, startedAt: job.startedAt?.toISOString() ?? null, completedAt: job.completedAt?.toISOString() ?? null, createdAt: job.createdAt.toISOString() }));
  return <div className="admin-stack"><div><div className="eyebrow">Source Data</div><h1>Instagram import</h1><p className="lede">Refresh external Instagram records and repair incomplete source data before editorial review.</p></div><InstagramIngestionPanel incompleteCount={incompleteCount} incompleteItems={incompleteItems} jobs={jobs} /></div>;
}
