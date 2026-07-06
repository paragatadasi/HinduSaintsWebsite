import Link from "next/link";
import type { Route } from "next";
import type { Prisma as PrismaTypes } from "@/lib/generated/prisma/client";
import { db } from "@/lib/db";
import { getIncompleteInstagramItemSummaries, getIncompleteInstagramItemWhere } from "@/lib/instagram-ingestion";
import type { InstagramFirstPageMetadata } from "@/lib/instagram-metadata";
import { rankWeightedTextSearch, type WeightedSearchField } from "@/lib/search-text";
import { StatusBadge } from "@/components/ui/status-badge";
import { InstagramBulkReviewList } from "./instagram-bulk-review-list";
import { InstagramIngestionPanel } from "./instagram-ingestion-panel";

const statuses = ["imported", "suggested", "needs_review", "matched", "published", "ignored"] as const;
type StatusFilter = typeof statuses[number] | "all";
const statusFilters = ["all", ...statuses] as const;

type AdminInstagramPageProps = {
  searchParams: Promise<{ q?: string | string[]; status?: string }>;
};

type InstagramQueueItem = PrismaTypes.InstagramItemGetPayload<{
  include: {
    saints: {
      include: {
        saint: {
          select: {
            canonicalName: true;
            displayName: true;
            slug: true;
          };
        };
      };
    };
    mediaAssets: true;
  };
}>;

export default async function AdminInstagramPage({ searchParams }: AdminInstagramPageProps) {
  const { q, status } = await searchParams;
  const query = getSearchParam(q);
  const activeStatus = getActiveStatus(status);
  const [itemCounts, items, ingestionJobs, incompleteCount, incompleteItems] = await Promise.all([
    getInstagramItemCounts(),
    getInstagramItems(activeStatus, query),
    getInstagramIngestionJobs(),
    getIncompleteInstagramItemCount(),
    getIncompleteInstagramItemSummaries()
  ]);
  const returnTo = getInstagramReturnTo(activeStatus, query);
  const reviewRows = items.map(toInstagramReviewRow);

  return (
    <div className="admin-stack">
      <div className="admin-toolbar">
        <div>
          <div className="eyebrow">Instagram reconciliation</div>
          <h1>Instagram queue</h1>
          <p className="lede">Resolve imported posts by matching them to saint records. Saints are the publishable content layer.</p>
        </div>
      </div>

      <InstagramIngestionPanel
        incompleteCount={incompleteCount}
        incompleteItems={incompleteItems}
        jobs={ingestionJobs}
      />

      <section className="review-panel review-panel--workflow admin-review-queue">
        <div className="review-workflow__header admin-review-queue__header">
          <div className="review-workflow__heading">
            <div className="review-workflow__eyebrow">Review queue</div>
            <h2>{formatQueueTitle(activeStatus)}</h2>
            <p>{formatQueueDescription(activeStatus, query, items.length)}</p>
          </div>
        </div>

        <nav className="admin-queue-filters" aria-label="Instagram status filters">
          {statusFilters.map((status) => (
            <FilterLink
              active={activeStatus === status}
              href={getInstagramReturnTo(status, query)}
              key={status}
              label={formatQueueTitle(status)}
              value={getStatusCount(itemCounts, status)}
            />
          ))}
        </nav>

        <form action="/admin/instagram" className="admin-search admin-search--queue" role="search">
          {activeStatus === "all" ? null : <input name="status" type="hidden" value={activeStatus} />}
          <label className="sr-only" htmlFor="admin-instagram-search">Search Instagram queue</label>
          <input
            id="admin-instagram-search"
            name="q"
            placeholder="Search by saint, shortcode, caption, biodata, URL, or status"
            type="search"
            defaultValue={query}
          />
          <button className="admin-form-button" type="submit">Search</button>
          {query ? <Link className="admin-form-button admin-form-button--secondary" href={getInstagramReturnTo(activeStatus, "") as Route}>Clear</Link> : null}
        </form>
        <InstagramBulkReviewList
          emptyMessage={query ? "Try another search or clear the queue search." : "Try another status filter or run `npm run ingest:instagram -- --api --dry-run` to preview a fresh import."}
          items={reviewRows}
          returnTo={returnTo}
        />
      </section>

    </div>
  );
}

function toInstagramReviewRow(item: InstagramQueueItem) {
  const firstPageMetadata = getFirstPageMetadata(item.firstPageMetadata);
  const title = firstPageMetadata.displayName ?? item.extractedSaintName ?? item.instagramShortcode ?? "Imported Instagram item";
  const summary = firstPageMetadata.subtitle ?? item.captionText ?? "No caption text imported yet.";

  return {
    id: item.id,
    instagramUrl: item.instagramUrl,
    previewAlt: item.captionText ? `Instagram preview: ${item.captionText.slice(0, 80)}` : "Instagram media preview",
    previewLabel: formatStatus(item.type),
    previewUrl: item.mediaAssets[0]?.cachedUrl ?? item.thumbnailUrl,
    summary,
    title
  };
}

function getActiveStatus(status: string | undefined): StatusFilter {
  if (!status || status === "all") return "all";
  return statuses.includes(status as typeof statuses[number]) ? status as typeof statuses[number] : "all";
}

