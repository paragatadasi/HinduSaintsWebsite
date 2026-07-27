import Link from "next/link";
import type { Route } from "next";
import type { Prisma as PrismaTypes } from "@/lib/generated/prisma/client";
import { db } from "@/lib/db";
import {
  getInstagramFirstPageMetadata,
  getInstagramQueueWhere,
  instagramQueueStatuses,
  rankInstagramQueueItems,
  type InstagramQueueStatus
} from "@/lib/instagram-admin-queue";
import { getIncompleteInstagramItemSummaries, getIncompleteInstagramItemWhere } from "@/lib/instagram-ingestion";
import { StatusBadge } from "@/components/ui/status-badge";
import { InstagramBulkReviewList } from "./instagram-bulk-review-list";
import { InstagramIngestionPanel } from "./instagram-ingestion-panel";

const PAGE_SIZE = 30;
const statuses = instagramQueueStatuses;
type StatusFilter = InstagramQueueStatus;
const statusFilters = ["all", ...instagramQueueStatuses] as const;

type AdminInstagramPageProps = {
  searchParams: Promise<{ page?: string | string[]; q?: string | string[]; status?: string }>;
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
  const { page, q, status } = await searchParams;
  const query = getSearchParam(q);
  const activeStatus = getActiveStatus(status);
  const requestedPage = getPageParam(page);
  const [itemCounts, queue, ingestionJobs, incompleteCount, incompleteItems] = await Promise.all([
    getInstagramItemCounts(),
    getInstagramItems(activeStatus, query, requestedPage),
    getInstagramIngestionJobs(),
    getIncompleteInstagramItemCount(),
    getIncompleteInstagramItemSummaries()
  ]);
  const returnTo = getInstagramReturnTo(activeStatus, query, queue.page);
  const reviewRows = queue.items.map(toInstagramReviewRow);

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
            <p>{formatQueueDescription(activeStatus, query, queue)}</p>
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
          activeStatus={activeStatus}
          emptyMessage={query ? "Try another search or clear the queue search." : "Try another status filter or run `npm run ingest:instagram -- --api --dry-run` to preview a fresh import."}
          items={reviewRows}
          key={returnTo}
          query={query}
          returnTo={returnTo}
          totalMatchingCount={queue.totalCount}
        />
        <InstagramQueuePagination
          activeStatus={activeStatus}
          page={queue.page}
          pageCount={queue.pageCount}
          query={query}
        />
      </section>

    </div>
  );
}

function toInstagramReviewRow(item: InstagramQueueItem) {
  const firstPageMetadata = getInstagramFirstPageMetadata(item.firstPageMetadata);
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

async function getInstagramItems(status: StatusFilter, query: string, requestedPage: number) {
  const where = getInstagramQueueWhere(status);
  const baseQuery = {
    where,
    orderBy: [{ status: "asc" }, { postedAt: "desc" }, { updatedAt: "desc" }],
    include: {
      saints: {
        include: { saint: { select: { canonicalName: true, displayName: true, slug: true } } },
        orderBy: [{ isPrimary: "desc" }, { matchConfidence: "desc" }]
      },
      mediaAssets: {
        orderBy: { sortOrder: "asc" }
      }
    }
  } satisfies PrismaTypes.InstagramItemFindManyArgs;

  if (query) {
    const rankedItems = rankInstagramQueueItems(
      await db.instagramItem.findMany(baseQuery),
      query
    );
    return paginateInstagramItems(rankedItems, requestedPage);
  }

  const totalCount = await db.instagramItem.count({ where });
  const pageCount = getPageCount(totalCount);
  const page = Math.min(requestedPage, pageCount);
  const items = await db.instagramItem.findMany({
    ...baseQuery,
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE
  });

  return {
    items,
    page,
    pageCount,
    totalCount,
    rangeStart: totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1,
    rangeEnd: (page - 1) * PAGE_SIZE + items.length
  };
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

function InstagramQueuePagination({
  activeStatus,
  page,
  pageCount,
  query
}: {
  activeStatus: StatusFilter;
  page: number;
  pageCount: number;
  query: string;
}) {
  if (pageCount <= 1) return null;

  return (
    <nav className="admin-pagination" aria-label="Instagram queue pages">
      {page > 1 ? (
        <Link
          className="admin-form-button admin-form-button--secondary"
          href={getInstagramReturnTo(activeStatus, query, page - 1) as Route}
          rel="prev"
        >
          Previous
        </Link>
      ) : (
        <span aria-disabled="true" className="admin-form-button admin-form-button--secondary">Previous</span>
      )}
      <span className="admin-pagination__status">Page {page.toLocaleString()} of {pageCount.toLocaleString()}</span>
      {page < pageCount ? (
        <Link
          className="admin-form-button admin-form-button--secondary"
          href={getInstagramReturnTo(activeStatus, query, page + 1) as Route}
          rel="next"
        >
          Next
        </Link>
      ) : (
        <span aria-disabled="true" className="admin-form-button admin-form-button--secondary">Next</span>
      )}
    </nav>
  );
}

function paginateInstagramItems<T>(items: T[], requestedPage: number) {
  const totalCount = items.length;
  const pageCount = getPageCount(totalCount);
  const page = Math.min(requestedPage, pageCount);
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const pageItems = items.slice(rangeStart === 0 ? 0 : rangeStart - 1, page * PAGE_SIZE);

  return {
    items: pageItems,
    page,
    pageCount,
    totalCount,
    rangeStart,
    rangeEnd: rangeStart === 0 ? 0 : rangeStart + pageItems.length - 1
  };
}

function getPageCount(totalCount: number) {
  return Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
}

function getSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return value?.trim() ?? "";
}

function getPageParam(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const page = Number.parseInt(rawValue ?? "", 10);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

function getInstagramReturnTo(status: StatusFilter, query: string, page = 1) {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
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

function formatQueueDescription(
  status: StatusFilter,
  query: string,
  stats: { rangeEnd: number; rangeStart: number; totalCount: number }
) {
  const queueLabel = status === "all" ? "Instagram items" : formatQueueTitle(status).toLowerCase();
  const recordLabel = stats.totalCount === 1 ? "record" : "records";
  const range = stats.totalCount === 0
    ? "0"
    : stats.rangeStart === stats.rangeEnd
      ? stats.rangeStart.toLocaleString()
      : `${stats.rangeStart.toLocaleString()}–${stats.rangeEnd.toLocaleString()}`;
  const base = `Showing ${range} of ${stats.totalCount.toLocaleString()} ${recordLabel} in ${queueLabel}.`;
  return query ? `${base} Filtered by "${query}".` : base;
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

function toTitleCase(value: string) {
  return value.replace(/\b\w/g, (match) => match.toUpperCase());
}
