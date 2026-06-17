import Link from "next/link";
import type { Route } from "next";
import type { Prisma } from "@/lib/generated/prisma/client";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { getInstagramLinkProps } from "@/lib/external-links";
import type { InstagramFirstPageMetadata } from "@/lib/instagram-metadata";
import { rankWeightedTextSearch, type WeightedSearchField } from "@/lib/search-text";
import { updateInstagramItemSaintStatus, updateInstagramItemStatus } from "./actions";
import { InstagramIngestionPanel } from "./instagram-ingestion-panel";

const statuses = ["needs_review", "suggested", "matched", "ignored", "published", "hidden", "imported"] as const;
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
  const [itemCounts, trackerCounts, items, trackerRows, ingestionJobs, incompleteCount] = await Promise.all([
    getInstagramItemCounts(),
    getTrackerCounts(),
    getInstagramItems(activeStatus, query),
    getTrackerRows(),
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
          <Stat href={getInstagramReturnTo("all", query)} active={activeStatus === "all"} label="All" value={getTotalCount(itemCounts)} />
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
        <nav className="admin-tabs" aria-label="Instagram item status filters">
          <Link aria-current={activeStatus === "all" ? "page" : undefined} className="admin-tab" href={getInstagramReturnTo("all", query) as Route}>
            All
          </Link>
          {statuses.map((status) => (
            <Link
              aria-current={activeStatus === status ? "page" : undefined}
              className="admin-tab"
              href={getInstagramReturnTo(status, query) as Route}
              key={status}
            >
              {formatStatus(status)}
            </Link>
          ))}
        </nav>
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

      <section className="review-panel">
        <h2>Manual tracker reference</h2>
        <p>These Google Sheets rows are useful signals, but they are not treated as the Instagram source of truth.</p>
        <div className="admin-stat-grid">
          {statuses.map((status) => (
            <Stat key={status} label={formatStatus(status)} value={trackerCounts[status]} />
          ))}
        </div>
        <div className="review-list">
          {trackerRows.length > 0 ? trackerRows.map((row) => (
            <article className="review-row" key={row.id}>
              <div>
                <div className="review-meta">
                  <StatusBadge label={formatStatus(row.matchStatus)} />
                  {row.matchConfidence ? <StatusBadge label={row.matchConfidence} /> : null}
                  <StatusBadge label={`row ${row.rowNumber}`} />
                </div>
                <h3>{row.saintName ?? "Unnamed tracker row"}</h3>
                {row.postUrl ? <p><a href={row.postUrl}>{row.postUrl}</a></p> : null}
                {row.matchedAirtableRecord ? <p>Airtable candidate: {getAirtableName(row.matchedAirtableRecord.rawFieldsJson)}</p> : null}
              </div>
              <div className="review-meta">
                <StatusBadge label={row.postedAt ? row.postedAt.toLocaleDateString() : "date pending"} />
              </div>
            </article>
          )) : (
            <div className="empty-state">
              <h3>No tracker rows need review</h3>
              <p>Tracker imports will appear here when they need editorial attention.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function InstagramReviewCard({ item }: { item: InstagramQueueItem }) {
  const firstPageMetadata = getFirstPageMetadata(item.firstPageMetadata);
  const metadataBadges = [
    firstPageMetadata.born ? `Born: ${firstPageMetadata.born}` : undefined,
    firstPageMetadata.samadhi ? `Samadhi: ${firstPageMetadata.samadhi}` : undefined,
    firstPageMetadata.keyPlace,
    firstPageMetadata.tradition
  ].filter((value): value is string => Boolean(value));

  return (
    <article className="instagram-review-card">
      <a className="instagram-review-card__media interactive-media" href={item.instagramUrl} {...getInstagramLinkProps(item.instagramUrl)}>
        {getInstagramPreviewUrl(item) ? (
          <img src={getInstagramPreviewUrl(item)} alt={getInstagramPreviewAlt(item)} />
        ) : (
          <span>{formatStatus(item.type)}</span>
        )}
      </a>
      <div className="instagram-review-card__body">
        <div className="review-meta">
          <StatusBadge label={formatStatus(item.status)} />
          <StatusBadge label={formatStatus(item.type)} />
          {item.matchConfidence ? <StatusBadge label={item.matchConfidence} /> : null}
          <StatusBadge label={item.postedAt ? item.postedAt.toLocaleDateString() : "date pending"} />
        </div>
        <h3>
          <Link href={`/admin/instagram/${item.id}`}>
            {firstPageMetadata.displayName ?? item.extractedSaintName ?? item.instagramShortcode ?? "Imported Instagram item"}
          </Link>
        </h3>
        {firstPageMetadata.subtitle ? <p>{firstPageMetadata.subtitle}</p> : null}
        {metadataBadges.length > 0 ? (
          <div className="review-meta">
            {metadataBadges.map((label) => <StatusBadge key={label} label={label} />)}
          </div>
        ) : null}
        {item.captionText ? <p className="instagram-review-card__caption">{item.captionText}</p> : <p>No caption text imported yet.</p>}
        <div className="review-meta">
          <a className="admin-text-link" href={item.instagramUrl} {...getInstagramLinkProps(item.instagramUrl)}>Open on Instagram</a>
          <Link className="admin-text-link" href={`/admin/instagram/${item.id}`}>Review item</Link>
          {item.instagramShortcode ? <StatusBadge label={item.instagramShortcode} /> : null}
        </div>
        {item.saints.length > 0 ? (
          <div className="review-meta">
            {item.saints.map((link) => (
              <div className="review-match" key={link.id}>
                <Link href={`/admin/saints/${link.saint.slug}`}>
                  <StatusBadge label={`${link.saint.displayName}: ${formatStatus(link.matchStatus)} ${link.matchConfidence}`} />
                </Link>
                <LinkStatusForm instagramItemSaintId={link.id} matchStatus="matched" label="Confirm match" />
                <LinkStatusForm instagramItemSaintId={link.id} matchStatus="ignored" label="Ignore match" variant="warning" />
              </div>
            ))}
          </div>
        ) : null}
        <div className="review-actions">
          <ItemStatusForm instagramItemId={item.id} status="needs_review" label="Needs review" variant="secondary" />
          <ItemStatusForm instagramItemId={item.id} status="hidden" label="Hide item" variant="warning" />
        </div>
      </div>
    </article>
  );
}

function ItemStatusForm({
  instagramItemId,
  status,
  label,
  variant = "primary"
}: {
  instagramItemId: string;
  status: "needs_review" | "suggested" | "matched" | "ignored" | "published" | "hidden";
  label: string;
  variant?: "primary" | "secondary" | "warning";
}) {
  return (
    <form action={updateInstagramItemStatus}>
      <input name="instagramItemId" type="hidden" value={instagramItemId} />
      <input name="status" type="hidden" value={status} />
      <button className={getActionButtonClassName(variant)} type="submit">{label}</button>
    </form>
  );
}

function LinkStatusForm({
  instagramItemSaintId,
  matchStatus,
  label,
  variant = "secondary"
}: {
  instagramItemSaintId: string;
  matchStatus: "suggested" | "needs_review" | "matched" | "ignored" | "published" | "hidden";
  label: string;
  variant?: "primary" | "secondary" | "warning";
}) {
  return (
    <form action={updateInstagramItemSaintStatus}>
      <input name="instagramItemSaintId" type="hidden" value={instagramItemSaintId} />
      <input name="matchStatus" type="hidden" value={matchStatus} />
      <button className={getActionButtonClassName(variant)} type="submit">{label}</button>
    </form>
  );
}

function getActionButtonClassName(variant: "primary" | "secondary" | "warning") {
  return [
    "admin-form-button",
    variant === "secondary" ? "admin-form-button--secondary" : null,
    variant === "warning" ? "admin-form-button--warning" : null
  ].filter(Boolean).join(" ");
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

async function getTrackerCounts() {
  const grouped = await db.instagramTrackerRow.groupBy({
    by: ["matchStatus"],
    _count: { _all: true }
  });
  return Object.fromEntries(grouped.map((row) => [row.matchStatus, row._count._all])) as Record<string, number>;
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

async function getTrackerRows() {
  return db.instagramTrackerRow.findMany({
    where: { matchStatus: { in: ["needs_review", "suggested", "imported"] } },
    orderBy: [{ matchStatus: "asc" }, { rowNumber: "asc" }],
    include: { matchedAirtableRecord: true },
    take: 30
  });
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

function getAirtableName(rawFieldsJson: unknown) {
  if (!rawFieldsJson || typeof rawFieldsJson !== "object" || Array.isArray(rawFieldsJson)) return "unknown";
  const fields = rawFieldsJson as Record<string, unknown>;
  return typeof fields.Name === "string" ? fields.Name : "unknown";
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
