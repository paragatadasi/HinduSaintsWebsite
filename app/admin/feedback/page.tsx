import Link from "next/link";
import type { Route } from "next";
import type { Prisma } from "@/lib/generated/prisma/client";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;
const statusFilters = ["open", "new", "in_review", "resolved", "spam", "archived", "all"] as const;
type StatusFilter = typeof statusFilters[number];

type FeedbackInboxPageProps = {
  searchParams: Promise<{
    page?: string | string[];
    q?: string | string[];
    status?: string;
  }>;
};

export default async function FeedbackInboxPage({ searchParams }: FeedbackInboxPageProps) {
  const { page, q, status } = await searchParams;
  const query = getSearchParam(q);
  const activeStatus = getActiveStatus(status);
  const requestedPage = getPageParam(page);
  const where = getFeedbackWhere(activeStatus, query);
  const [groupedCounts, totalCount] = await Promise.all([
    db.feedbackSubmission.groupBy({
      by: ["status"],
      _count: { _all: true }
    }),
    db.feedbackSubmission.count({ where })
  ]);
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const activePage = Math.min(requestedPage, pageCount);
  const items = await db.feedbackSubmission.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    skip: (activePage - 1) * PAGE_SIZE,
    take: PAGE_SIZE
  });
  const counts = Object.fromEntries(
    groupedCounts.map((row) => [row.status, row._count._all])
  ) as Record<string, number>;
  const openCount = (counts.new ?? 0) + (counts.in_review ?? 0);
  const allCount = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const rangeStart = totalCount === 0 ? 0 : (activePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = rangeStart === 0 ? 0 : rangeStart + items.length - 1;
  const returnTo = getFeedbackReturnTo(activeStatus, query, activePage);

  return (
    <div className="admin-stack">
      <div className="admin-toolbar">
        <div>
          <div className="eyebrow">Editorial correspondence</div>
          <h1>Feedback inbox</h1>
          <p className="lede">Triage corrections, source notes, and other feedback submitted from public pages.</p>
        </div>
      </div>

      <section className="review-panel review-panel--workflow admin-review-queue">
        <div className="review-workflow__header admin-review-queue__header">
          <div className="review-workflow__heading">
            <div className="review-workflow__eyebrow">Shared inbox</div>
            <h2>{formatStatusLabel(activeStatus)}</h2>
            <p>{formatQueueDescription(activeStatus, query, rangeStart, rangeEnd, totalCount)}</p>
          </div>
        </div>

        <nav className="admin-queue-filters" aria-label="Feedback status filters">
          {statusFilters.map((filter) => (
            <Link
              aria-current={activeStatus === filter ? "page" : undefined}
              className="admin-queue-filter"
              href={getFeedbackReturnTo(filter, query) as Route}
              key={filter}
            >
              <span>{formatStatusLabel(filter)}</span>
              <StatusBadge label={String(getStatusCount(filter, counts, openCount, allCount))} />
            </Link>
          ))}
        </nav>

        <form action="/admin/feedback" className="admin-search admin-search--queue" role="search">
          {activeStatus === "open" ? null : <input name="status" type="hidden" value={activeStatus} />}
          <label className="sr-only" htmlFor="admin-feedback-search">Search feedback inbox</label>
          <input
            defaultValue={query}
            id="admin-feedback-search"
            name="q"
            placeholder="Search message, submitter, email, or page"
            type="search"
          />
          <button className="admin-form-button" type="submit">Search</button>
          {query ? (
            <Link
              className="admin-form-button admin-form-button--secondary"
              href={getFeedbackReturnTo(activeStatus, "") as Route}
            >
              Clear
            </Link>
          ) : null}
        </form>

        <div className="review-list" aria-label="Feedback submissions">
          {items.length > 0 ? items.map((item) => (
            <Link
              className="review-row review-row__link feedback-inbox-row interactive-surface"
              href={`/admin/feedback/${item.id}?returnTo=${encodeURIComponent(returnTo)}` as Route}
              key={item.id}
            >
              <div className="review-row__content">
                <div className="review-meta">
                  <StatusBadge label={formatStatusLabel(item.status)} />
                  <StatusBadge label={formatCategory(item.category)} />
                  {item.entityType ? <StatusBadge label={`${formatStatusLabel(item.entityType)} page`} /> : null}
                </div>
                <h2>{formatSubmissionTitle(item.category, item.pageTitle)}</h2>
                <p className="feedback-inbox-row__preview">{item.message}</p>
                <p className="feedback-inbox-row__meta">
                  {item.submitterName || "Anonymous"}
                  {item.assignedToEmail ? ` · Assigned to ${item.assignedToEmail}` : " · Unassigned"}
                </p>
              </div>
              <div className="feedback-inbox-row__aside">
                <time dateTime={item.createdAt.toISOString()}>{formatReceivedAt(item.createdAt)}</time>
                <span className="admin-text-link">Review</span>
              </div>
            </Link>
          )) : (
            <div className="review-row">
              <div>
                <h2>No feedback found</h2>
                <p>{query ? "Try another search or clear the inbox search." : "There are no submissions in this queue."}</p>
              </div>
            </div>
          )}
        </div>

        <Pagination
          activeStatus={activeStatus}
          page={activePage}
          pageCount={pageCount}
          query={query}
        />
      </section>
    </div>
  );
}

