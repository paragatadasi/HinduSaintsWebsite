import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { serializeAirtableImportJob } from "@/lib/airtable-import-job-view";
import { rankSaintSearchResults } from "@/lib/saint-search";
import { AirtableImportPanel } from "./airtable-import-panel";
import { SaintsBulkReviewList } from "./saints-bulk-review-list";

const statuses = ["all", "needs_review", "draft", "published", "archived"] as const;
type StatusFilter = typeof statuses[number];
const instagramFilters = ["all", "has_match", "missing_match"] as const;
type InstagramFilter = typeof instagramFilters[number];
const photoFilters = ["all", "has_photo", "missing_photo"] as const;
type PhotoFilter = typeof photoFilters[number];

type SaintQueueFilters = {
  instagram: InstagramFilter;
  photo: PhotoFilter;
};

type AdminSaintsPageProps = {
  searchParams: Promise<{ q?: string | string[]; status?: string; instagram?: string; photo?: string }>;
};

export default async function AdminSaintsPage({ searchParams }: AdminSaintsPageProps) {
  const { q, status, instagram, photo } = await searchParams;
  const query = getSearchParam(q);
  const activeStatus = statuses.includes(status as StatusFilter) ? status as StatusFilter : "all";
  const activeFilters: SaintQueueFilters = {
    instagram: instagramFilters.includes(instagram as InstagramFilter) ? instagram as InstagramFilter : "all",
    photo: photoFilters.includes(photo as PhotoFilter) ? photo as PhotoFilter : "all"
  };
  const [counts, saints, airtableJobs] = await Promise.all([
    getStatusCounts(activeFilters),
    getSaints(activeStatus, activeFilters, query),
    getAirtableImportJobs()
  ]);
  const returnTo = getSaintsReturnTo(activeStatus, activeFilters, query);
  const reviewRows = saints.map((saint) => ({
    id: saint.id,
    slug: saint.slug,
    displayName: saint.displayName
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

      <AirtableImportPanel jobs={airtableJobs} />

      <section className="review-panel review-panel--workflow admin-review-queue">
        <div className="review-workflow__header admin-review-queue__header">
          <div className="review-workflow__heading">
            <div className="review-workflow__eyebrow">Review queue</div>
            <h2>{formatStatusLabel(activeStatus)}</h2>
            <p>{formatQueueDescription(activeStatus, query, reviewRows.length)}</p>
          </div>
        </div>

        <nav className="admin-queue-filters" aria-label="Saint status filters">
          {statuses.map((item) => (
            <FilterLink
              active={activeStatus === item}
              href={getSaintsReturnTo(item, activeFilters, query)}
              key={item}
              label={formatStatusLabel(item)}
              value={getStatusCount(counts, item)}
            />
          ))}
        </nav>

        <div className="admin-queue-filter-groups">
          <FilterGroup label="Instagram match">
            {instagramFilters.map((item) => (
              <FilterLink
                active={activeFilters.instagram === item}
                href={getSaintsReturnTo(activeStatus, { ...activeFilters, instagram: item }, query)}
                key={item}
                label={formatInstagramFilterLabel(item)}
              />
            ))}
          </FilterGroup>
          <FilterGroup label="Primary photo">
            {photoFilters.map((item) => (
              <FilterLink
                active={activeFilters.photo === item}
                href={getSaintsReturnTo(activeStatus, { ...activeFilters, photo: item }, query)}
                key={item}
                label={formatPhotoFilterLabel(item)}
              />
            ))}
          </FilterGroup>
        </div>

        <form action="/admin/saints" className="admin-search admin-search--queue" role="search">
          {activeStatus === "all" ? null : <input name="status" type="hidden" value={activeStatus} />}
          {activeFilters.instagram === "all" ? null : <input name="instagram" type="hidden" value={activeFilters.instagram} />}
          {activeFilters.photo === "all" ? null : <input name="photo" type="hidden" value={activeFilters.photo} />}
          <label className="sr-only" htmlFor="admin-saints-search">Search saints</label>
          <input
            id="admin-saints-search"
            name="q"
            placeholder="Search by name, alias, place, tradition, date, or status"
            type="search"
            defaultValue={query}
          />
          <button className="admin-form-button" type="submit">Search</button>
          {query ? <Link className="admin-form-button admin-form-button--secondary" href={getSaintsReturnTo(activeStatus, activeFilters, "") as Route}>Clear</Link> : null}
        </form>

        <SaintsBulkReviewList returnTo={returnTo} saints={reviewRows} />
      </section>
    </div>
  );
}

async function getStatusCounts(filters: SaintQueueFilters) {
  const grouped = await db.saint.groupBy({
    by: ["status"],
    where: getSaintQueueWhere("all", filters),
    _count: { _all: true }
  });
  return Object.fromEntries(grouped.map((row) => [row.status, row._count._all])) as Record<string, number>;
}

async function getSaints(status: StatusFilter, filters: SaintQueueFilters, query: string) {
  const saints = await db.saint.findMany({
    where: getSaintQueueWhere(status, filters),
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

async function getAirtableImportJobs() {
  const jobs = await db.airtableImportJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 8
  });

  return jobs.map(serializeAirtableImportJob);
}

function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="admin-queue-filter-group">
      <span>{label}</span>
      <div className="admin-queue-filters">{children}</div>
    </div>
  );
}

function FilterLink({ active, href, label, value }: { active: boolean; href: string; label: string; value?: number }) {
  return (
    <Link aria-current={active ? "page" : undefined} className="admin-queue-filter" href={href as Route}>
      <span>{label}</span>
      {typeof value === "number" ? <StatusBadge label={String(value)} /> : null}
    </Link>
  );
}

function getSaintQueueWhere(status: StatusFilter, filters: SaintQueueFilters) {
  return {
    ...(status === "all" ? {} : { status }),
    ...(filters.instagram === "has_match" ? { instagramItems: { some: {} } } : {}),
    ...(filters.instagram === "missing_match" ? { instagramItems: { none: {} } } : {}),
    ...(filters.photo === "has_photo" ? { primaryImageId: { not: null } } : {}),
    ...(filters.photo === "missing_photo" ? { primaryImageId: null } : {})
  };
}

function getStatusCount(counts: Record<string, number>, status: StatusFilter) {
  if (status === "all") {
    return statuses
      .filter((item) => item !== "all")
      .reduce((total, item) => total + (counts[item] ?? 0), 0);
  }
  return counts[status] ?? 0;
}

function formatStatusLabel(status: StatusFilter) {
  if (status === "all") return "All saints";
  if (status === "draft") return "Drafts";
  if (status === "needs_review") return "Needs review";
  if (status === "published") return "Published";
  return "Archived";
}

function formatInstagramFilterLabel(filter: InstagramFilter) {
  if (filter === "has_match") return "Has match";
  if (filter === "missing_match") return "Missing match";
  return "Any";
}

function formatPhotoFilterLabel(filter: PhotoFilter) {
  if (filter === "has_photo") return "Has photo";
  if (filter === "missing_photo") return "Missing photo";
  return "Any";
}

function formatQueueDescription(status: StatusFilter, query: string, count: number) {
  const queue = status === "all" ? "saints" : formatStatusLabel(status).toLowerCase();
  const base = `${count.toLocaleString()} ${count === 1 ? "record" : "records"} in ${queue}.`;
  return query ? `${base} Filtered by "${query}".` : base;
}

function getSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return value?.trim() ?? "";
}

function getSaintsReturnTo(status: StatusFilter, filters: SaintQueueFilters, query: string) {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (filters.instagram !== "all") params.set("instagram", filters.instagram);
  if (filters.photo !== "all") params.set("photo", filters.photo);
  if (query) params.set("q", query);
  const qs = params.toString();
  return qs ? `/admin/saints?${qs}` : "/admin/saints";
}
