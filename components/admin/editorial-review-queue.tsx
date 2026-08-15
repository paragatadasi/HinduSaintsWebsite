import Link from "next/link";
import type { Route } from "next";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { getUserDisplayName, userDisplayNameSelect } from "@/lib/user-display-name";

export async function EditorialReviewQueue() {
  const revisions = await db.editorialRevision.findMany({
    where: { status: "needs_review" },
    include: {
      updatedBy: { select: userDisplayNameSelect }
    },
    orderBy: [{ submittedAt: "asc" }, { updatedAt: "asc" }]
  });
  const labels = await getRevisionLabels(revisions);

  return (
    <section className="admin-stack" id="editorial-reviews" aria-labelledby="editorial-reviews-title">
      <div>
        <div className="eyebrow">Editorial reviews</div>
        <div className="section-heading">
          <h2 id="editorial-reviews-title">Submitted narrative revisions</h2>
          <StatusBadge label={String(revisions.length)} />
        </div>
        <p className="lede">Review replacement public copy and its citations while the current published version remains live.</p>
      </div>
      {revisions.length > 0 ? (
        <div className="review-list">
          {revisions.map((revision) => {
            const destination = getRevisionDestination(revision.entityType, revision.entityId, labels);
            return (
              <article className="review-row" key={revision.id}>
                <div className="review-row__content">
                  <div className="review-meta">
                    <StatusBadge label={formatLabel(revision.entityType)} />
                    <StatusBadge label="Needs review" />
                  </div>
                  <h3>{labels.get(`${revision.entityType}:${revision.entityId}`)?.name ?? "Editorial revision"}</h3>
                  <p>Submitted {revision.submittedAt?.toLocaleString() ?? revision.updatedAt.toLocaleString()} by {getUserDisplayName(revision.updatedBy)}.</p>
                </div>
                {destination ? <div className="review-actions">
                  <Link className="button button--secondary" href={`/admin/preview/revision/${revision.id}` as Route} rel="noreferrer" target="_blank">Preview page</Link>
                  <Link className="button button--secondary" href={destination}>Open review</Link>
                </div> : <span className="empty-note">Content record unavailable</span>}
              </article>
            );
          })}
        </div>
      ) : <p className="empty-note">No narrative revisions are waiting for review.</p>}
    </section>
  );
}

async function getRevisionLabels(revisions: Array<{ entityType: string; entityId: string }>) {
  const ids = (entityType: string) => revisions.filter((revision) => revision.entityType === entityType).map((revision) => revision.entityId);
  const [saints, traditions, places] = await Promise.all([
    db.saint.findMany({ where: { id: { in: ids("saint") } }, select: { id: true, displayName: true, slug: true } }),
    db.tradition.findMany({ where: { id: { in: ids("tradition") } }, select: { id: true, name: true, slug: true } }),
    db.place.findMany({ where: { id: { in: ids("place") } }, select: { id: true, name: true, slug: true } })
  ]);
  return new Map<string, { name: string; slug: string }>([
    ...saints.map((row) => [`saint:${row.id}`, { name: row.displayName, slug: row.slug }] as const),
    ...traditions.map((row) => [`tradition:${row.id}`, { name: row.name, slug: row.slug }] as const),
    ...places.map((row) => [`place:${row.id}`, { name: row.name, slug: row.slug }] as const)
  ]);
}

function getRevisionDestination(entityType: string, entityId: string, labels: Map<string, { name: string; slug: string }>) {
  const stored = labels.get(`${entityType}:${entityId}`);
  if (!stored) return null;
  if (entityType === "saint") return `/admin/saints/${stored.slug}/biography` as Route;
  if (entityType === "tradition") return `/admin/traditions/${stored.slug}/content` as Route;
  if (entityType === "place") return `/admin/places/${stored.slug}` as Route;
  return null;
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}
