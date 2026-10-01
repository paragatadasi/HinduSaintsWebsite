import Link from "next/link";
import { requireCapability } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { auditMuseumMirror } from "@/lib/museum-mirror-audit";
import { CollapsibleReviewCard } from "@/components/admin/collapsible-review-card";
import { ReviewFactGrid } from "@/components/admin/review-ui";

export default async function MirrorAuditPage() {
  await requireCapability("view_source_data");
  const [rows, lastBatch] = await Promise.all([
    db.airtableMirrorRecord.findMany({
      select: { baseId: true, tableIdOrName: true, rawFieldsJson: true, importedAt: true }
    }),
    db.importBatch.findFirst({
      where: { sourceType: "airtable" }, orderBy: { startedAt: "desc" },
      select: { status: true, completedAt: true, notes: true }
    })
  ]);
  const report = auditMuseumMirror(rows);
  return (
    <div className="admin-stack">
      <div>
        <div className="eyebrow">Source data · Read-only audit</div>
        <h1>Airtable mirror coverage</h1>
        <p className="lede">See which fields are already stored before deciding whether another import is needed. Opening this page does not refresh Airtable or change website records.</p>
        <Link href="/admin/airtable">Back to Airtable</Link>
      </div>
      <ReviewFactGrid facts={[
        { label: "Configured tables", value: process.env.AIRTABLE_TABLES || "Saints" },
        { label: "Current view filter", value: process.env.AIRTABLE_VIEW || "No view configured" },
        { label: "Last mirror run", value: lastBatch ? lastBatch.status : "No import recorded" },
        { label: "Completed", value: lastBatch?.completedAt?.toISOString() || "Not recorded" },
        { label: "Last run notes", value: lastBatch?.notes || "None" },
        { label: "Mirrored rows", value: String(rows.length) }
      ]} />
      <p className="admin-settings-note">{report.limitation} The mirror retains older rows when a later import omits them, so an old row is not proof of current Airtable presence.</p>
      {!report.tables.length ? <p>No mirrored records are available yet.</p> : null}
      {report.tables.map(table => (
        <CollapsibleReviewCard
          key={table.baseId + table.table}
          cardId={"mirror-" + table.baseId + "-" + table.table}
          title={table.table}
          eyebrow={table.baseId}
          description={`${table.rows} rows · ${table.fields.length} observed fields · latest row import ${table.latestImport}`}
          defaultOpen
        >
          <p>Oldest row import: {table.firstImport}. Different row dates can indicate partial refreshes.</p>
          <p>Fields marked “Collection candidate” are identified by their names and still need review. Linked-record counts show references, not imported object details.</p>
          <ReviewFactGrid facts={table.fields.map(field => ({
            label: field.name + (field.collectionFieldCandidate ? " · Collection candidate" : ""),
            value: `${field.nonemptyRows} of ${table.rows} rows populated; ${field.missingRows} rows omit this field. Value types: ${field.valueTypes.join(", ")}.` +
              (field.linkedRecordArrayRows ? ` ${field.linkedRecordArrayRows} rows contain possible record links; at most ${field.largestLinkedRecordArray} links in one row.` : "")
          }))} />
        </CollapsibleReviewCard>
      ))}
    </div>
  );
}
