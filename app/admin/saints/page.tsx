import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";

const statuses = ["all", "needs_review", "published", "draft", "hidden", "archived"] as const;
type StatusFilter = typeof statuses[number];

type AdminSaintsPageProps = {
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminSaintsPage({ searchParams }: AdminSaintsPageProps) {
  const { status } = await searchParams;
  const activeStatus = statuses.includes(status as StatusFilter) ? status as StatusFilter : "all";
  const [counts, saints, linkedSaintIds] = await Promise.all([
    getStatusCounts(),
    getSaints(activeStatus),
    getAirtableLinkedSaintIds()
  ]);
  const linkedSaintIdSet = new Set(linkedSaintIds);

  return (
    <div className="admin-stack">
      <div className="admin-toolbar">
        <div>
          <div className="eyebrow">Saint review</div>
          <h1>Saints</h1>
          <p className="lede">Review imported CMS records, edit public fields, and manage publication status.</p>
        </div>
      </div>

      <div className="admin-stat-grid">
        <Stat label="Published" value={counts.published} />
        <Stat label="Needs review" value={counts.needs_review} />
        <Stat label="Drafts" value={counts.draft} />
        <Stat label="Hidden" value={counts.hidden} />
      </div>

      <nav className="admin-tabs" aria-label="Saint status filters">
        {statuses.map((item) => (
          <Link
            aria-current={activeStatus === item ? "page" : undefined}
            className="admin-tab"
            href={item === "all" ? "/admin/saints" : `/admin/saints?status=${item}`}
            key={item}
          >
            {formatStatus(item)}
          </Link>
        ))}
      </nav>

      <div className="review-list">
        {saints.length > 0 ? saints.map((saint) => (
          <Link className="review-row" href={`/admin/saints/${saint.slug}`} key={saint.id}>
            <div>
              <div className="review-meta">
                <StatusBadge label={formatStatus(saint.status)} />
                {saint.hasInstagramContent ? <StatusBadge label="Instagram content" /> : null}
                {linkedSaintIdSet.has(saint.id) ? <StatusBadge label="Airtable linked" /> : null}
              </div>
              <h2>{saint.displayName}</h2>
              <p>{saint.shortDescription ?? saint.biographySummary ?? "No public summary yet."}</p>
            </div>
            <div className="review-meta">
              <StatusBadge label={saint.eraLabel ?? "Dates pending"} />
              <StatusBadge label={saint.places[0]?.place.name ?? "Place pending"} />
            </div>
          </Link>
        )) : (
          <div className="review-panel">
            <h2>No saints in this queue</h2>
            <p>Try another status filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}

async function getStatusCounts() {
  const grouped = await db.saint.groupBy({
    by: ["status"],
    _count: { _all: true }
  });
  return Object.fromEntries(grouped.map((row) => [row.status, row._count._all])) as Record<string, number>;
}

async function getSaints(status: StatusFilter) {
  return db.saint.findMany({
    where: status === "all" ? undefined : { status },
    orderBy: [{ status: "asc" }, { displayName: "asc" }],
    include: {
      places: {
        include: { place: true },
        orderBy: { placeType: "asc" },
        take: 1
      }
    }
  });
}

async function getAirtableLinkedSaintIds() {
  const externalRecords = await db.externalRecord.findMany({
    where: { sourceType: "airtable", entityType: "Saint", entityId: { not: null } },
    select: { entityId: true }
  });
  return externalRecords.map((record) => record.entityId).filter((id): id is string => Boolean(id));
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="admin-stat">
      <strong>{value ?? 0}</strong>
      <span>{label}</span>
    </div>
  );
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}