function getFeedbackWhere(status: StatusFilter, query: string): Prisma.FeedbackSubmissionWhereInput {
  const statusWhere: Prisma.FeedbackSubmissionWhereInput = status === "open"
    ? { status: { in: ["new", "in_review"] } }
    : status === "all"
      ? {}
      : { status };
  const queryWhere = query
    ? {
        OR: [
          { message: { contains: query, mode: "insensitive" as const } },
          { submitterName: { contains: query, mode: "insensitive" as const } },
          { submitterEmail: { contains: query, mode: "insensitive" as const } },
          { pageTitle: { contains: query, mode: "insensitive" as const } },
          { pagePath: { contains: query, mode: "insensitive" as const } }
        ]
      }
    : {};

  return { ...statusWhere, ...queryWhere };
}

function Pagination({
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
    <nav className="admin-pagination" aria-label="Feedback inbox pages">
      {page > 1 ? (
        <Link
          className="admin-form-button admin-form-button--secondary"
          href={getFeedbackReturnTo(activeStatus, query, page - 1) as Route}
          rel="prev"
        >
          Previous
        </Link>
      ) : <span aria-disabled="true" className="admin-form-button admin-form-button--secondary">Previous</span>}
      <span className="admin-pagination__status">Page {page} of {pageCount}</span>
      {page < pageCount ? (
        <Link
          className="admin-form-button admin-form-button--secondary"
          href={getFeedbackReturnTo(activeStatus, query, page + 1) as Route}
          rel="next"
        >
          Next
        </Link>
      ) : <span aria-disabled="true" className="admin-form-button admin-form-button--secondary">Next</span>}
    </nav>
  );
}

function getActiveStatus(value?: string): StatusFilter {
  return statusFilters.includes(value as StatusFilter) ? value as StatusFilter : "open";
}

function getStatusCount(
  status: StatusFilter,
  counts: Record<string, number>,
  openCount: number,
  allCount: number
) {
  if (status === "open") return openCount;
  if (status === "all") return allCount;
  return counts[status] ?? 0;
}

function getFeedbackReturnTo(status: StatusFilter, query: string, page = 1) {
  const params = new URLSearchParams();
  if (status !== "open") params.set("status", status);
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/admin/feedback?${qs}` : "/admin/feedback";
}

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0]?.trim() ?? "" : value?.trim() ?? "";
}

function getPageParam(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(rawValue ?? "", 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

function formatSubmissionTitle(category: string, pageTitle: string | null) {
  return `${formatCategory(category)} — ${pageTitle || "General feedback"}`;
}

function formatCategory(category: string) {
  const labels: Record<string, string> = {
    comment_testimony: "Comment/testimony",
    correction: "Correction",
    source_citation: "Source or citation",
    name_spelling: "Name or spelling",
    missing_information: "Missing information",
    technical_issue: "Technical issue",
    other: "Other"
  };
  return labels[category] ?? formatStatusLabel(category);
}

function formatStatusLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatReceivedAt(value: Date) {
  return value.toLocaleString("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatQueueDescription(
  status: StatusFilter,
  query: string,
  rangeStart: number,
  rangeEnd: number,
  totalCount: number
) {
  const range = totalCount === 0 ? "0" : rangeStart === rangeEnd ? String(rangeStart) : `${rangeStart}–${rangeEnd}`;
  const base = `Showing ${range} of ${totalCount.toLocaleString()} submissions in ${formatStatusLabel(status).toLowerCase()}.`;
  return query ? `${base} Filtered by “${query}”.` : base;
}
