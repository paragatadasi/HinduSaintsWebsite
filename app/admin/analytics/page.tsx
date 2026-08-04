import Link from "next/link";
import type { Route } from "next";
import { AggregateViewsChart, type AggregateViewPoint } from "@/components/admin/aggregate-views-chart";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/admin-access";

export default async function AdminAnalyticsPage() {
  await requireCapability("view_analytics");
  const today = getUtcDay();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 29);

  const [allTime, todayTotal, allTimeByPage, lastThirtyDaysByPage, todayByPage, lastThirtyDaysByDay] =
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

  return (
    <div className="admin-stack">
      <div>
        <div className="eyebrow">Analytics</div>
        <h1>Anonymous page views</h1>
        <p className="lede">
          Server-recorded public page requests since analytics was enabled.
        </p>
      </div>

      <div className="admin-stat-grid">
        <AnalyticsStat label="All-time views" value={allTime._sum.views ?? 0} />
        <AnalyticsStat label="Last 30 days" value={lastThirtyDaysTotal} />
        <AnalyticsStat label="Today (UTC)" value={todayTotal._sum.views ?? 0} />
        <AnalyticsStat label="Pages viewed" value={pageRows.length} />
      </div>

      <section className="review-panel">
        <div>
          <div className="eyebrow">Privacy</div>
          <h2>Aggregate counts only</h2>
        </div>
        <p>
          Analytics stores only the public page path, UTC day, and view count. It does not store
          IP addresses, cookies, user agents, referrers, query strings, visitor IDs, or session IDs.
          Repeat requests and automated traffic are included because visitors are never identified.
        </p>
      </section>

      <AggregateViewsChart points={dailyViews} />

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
