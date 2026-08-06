import Link from "next/link";
import type { Route } from "next";
import { AggregateViewsChart, type AggregateViewPoint } from "@/components/admin/aggregate-views-chart";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/admin-access";
import { BUCKETED_PERFORMANCE_EVENT_NAMES, ENGAGEMENT_EVENT_NAMES } from "@/lib/telemetry-contract";

export default async function AdminAnalyticsPage() {
  await requireCapability("view_analytics");
  const today = getUtcDay();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 29);

  const [allTime, todayTotal, allTimeByPage, lastThirtyDaysByPage, todayByPage, lastThirtyDaysByDay, telemetryRows] =
    await Promise.all([
      db.pageViewDaily.aggregate({ _sum: { views: true } }),
      db.pageViewDaily.aggregate({
        where: { date: today },
        _sum: { views: true }
      }),
      db.pageViewDaily.groupBy({
        by: ["path"],
        _sum: { views: true }
      }),
      db.pageViewDaily.groupBy({
        by: ["path"],
        where: { date: { gte: thirtyDaysAgo } },
        _sum: { views: true }
      }),
      db.pageViewDaily.findMany({
        where: { date: today },
        select: { path: true, views: true }
      }),
      db.pageViewDaily.groupBy({
        by: ["date"],
        where: { date: { gte: thirtyDaysAgo } },
        _sum: { views: true },
        orderBy: { date: "asc" }
      }),
      db.telemetryDaily.findMany({
        where: { date: { gte: thirtyDaysAgo } },
        select: { count: true, dimension: true, event: true, path: true }
      })
    ]);

  const dailyViews = buildDailyViewSeries(thirtyDaysAgo, today, lastThirtyDaysByDay);
  const lastThirtyDaysTotal = dailyViews.reduce((total, point) => total + point.views, 0);
  const thirtyDayCounts = new Map(
    lastThirtyDaysByPage.map((row) => [row.path, row._sum.views ?? 0])
  );
  const todayCounts = new Map(todayByPage.map((row) => [row.path, row.views]));
  const pageRows = allTimeByPage
    .map((row) => ({
      path: row.path,
      allTime: row._sum.views ?? 0,
      lastThirtyDays: thirtyDayCounts.get(row.path) ?? 0,
      today: todayCounts.get(row.path) ?? 0
    }))
    .sort((a, b) => b.allTime - a.allTime || a.path.localeCompare(b.path));
  const navigationStarted = sumTelemetry(telemetryRows, "navigation_started");
  const navigationCompleted = sumTelemetry(telemetryRows, "navigation_completed");
  const navigationAbandoned = sumTelemetry(telemetryRows, "navigation_abandoned");
  const clientErrors = sumTelemetry(telemetryRows, "client_error");
  const engagementRows = buildTelemetryRows(telemetryRows, new Set<string>(ENGAGEMENT_EVENT_NAMES));
  const errorRows = buildTelemetryRows(telemetryRows, new Set(["client_error"]));
  const vitalRows = buildVitalRows(telemetryRows);
  const engagementTotal = engagementRows.reduce((total, row) => total + row.count, 0);

  return (
    <div className="admin-stack">
      <div>
        <div className="eyebrow">Analytics</div>
        <h1>Anonymous analytics &amp; reliability</h1>
        <p className="lede">
          Aggregate public usage, performance, and error signals without identifying visitors.
        </p>
      </div>

      <div className="admin-stat-grid">
        <AnalyticsStat label="All-time views" value={allTime._sum.views ?? 0} />
        <AnalyticsStat label="Last 30 days" value={lastThirtyDaysTotal} />
        <AnalyticsStat label="Today (UTC)" value={todayTotal._sum.views ?? 0} />
        <AnalyticsStat label="Pages viewed" value={pageRows.length} />
      </div>

      <div className="admin-stat-grid">
        <AnalyticsStat label="Client errors (30 days)" value={clientErrors} />
        <AnalyticsStat label="Abandoned loads (30 days)" value={navigationAbandoned} />
        <AnalyticsStat label="Completed navigations" value={navigationCompleted} />
        <AnalyticsStat label="Engagement actions" value={engagementTotal} />
      </div>

      <section className="review-panel">
        <div>
          <div className="eyebrow">Privacy</div>
          <h2>Aggregate counts only</h2>
        </div>
        <p>
          Analytics stores only allowlisted event names, normalized public paths, UTC days, counts,
          coarse performance buckets, and sanitized error fingerprints. It does not store IP addresses,
          cookies, user agents, referrers, query strings, visitor IDs, session IDs, search terms, or form
          values. Repeat requests and automated traffic may be included because visitors are never identified.
        </p>
      </section>

      <AggregateViewsChart points={dailyViews} />

      <section className="review-panel" aria-labelledby="navigation-health-heading">
        <div className="admin-toolbar">
          <div>
            <div className="eyebrow">Loading health</div>
            <h2 id="navigation-health-heading">Public route transitions</h2>
            <p>Aggregate outcomes for navigations that began after the site loaded.</p>
          </div>
          <StatusBadge label={`${formatPercentage(navigationAbandoned, navigationStarted)} abandoned`} />
        </div>
        <div className="review-meta">
          <StatusBadge label={`${formatNumber(navigationStarted)} started`} />
          <StatusBadge label={`${formatNumber(navigationCompleted)} completed`} />
          <StatusBadge label={`${formatNumber(navigationAbandoned)} exited while loading`} />
        </div>
      </section>

      <section className="admin-stack" aria-labelledby="performance-heading">
        <div>
          <div className="eyebrow">Performance sample</div>
          <h2 id="performance-heading">Core experience signals</h2>
          <p>Coarse Web Vital buckets from a 10% sample plus aggregate client-navigation timings.</p>
        </div>
        {vitalRows.length > 0 ? (
          <div className="review-list">
            {vitalRows.map((row) => (
              <article className="review-row" key={row.event}>
                <div>
                  <h3>{getTelemetryEventLabel(row.event)}</h3>
                  <p>{formatNumber(row.total)} aggregate measurements in the last 30 days.</p>
                </div>
                <div className="review-meta">
                  <StatusBadge label={`${formatNumber(row.good)} good`} />
                  <StatusBadge label={`${formatNumber(row.needsImprovement)} needs improvement`} />
                  <StatusBadge label={`${formatNumber(row.poor)} poor`} />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-note">Performance buckets will appear after sampled public visits.</p>
        )}
      </section>

      <TelemetryList
        empty="Sanitized client error fingerprints will appear here when crashes occur."
        eyebrow="Reliability"
        heading="Top client errors"
        rows={errorRows.slice(0, 20)}
        showDimension
      />

      <TelemetryList
        empty="Selected public interactions will appear here after they are used."
        eyebrow="Engagement"
        heading="Most-used interactions"
        rows={engagementRows.slice(0, 30)}
      />

      <section className="admin-stack" aria-labelledby="page-view-heading">
        <div>
          <div className="eyebrow">By page</div>
          <h2 id="page-view-heading">Page view totals</h2>
          <p>Ranked by all-time views, with the most viewed page first.</p>
        </div>

        {pageRows.length > 0 ? (
          <div className="review-list">
            {pageRows.map((row, index) => (
              <article className="review-row" key={row.path}>
                <div>
                  <div className="review-meta">
                    <StatusBadge label={`#${index + 1}`} />
                    <h3>{getPageLabel(row.path)}</h3>
                  </div>
                  <Link className="admin-text-link" href={row.path as Route}>
                    {row.path}
                  </Link>
                </div>
                <div className="review-meta" aria-label={`View totals for ${row.path}`}>
                  <StatusBadge label={`${formatNumber(row.allTime)} all time`} />
                  <StatusBadge label={`${formatNumber(row.lastThirtyDays)} in 30 days`} />
                  <StatusBadge label={`${formatNumber(row.today)} today`} />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-note">Page views will appear after public pages receive requests.</p>
        )}
      </section>
    </div>
  );
}

type TelemetryRow = {
  count: number;
  dimension: string;
  event: string;
  path: string;
};

type AggregateTelemetryRow = TelemetryRow;

function TelemetryList({
  empty,
  eyebrow,
  heading,
  rows,
  showDimension = false
}: {
  empty: string;
  eyebrow: string;
  heading: string;
  rows: AggregateTelemetryRow[];
  showDimension?: boolean;
}) {
  const headingId = `${eyebrow.toLowerCase()}-telemetry-heading`;

  return (
    <section className="admin-stack" aria-labelledby={headingId}>
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h2 id={headingId}>{heading}</h2>
        <p>Combined daily counts from the last 30 days.</p>
      </div>
      {rows.length > 0 ? (
        <div className="review-list">
          {rows.map((row) => (
            <article className="review-row" key={`${row.event}:${row.dimension}:${row.path}`}>
              <div>
                <h3>{showDimension ? getErrorLabel(row.dimension) : getTelemetryEventLabel(row.event)}</h3>
                {showDimension ? <p>{getErrorSource(row.dimension)}</p> : null}
                <Link className="admin-text-link" href={row.path as Route}>{row.path}</Link>
              </div>
              <StatusBadge label={`${formatNumber(row.count)} events`} />
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-note">{empty}</p>
      )}
    </section>
  );
}

function sumTelemetry(rows: TelemetryRow[], event: string) {
  return rows.reduce((total, row) => total + (row.event === event ? row.count : 0), 0);
}

function buildTelemetryRows(rows: TelemetryRow[], includedEvents: Set<string>) {
  const totals = new Map<string, AggregateTelemetryRow>();

  rows.forEach((row) => {
    if (!includedEvents.has(row.event)) return;
    const key = `${row.event}\n${row.dimension}\n${row.path}`;
    const existing = totals.get(key);
    if (existing) existing.count += row.count;
    else totals.set(key, { ...row });
  });

  return [...totals.values()].sort((left, right) => right.count - left.count || left.path.localeCompare(right.path));
}

function buildVitalRows(rows: TelemetryRow[]) {
  return BUCKETED_PERFORMANCE_EVENT_NAMES.map((event) => {
    const eventRows = rows.filter((row) => row.event === event);
    const good = eventRows.reduce((total, row) => total + (row.dimension === "good" ? row.count : 0), 0);
    const needsImprovement = eventRows.reduce((total, row) => total + (row.dimension === "needs_improvement" ? row.count : 0), 0);
    const poor = eventRows.reduce((total, row) => total + (row.dimension === "poor" ? row.count : 0), 0);
    return { event, good, needsImprovement, poor, total: good + needsImprovement + poor };
  }).filter((row) => row.total > 0);
}

function getTelemetryEventLabel(event: string) {
  const labels: Record<string, string> = {
    web_vital_lcp: "Largest Contentful Paint (LCP)",
    web_vital_inp: "Interaction to Next Paint (INP)",
    web_vital_cls: "Cumulative Layout Shift (CLS)",
    web_vital_ttfb: "Time to First Byte (TTFB)",
    navigation_duration: "Client route navigation time",
    header_search_open: "Header search opened",
    header_search_submit: "Saint search submitted",
    saint_biography_open: "Biography opened",
    saint_instagram_open: "Saint Instagram post opened",
    saint_gallery_open: "Saint gallery image selected",
    saint_gallery_previous: "Gallery previous image",
    saint_gallery_next: "Gallery next image",
    map_place_select: "Map place selected",
    instagram_post_open: "Instagram viewer opened"
  };
  return labels[event] ?? event.replaceAll("_", " ");
}

function getErrorLabel(dimension: string) {
  return dimension.split("|", 1)[0] || "Error";
}

function getErrorSource(dimension: string) {
  const separator = dimension.indexOf("|");
  return separator >= 0 ? dimension.slice(separator + 1) : "unknown";
}

function formatPercentage(value: number, total: number) {
  if (total === 0) return "0%";
  return new Intl.NumberFormat("en", { style: "percent", maximumFractionDigits: 1 }).format(value / total);
}

type DailyViewRow = {
  date: Date;
  _sum: {
    views: number | null;
  };
};

function buildDailyViewSeries(start: Date, end: Date, rows: DailyViewRow[]): AggregateViewPoint[] {
  const viewsByDate = new Map(
    rows.map((row) => [getUtcDateKey(row.date), row._sum.views ?? 0])
  );
  const points: AggregateViewPoint[] = [];

  for (const date = new Date(start); date <= end; date.setUTCDate(date.getUTCDate() + 1)) {
    points.push({
      date: new Date(date),
      views: viewsByDate.get(getUtcDateKey(date)) ?? 0
    });
  }

  return points;
}

function AnalyticsStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="admin-stat">
      <strong>{formatNumber(value)}</strong>
      <h2>{label}</h2>
    </div>
  );
}

function getUtcDay() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function getUtcDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getPageLabel(path: string) {
  if (path === "/") return "Home";

  return path
    .split("/")
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment).replaceAll("-", " "))
    .map((segment) => segment.replace(/\b\w/g, (letter) => letter.toUpperCase()))
    .join(" · ");
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en").format(value);
}
