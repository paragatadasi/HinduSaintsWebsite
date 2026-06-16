import Link from "next/link";
import type { Route } from "next";
import { db } from "@/lib/db";
import { rankSaintSearchResults } from "@/lib/saint-search";
import { SaintsBulkReviewList } from "./saints-bulk-review-list";

const statuses = ["all", "needs_review", "published", "draft", "hidden", "archived"] as const;
type StatusFilter = typeof statuses[number];

type AdminSaintsPageProps = {
  searchParams: Promise<{ q?: string | string[]; status?: string }>;
};

export default async function AdminSaintsPage({ searchParams }: AdminSaintsPageProps) {
  const { q, status } = await searchParams;
  const query = getSearchParam(q);
  const activeStatus = statuses.includes(status as StatusFilter) ? status as StatusFilter : "all";
  const [counts, saints, linkedSaintIds] = await Promise.all([
    getStatusCounts(),
    getSaints(activeStatus, query),
    getAirtableLinkedSaintIds()
  ]);
  const linkedSaintIdSet = new Set(linkedSaintIds);
  const returnTo = getSaintsReturnTo(activeStatus, query);
  const reviewRows = saints.map((saint) => ({
    id: saint.id,
    slug: saint.slug,
    displayName: saint.displayName,
    status: saint.status,
    shortDescription: saint.shortDescription,
    biographySummary: saint.biographySummary,
    eraLabel: saint.eraLabel,
    placeName: saint.places[0]?.place.name ?? null,
    hasInstagramContent: saint.hasInstagramContent,
    isAirtableLinked: linkedSaintIdSet.has(saint.id)
  }));

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
            href={getSaintsReturnTo(item, query) as Route}
            key={item}
          >
            {formatStatus(item)}
          </Link>
        ))}
      </nav>

      <form action="/admin/saints" className="admin-search" role="search">
        {activeStatus === "all" ? null : <input name="status" type="hidden" value={activeStatus} />}
        <label className="sr-only" htmlFor="admin-saints-search">Search saints</label>
        <input
          id="admin-saints-search"
          name="q"
          placeholder="Search by name, alias, place, tradition, date, or status"
          type="search"
          defaultValue={query}
        />
        <button className="admin-form-button" type="submit">Search</button>
        {query ? <Link className="admin-form-button admin-form-button--secondary" href={getSaintsReturnTo(activeStatus, "") as Route}>Clear</Link> : null}
      </form>

      <SaintsBulkReviewList returnTo={returnTo} saints={reviewRows} />
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

async function getSaints(status: StatusFilter, query: string) {
  const saints = await db.saint.findMany({
    where: status === "all" ? undefined : { status },
    orderBy: [{ status: "asc" }, { displayName: "asc" }],
    include: {
      aliases: { select: { alias: true } },
      places: {
        include: { place: true },
        orderBy: { placeType: "asc" }
      },
      traditions: {
        include: { tradition: true },
        orderBy: { isPrimary: "desc" }
      }
    }
  });

  if (!query) return saints;
  return rankSaintSearchResults(saints, query, { includeAdminFields: true })
    .map(({ item }) => item);
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

function getSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return value?.trim() ?? "";
}

function getSaintsReturnTo(status: StatusFilter, query: string) {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (query) params.set("q", query);
  const qs = params.toString();
  return qs ? `/admin/saints?${qs}` : "/admin/saints";
}
