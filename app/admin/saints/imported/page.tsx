import Link from "next/link";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { requireCapability, requireSaintCatalogUser } from "@/lib/admin-access";
import { getAdminSaintCatalogScope, saintCatalogWhere } from "@/lib/admin-saint-access";
import { db } from "@/lib/db";
import { hasCapability } from "@/lib/permissions";
import { airtableImportedDraftRecordWhere, getAirtableDraftReviewEvidence, importedDraftSaintId } from "@/lib/airtable-import-draft-review";
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
  const evidence = getAirtableDraftReviewEvidence(job?.rawSummary);
  // Legacy runs did not store draft IDs. Their time window is a review aid,
  // never proof that a record is safe to delete (runs may overlap).
  const records = await db.externalRecord.findMany({
    where: airtableImportedDraftRecordWhere(job),
    select: { entityId: true, rawPayloadJson: true }
  });
  const saints = await db.saint.findMany({
    where: {
      AND: [saintCatalogWhere(getAdminSaintCatalogScope(user.roles)), {
        OR: [
          { id: { in: params.job && !job ? [] : records.flatMap(row => {
            const id = importedDraftSaintId(row);
            return id ? [id] : [];
          }) } },
          { slug: { in: evidence.repairSlugs } }
        ],
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
    {job ? <p className="admin-notice">{evidence.tracked
      ? "This run saved explicit job attribution for successfully linked imports. Failed rows may need separate review."
      : `Legacy run: candidates use import timestamps and ${evidence.repairSlugs.length} recorded slug repairs. Overlapping runs may share candidates; this is not a complete or definitive list of created IDs.`}</p> : null}
    <p className="admin-settings-note">Archive confirmed duplicates to preserve source linkage. Permanent deletion requires the sensitive-action password and clears external links, so a later import could recreate the saint. Confirm a recoverable backup before deletion. Neither action undoes shared places, traditions, media, or sources. Avoid the full Airtable CMS reset for a single-run cleanup.</p>
    <SaintsBulkReviewList saints={saints.map(saint => ({ ...saint, primaryImage: null, matchStatus: "unmatched" as const }))}
      canDelete={hasCapability(user.roles, "manage_sensitive_actions")} canManagePublication={hasCapability(user.roles, "publish_content")}
      canManageVisibility={false} returnTo={returnTo} showMatch={false} showThumbnail={false} showVisibility={true} />
  </div>;
}