async function getInstagramItemCounts() {
  const grouped = await db.instagramItem.groupBy({
    by: ["status"],
    _count: { _all: true }
  });
  return Object.fromEntries(grouped.map((row) => [row.status, row._count._all])) as Record<string, number>;
}

async function getInstagramItems(status: StatusFilter, query: string): Promise<InstagramQueueItem[]> {
  const items = await db.instagramItem.findMany({
    where: status === "all" ? undefined : { status },
    orderBy: [{ status: "asc" }, { postedAt: "desc" }, { updatedAt: "desc" }],
    include: {
      saints: {
        include: { saint: { select: { canonicalName: true, displayName: true, slug: true } } },
        orderBy: [{ isPrimary: "desc" }, { matchConfidence: "desc" }]
      },
      mediaAssets: {
        orderBy: { sortOrder: "asc" }
      }
    },
    take: query ? undefined : 30
  });

  if (!query) return items;
  return rankWeightedTextSearch(
    items,
    query,
    buildInstagramItemSearchFields,
    {
      limit: 30,
      tieBreaker: (left: InstagramQueueItem, right: InstagramQueueItem) => getInstagramSortDate(right) - getInstagramSortDate(left)
    }
  ).map(({ item }) => item);
}

async function getInstagramIngestionJobs() {
  const jobs = await db.instagramIngestionJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 8
  });

  return jobs.map((job) => ({
    id: job.id,
    mode: job.mode,
    status: job.status,
    sourceName: job.sourceName,
    totalRows: job.totalRows,
    processedRows: job.processedRows,
    importedRows: job.importedRows,
    skippedRows: job.skippedRows,
    updatedRows: job.updatedRows,
    failedRows: job.failedRows,
    mediaCachedRows: job.mediaCachedRows,
    incompleteRefetchedRows: job.incompleteRefetchedRows,
    message: job.message,
    error: job.error,
    rawSummary: job.rawSummary,
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString()
  }));
}

async function getIncompleteInstagramItemCount() {
  return db.instagramItem.count({
    where: getIncompleteInstagramItemWhere()
  });
}

function FilterLink({ active, href, label, value }: { active: boolean; href: string; label: string; value?: number }) {
  return (
    <Link aria-current={active ? "page" : undefined} className="admin-queue-filter" href={href as Route}>
      <span>{label}</span>
      {typeof value === "number" ? <StatusBadge label={String(value)} /> : null}
    </Link>
  );
}

function getFirstPageMetadata(value: unknown): InstagramFirstPageMetadata {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const metadata = value as Record<string, unknown>;

  return {
    displayName: getString(metadata.displayName),
    subtitle: getString(metadata.subtitle),
    born: getString(metadata.born),
    samadhi: getString(metadata.samadhi),
    keyPlace: getString(metadata.keyPlace),
    tradition: getString(metadata.tradition),
    guru: getString(metadata.guru)
  };
}

function getString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function buildInstagramItemSearchFields(item: InstagramQueueItem): WeightedSearchField[] {
  const metadata = getFirstPageMetadata(item.firstPageMetadata);
  return [
    { value: metadata.displayName, weight: 6 },
    { value: item.extractedSaintName, weight: 6 },
    ...item.saints.flatMap((link) => [
      { value: link.saint.displayName, weight: 6 },
      { value: link.saint.canonicalName, weight: 5 },
      { value: link.matchStatus, weight: 2 },
      { value: link.matchConfidence, weight: 1.5 }
    ]),
    { value: item.instagramShortcode, weight: 5 },
    { value: metadata.subtitle, weight: 3 },
    { value: metadata.keyPlace, weight: 3 },
    { value: metadata.tradition, weight: 3 },
    { value: metadata.guru, weight: 3 },
    { value: metadata.born, weight: 2 },
    { value: metadata.samadhi, weight: 2 },
    { value: item.firstPageText, weight: 2 },
    { value: item.captionText, weight: 1.4 },
    { value: item.instagramUrl, weight: 1 },
    { value: item.status, weight: 1 },
    { value: item.type, weight: 1 },
    { value: item.postedAt?.toLocaleDateString(), weight: 0.8 }
  ];
}

function getInstagramSortDate(item: InstagramQueueItem) {
  return (item.postedAt ?? item.updatedAt).getTime();
}

function getSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return value?.trim() ?? "";
}

function getInstagramReturnTo(status: StatusFilter, query: string) {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (query) params.set("q", query);
  const qs = params.toString();
  return qs ? `/admin/instagram?${qs}` : "/admin/instagram";
}

function getStatusCount(counts: Record<string, number>, status: StatusFilter) {
  if (status === "all") {
    return statuses.reduce((total, item) => total + (counts[item] ?? 0), 0);
  }
  return counts[status] ?? 0;
}

function formatQueueTitle(status: StatusFilter) {
  if (status === "all") return "All items";
  if (status === "needs_review") return "Needs review";
  return toTitleCase(formatStatus(status));
}

function formatQueueDescription(status: StatusFilter, query: string, count: number) {
  const queue = status === "all" ? "Instagram items" : formatQueueTitle(status).toLowerCase();
  const base = `${count.toLocaleString()} ${count === 1 ? "record" : "records"} in ${queue}.`;
  return query ? `${base} Filtered by "${query}".` : base;
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

function toTitleCase(value: string) {
  return value.replace(/\b\w/g, (match) => match.toUpperCase());
}
