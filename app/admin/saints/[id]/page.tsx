import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { updateSaintBasics, updateSaintReviewStatus } from "../actions";

type AdminSaintEditorPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminSaintEditorPage({ params }: AdminSaintEditorPageProps) {
  const { id } = await params;
  const saint = await getSaint(id);

  if (!saint) notFound();

  const externalRecord = await db.externalRecord.findFirst({
    where: { sourceType: "airtable", entityType: "Saint", entityId: saint.id },
    select: { externalId: true, lastSeenAt: true }
  });
  const trackerRows = externalRecord ? await getTrackerRows(externalRecord.externalId) : [];

  return (
    <div className="admin-stack">
      <div className="admin-toolbar">
        <div>
          <div className="eyebrow">Reviewing saint</div>
          <h1>{saint.displayName}</h1>
          <div className="review-meta">
            <StatusBadge label={formatStatus(saint.status)} />
            {saint.hasInstagramContent ? <StatusBadge label="Instagram content" /> : null}
            {externalRecord ? <StatusBadge label="Airtable linked" /> : null}
          </div>
        </div>
        {saint.status === "published" ? (
          <Link className="button button--secondary" href={`/saints/${saint.slug}`}>View public page</Link>
        ) : null}
      </div>

      <div className="review-detail-grid">
        <section className="review-panel">
          <h2>Public Fields</h2>
          <form action={updateSaintBasics} className="form-stack">
            <input name="saintId" type="hidden" value={saint.id} />
            <label>
              Display name
              <input name="displayName" defaultValue={saint.displayName} required maxLength={200} />
            </label>
            <label>
              Canonical name
              <input name="canonicalName" defaultValue={saint.canonicalName} required maxLength={200} />
            </label>
            <label>
              Short description
              <textarea name="shortDescription" defaultValue={saint.shortDescription ?? ""} maxLength={500} />
            </label>
            <label>
              Biography summary
              <textarea name="biographySummary" defaultValue={saint.biographySummary ?? ""} maxLength={8000} />
            </label>
            <div className="review-actions">
              <button className="admin-form-button" type="submit">Save review edits</button>
            </div>
          </form>
        </section>

        <aside className="review-panel">
          <h2>Review Actions</h2>
          <p>Publishing makes this saint eligible for public display. Returning to review removes it from public pages.</p>
          <div className="review-actions">
            <StatusForm saintId={saint.id} status="published" label="Approve and publish" />
            <StatusForm saintId={saint.id} status="needs_review" label="Return to review" variant="secondary" />
            <StatusForm saintId={saint.id} status="hidden" label="Hide" variant="warning" />
          </div>
        </aside>
      </div>

      <section className="review-panel">
        <h2>Review Snapshot</h2>
        <div className="field-grid">
          <ReviewField label="Slug" value={saint.slug} />
          <ReviewField label="Era" value={saint.eraLabel} />
          <ReviewField label="Birth date" value={saint.birthDateRaw} />
          <ReviewField label="Samadhi date" value={saint.samadhiDateRaw} />
          <ReviewField label="Date notes" value={saint.dateNotes} />
          <ReviewField label="Last Airtable mirror seen" value={externalRecord?.lastSeenAt.toLocaleString()} />
        </div>
      </section>

      <section className="review-panel">
        <h2>Names, Places, Traditions</h2>
        <div className="field-grid">
          <ReviewField label="Aliases" value={saint.aliases.map((alias) => alias.alias).join(", ")} />
          <ReviewField label="Places" value={saint.places.map(formatSaintPlace).join(", ")} />
          <ReviewField label="Traditions" value={saint.traditions.map(({ tradition }) => tradition.name).join(", ")} />
        </div>
      </section>

      <section className="review-panel">
        <h2>Instagram Tracker Matches</h2>
        {trackerRows.length > 0 ? (
          <div className="review-list">
            {trackerRows.map((row) => (
              <div className="review-row" key={row.id}>
                <div>
                  <div className="review-meta">
                    <StatusBadge label={formatStatus(row.matchStatus)} />
                    {row.matchConfidence ? <StatusBadge label={row.matchConfidence} /> : null}
                  </div>
                  <h3>{row.saintName ?? "Unnamed tracker row"}</h3>
                  {row.postUrl ? <p><a href={row.postUrl}>{row.postUrl}</a></p> : null}
                </div>
                <StatusBadge label={`row ${row.rowNumber}`} />
              </div>
            ))}
          </div>
        ) : (
          <p>No matched tracker rows are linked to this saint.</p>
        )}
      </section>

      <section className="review-panel">
        <h2>Images</h2>
        {saint.galleryImages.length > 0 ? (
          <div className="media-grid">
            {saint.galleryImages.map(({ mediaAsset }) => (
              <figure className="image-with-credit" key={mediaAsset.id}>
                <img src={mediaAsset.url} alt={mediaAsset.altText ?? saint.displayName} width={mediaAsset.width ?? undefined} height={mediaAsset.height ?? undefined} />
                <figcaption>
                  <span>{mediaAsset.caption ?? "Imported saint image"}</span>
                  {mediaAsset.sourceUrl ? <small>Source preserved</small> : null}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p>No saint images have been attached.</p>
        )}
      </section>
    </div>
  );
}

async function getSaint(slugOrId: string) {
  return db.saint.findFirst({
    where: {
      OR: [
        { slug: slugOrId },
        { id: slugOrId }
      ]
    },
    include: {
      aliases: { orderBy: { createdAt: "asc" } },
      galleryImages: {
        include: { mediaAsset: true },
        orderBy: { sortOrder: "asc" }
      },
      places: {
        include: { place: true },
        orderBy: [
          { routeOrder: "asc" },
          { placeType: "asc" }
        ]
      },
      traditions: {
        include: { tradition: true },
        orderBy: { isPrimary: "desc" }
      }
    }
  });
}

async function getTrackerRows(externalId: string) {
  const [, tableIdOrName, recordId] = externalId.split(":");
  if (!tableIdOrName || !recordId) return [];

  const mirror = await db.airtableMirrorRecord.findFirst({
    where: { tableIdOrName, recordId },
    include: {
      instagramTrackerRows: {
        orderBy: { rowNumber: "asc" }
      }
    }
  });

  return mirror?.instagramTrackerRows ?? [];
}

function ReviewField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="review-field">
      <strong>{label}</strong>
      <span>{value || "Not set"}</span>
    </div>
  );
}

function formatSaintPlace({ place, placeType, routeOrder, routeLabel }: NonNullable<Awaited<ReturnType<typeof getSaint>>>["places"][number]) {
  const routeParts = [
    routeOrder == null ? undefined : `route ${routeOrder}`,
    routeLabel
  ].filter(Boolean);
  const routeSuffix = routeParts.length > 0 ? `, ${routeParts.join(": ")}` : "";
  return `${place.name} (${formatStatus(placeType)}${routeSuffix})`;
}

function StatusForm({
  saintId,
  status,
  label,
  variant = "primary"
}: {
  saintId: string;
  status: "needs_review" | "published" | "hidden";
  label: string;
  variant?: "primary" | "secondary" | "warning";
}) {
  const className = [
    "admin-form-button",
    variant === "secondary" ? "admin-form-button--secondary" : null,
    variant === "warning" ? "admin-form-button--warning" : null
  ].filter(Boolean).join(" ");

  return (
    <form action={updateSaintReviewStatus}>
      <input name="saintId" type="hidden" value={saintId} />
      <input name="status" type="hidden" value={status} />
      <button className={className} type="submit">{label}</button>
    </form>
  );
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}
