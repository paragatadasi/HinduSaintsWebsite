import Link from "next/link";
import type { Route } from "next";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";

export default async function AdminAnalyticsPage() {
  const today = getUtcDay();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 29);

  const [allTime, lastThirtyDays, todayTotal, allTimeByPage, lastThirtyDaysByPage, todayByPage] =
    await Promise.all([
      db.pageViewDaily.aggregate({ _sum: { views: true } }),
      db.pageViewDaily.aggregate({
        where: { date: { gte: thirtyDaysAgo } },
        _sum: { views: true }
      }),
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
      })
    ]);

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
        <AnalyticsStat label="Last 30 days" value={lastThirtyDays._sum.views ?? 0} />
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

      <section className="admin-stack" aria-labelledby="page-view-heading">
        <div>
          <div className="eyebrow">By page</div>
          <h2 id="page-view-heading">Page view totals</h2>
        </div>

        {pageRows.length > 0 ? (
          <div className="review-list">
            {pageRows.map((row) => (
              <article className="review-row" key={row.path}>
                <div>
                  <h3>{getPageLabel(row.path)}</h3>
                  <Link className="admin-text-link" href={row.path as Route}>
                    {row.path}
                  </Link>
                </div>
                <div className="review-meta" aria-label={`View totals for ${row.path}`}>
                  <StatusBadge label={`${formatNumber(row.today)} today`} />
                  <StatusBadge label={`${formatNumber(row.lastThirtyDays)} in 30 days`} />
                  <StatusBadge label={`${formatNumber(row.allTime)} all time`} />
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
