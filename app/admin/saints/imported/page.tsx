import Link from "next/link";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { requireCapability, requireSaintCatalogUser } from "@/lib/admin-access";
import { getAdminSaintCatalogScope, saintCatalogWhere } from "@/lib/admin-saint-access";
import { db } from "@/lib/db";
import { hasCapability } from "@/lib/permissions";
import { SaintsBulkReviewList } from "../saints-bulk-review-list";

export default async function ImportedSaintsPage({ searchParams }: {
  searchParams: Promise<{ job?: string; history?: string }>;
}) {
  await requireCapability("view_source_data");
  const user = await requireSaintCatalogUser();
  const params = await searchParams;
  const jobs = await db.airtableImportJob.findMany({
    where: { mode: { in: ["import_missing_drafts", "repair_slug_collisions"] } },
    orderBy: { createdAt: "desc" }
  });
  const job = params.job ? jobs.find(item => item.id === params.job) : undefined;
  const history = params.history === "1";
  // Legacy runs did not store draft IDs. Their time window is a review aid,
  // never proof that a record is safe to delete (runs may overlap).
  const records = await db.externalRecord.findMany({
    where: {
      sourceType: "airtable", entityType: "Saint", entityId: { not: null },
      rawPayloadJson: { path: ["importedBy"], equals: "airtable_saints_cms_import" },
      ...(job ? { importedAt: { gte: job.startedAt ?? job.createdAt, ...(job.completedAt ? { lte: job.completedAt } : {}) } } : {})
    },
    select: { entityId: true }
  });
  const saints = await db.saint.findMany({
    where: {
      AND: [saintCatalogWhere(getAdminSaintCatalogScope(user.roles)), {
        id: { in: params.job && !job ? [] : records.flatMap(row => row.entityId ? [row.entityId] : []) },
        ...(!history ? { status: "draft", publicationStatus: "unpublished" as const } : {})
      }]
    },
    orderBy: [{ createdAt: "desc" }, { displayName: "asc" }],
    select: { id: true, slug: true, displayName: true, birthDateRaw: true, samadhiDateRaw: true,
      teamVisibility: true, publicationStatus: true, workflowStatus: true }
  });
  const query = new URLSearchParams();
  if (job) query.set("job", job.id);
  if (history) query.set("history", "1");
  const returnTo = `/admin/saints/imported${query.size ? `?${query}` : ""}`;
  return <div className="admin-stack">
    <div><div className="eyebrow">Airtable review</div><h1>Imported saint drafts</h1>
      <p className="lede">{saints.length} imported records in this view. Review each suspected duplicate against the existing saint before archiving it.</p></div>
    <p><Link href="/admin/airtable">Back to Airtable</Link></p>
    <form className="review-actions" method="get">
      <SearchableSelect name="job" label="Import run" defaultValue={params.job ?? ""}
        options={[{ value: "", label: "All imports" }, ...jobs.map(item => ({ value: item.id,
          label: `${item.createdAt.toISOString()} · ${item.status} · ${item.newDraftSaintsCreated} drafts` }))]} />
      <label><input type="checkbox" name="history" value="1" defaultChecked={history} /> Include reviewed and archived imports</label>
      <button className="admin-form-button" type="submit">Filter</button>
    </form>
    {params.job && !job ? <p className="admin-notice">Import run not found.</p> : null}
    <p className="admin-settings-note">Run filters use the preserved import timestamp; overlapping runs may share records. Archive confirmed duplicates to preserve their source data. Archiving does not undo shared places, traditions, media, or source records created during import. Avoid the full Airtable CMS reset for a single-run cleanup.</p>
    <SaintsBulkReviewList saints={saints.map(saint => ({ ...saint, primaryImage: null, matchStatus: "unmatched" as const }))}
      canDelete={false} canManagePublication={hasCapability(user.roles, "publish_content")}
      canManageVisibility={false} returnTo={returnTo} showMatch={false} showThumbnail={false} showVisibility={true} />
  </div>;
}
