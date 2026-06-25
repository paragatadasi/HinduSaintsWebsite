import Link from "next/link";
import type { Route } from "next";
import { db } from "@/lib/db";
import { serializeAirtableImportJob } from "@/lib/airtable-import-job-view";
import { rankSaintSearchResults } from "@/lib/saint-search";
import { AirtableImportPanel } from "./airtable-import-panel";
import { SaintsBulkReviewList } from "./saints-bulk-review-list";

const statuses = ["all", "draft", "needs_review", "published", "archived"] as const;
type StatusFilter = typeof statuses[number];

type AdminSaintsPageProps = {
  searchParams: Promise<{ q?: string | string[]; status?: string }>;
};

export default async function AdminSaintsPage({ searchParams }: AdminSaintsPageProps) {
  const { q, status } = await searchParams;
  const query = getSearchParam(q);
  const activeStatus = statuses.includes(status as StatusFilter) ? status as StatusFilter : "all";
  const [counts, saints, airtableJobs] = await Promise.all([
    getStatusCounts(),
    getSaints(activeStatus, query),
    getAirtableImportJobs()
  ]);
  const returnTo = getSaintsReturnTo(activeStatus, query);
  const reviewRows = saints.map((saint) => ({
    id: saint.id,
    slug: saint.slug,
    displayName: saint.displayName,
    shortDescription: saint.shortDescription,
    biographySummary: saint.biographySummary
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

      <div className="admin-stat-grid" aria-label="Saint status filters">
        {statuses.map((item) => (
          <Stat
            active={activeStatus === item}
            href={getSaintsReturnTo(item, query)}
            key={item}
            label={formatStatusLabel(item)}
            value={getStatusCount(counts, item)}
          />
        ))}
      </div>

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

async function getAirtableImportJobs() {
  const jobs = await db.airtableImportJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 8
  });

  return jobs.map(serializeAirtableImportJob);
}

function Stat({ active, href, label, value }: { active: boolean; href: string; label: string; value: number }) {
  return (
    <Link aria-current={active ? "page" : undefined} className="admin-stat admin-stat--link interactive-surface" href={href as Route}>
      <strong>{value ?? 0}</strong>
      <span>{label}</span>
    </Link>
  );
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
  if (status === "all") return "Total Saints";
  if (status === "draft") return "Drafts";
  if (status === "needs_review") return "Needs review";
  if (status === "published") return "Published";
  return "Archived";
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
