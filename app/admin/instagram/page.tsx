import Link from "next/link";
import type { Route } from "next";
import type { Prisma } from "@/lib/generated/prisma/client";
import { db } from "@/lib/db";
import { getInstagramLinkProps } from "@/lib/external-links";
import type { InstagramFirstPageMetadata } from "@/lib/instagram-metadata";
import { rankWeightedTextSearch, type WeightedSearchField } from "@/lib/search-text";
import { InstagramIngestionPanel } from "./instagram-ingestion-panel";

const statuses = ["imported", "suggested", "needs_review", "matched", "published", "ignored"] as const;
type StatusFilter = typeof statuses[number] | "all";

type AdminInstagramPageProps = {
  searchParams: Promise<{ q?: string | string[]; status?: string }>;
};

type InstagramQueueItem = Prisma.InstagramItemGetPayload<{
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
  const [itemCounts, items, ingestionJobs, incompleteCount] = await Promise.all([
    getInstagramItemCounts(),
    getInstagramItems(activeStatus, query),
    getInstagramIngestionJobs(),
    getIncompleteInstagramItemCount()
  ]);

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
        jobs={ingestionJobs}
      />

      <section className="review-panel">
        <h2>Imported posts and reels</h2>
        <p>These records come from Instagram exports or ingests and become public only through matched, published saint pages.</p>
        <div className="admin-stat-grid">
          <Stat href={getInstagramReturnTo("all", query)} active={activeStatus === "all"} label="Total items" value={getTotalCount(itemCounts)} />
          {statuses.map((status) => (
            <Stat
              active={activeStatus === status}
              href={getInstagramReturnTo(status, query)}
              key={status}
              label={formatStatus(status)}
              value={itemCounts[status]}
            />
          ))}
        </div>
        <form action="/admin/instagram" className="admin-search" role="search">
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
        <div className="instagram-review-list">
          {items.length > 0 ? items.map((item) => (
            <InstagramReviewCard item={item} key={item.id} />
          )) : (
            <div className="empty-state">
              <h3>No imported Instagram items in this queue</h3>
              <p>{query ? "Try another search or clear the queue search." : "Try another status filter or run `npm run ingest:instagram -- --api --dry-run` to preview a fresh import."}</p>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}

function InstagramReviewCard({ item }: { item: InstagramQueueItem }) {
  const firstPageMetadata = getFirstPageMetadata(item.firstPageMetadata);
  const title = firstPageMetadata.displayName ?? item.extractedSaintName ?? item.instagramShortcode ?? "Imported Instagram item";
  const summary = firstPageMetadata.subtitle ?? item.captionText ?? "No caption text imported yet.";

  return (
    <article className="instagram-review-card instagram-review-card--compact interactive-surface">
      <Link className="instagram-review-card__media" href={`/admin/instagram/${item.id}`} aria-label={`Review ${title}`}>
        {getInstagramPreviewUrl(item) ? (
          <img src={getInstagramPreviewUrl(item)} alt={getInstagramPreviewAlt(item)} />
        ) : (
          <span>{formatStatus(item.type)}</span>
        )}
      </Link>
      <span className="instagram-review-card__body">
        <Link className="instagram-review-card__link" href={`/admin/instagram/${item.id}`}>
          <span className="instagram-review-card__title">{title}</span>
          <span className="instagram-review-card__caption">{summary}</span>
        </Link>
        <span className="instagram-review-card__actions">
          <Link className="admin-form-button" href={`/admin/instagram/${item.id}`}>Review</Link>
          <a className="admin-form-button admin-form-button--outline" href={item.instagramUrl} {...getInstagramLinkProps(item.instagramUrl)}>Open on Instagram</a>
        </span>
      </span>
    </article>
  );
}

function getActiveStatus(status: string | undefined): StatusFilter {
  if (!status || status === "all") return "all";
  return statuses.includes(status as typeof statuses[number]) ? status as typeof statuses[number] : "all";
}

function getTotalCount(counts: Record<string, number>) {
  return Object.values(counts).reduce((total, count) => total + count, 0);
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
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString()
  }));
}

async function getIncompleteInstagramItemCount() {
  return db.instagramItem.count({
    where: {
      OR: [
        { firstPageText: null },
        { mediaAssets: { none: {} } }
      ]
    }
  });
}

function Stat({ active = false, href, label, value }: { active?: boolean; href?: string; label: string; value?: number }) {
  const content = (
    <>
      <strong>{value ?? 0}</strong>
      <span>{label}</span>
    </>
  );

  if (!href) {
    return <div className="admin-stat">{content}</div>;
  }

  return (
    <Link aria-current={active ? "page" : undefined} className="admin-stat admin-stat--link interactive-surface" href={href as Route}>
      {content}
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

function getInstagramPreviewAlt(item: InstagramQueueItem) {
  return item.captionText ? `Instagram preview: ${item.captionText.slice(0, 80)}` : "Instagram media preview";
}

function getInstagramPreviewUrl(item: InstagramQueueItem) {
  return item.mediaAssets[0]?.cachedUrl ?? item.thumbnailUrl;
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}
