import Link from "next/link";
import type { Route } from "next";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";

const statuses = ["all", "needs_review", "published", "draft", "archived"] as const;
type StatusFilter = typeof statuses[number];

type AdminTraditionsPageProps = {
  searchParams: Promise<{ q?: string | string[]; status?: string }>;
};

export default async function AdminTraditionsPage({ searchParams }: AdminTraditionsPageProps) {
  const { q, status } = await searchParams;
  const query = getSearchParam(q);
  const activeStatus = statuses.includes(status as StatusFilter) ? status as StatusFilter : "all";
  const [counts, traditions] = await Promise.all([
    getStatusCounts(),
    getTraditions(activeStatus, query)
  ]);

  return (
    <div className="admin-stack">
      <div className="admin-toolbar">
        <div>
          <div className="eyebrow">Tradition editor</div>
          <h1>Traditions</h1>
          <p className="lede">Choose a tradition to edit page copy, relationships, and duplicate consolidation.</p>
        </div>
      </div>

      <div className="admin-stat-grid">
        <Stat label="Published" value={counts.published} />
        <Stat label="Needs review" value={counts.needs_review} />
        <Stat label="Drafts" value={counts.draft} />
        <Stat label="Archived" value={counts.archived} />
      </div>

      <nav className="admin-tabs" aria-label="Tradition status filters">
        {statuses.map((item) => (
          <Link
            aria-current={activeStatus === item ? "page" : undefined}
            className="admin-tab"
            href={getTraditionsReturnTo(item, query) as Route}
            key={item}
          >
            {formatStatus(item)}
          </Link>
        ))}
      </nav>

      <form action="/admin/traditions" className="admin-search" role="search">
        {activeStatus === "all" ? null : <input name="status" type="hidden" value={activeStatus} />}
        <label className="sr-only" htmlFor="admin-traditions-search">Search traditions</label>
        <input
          id="admin-traditions-search"
          name="q"
          placeholder="Search by name, alias, status, or parent tradition"
          type="search"
          defaultValue={query}
        />
        <button className="admin-form-button" type="submit">Search</button>
        {query ? <Link className="admin-form-button admin-form-button--secondary" href={getTraditionsReturnTo(activeStatus, "") as Route}>Clear</Link> : null}
      </form>

      <section className="review-list" aria-label="Tradition records">
        {traditions.map((tradition) => (
          <Link className="review-row__link review-row interactive-surface" href={`/admin/traditions/${tradition.slug}` as Route} key={tradition.id}>
            <div>
              <div className="review-meta">
                <StatusBadge label={formatStatus(tradition.status)} />
                <StatusBadge label={`${tradition._count.saints} saints`} />
                {tradition.parentTradition ? <StatusBadge label={`parent: ${tradition.parentTradition.name}`} /> : null}
                {tradition._count.childTraditions > 0 ? <StatusBadge label={`${tradition._count.childTraditions} child traditions`} /> : null}
              </div>
              <h2>{tradition.name}</h2>
              <p>{tradition.shortDescription ?? "No short description has been set."}</p>
            </div>
            <span className="admin-text-link">Edit</span>
          </Link>
        ))}
      </section>
    </div>
  );
}

async function getStatusCounts() {
  const grouped = await db.tradition.groupBy({
    by: ["status"],
    _count: { _all: true }
  });
  return Object.fromEntries(grouped.map((row) => [row.status, row._count._all])) as Record<string, number>;
}

async function getTraditions(status: StatusFilter, query: string) {
  const traditions = await db.tradition.findMany({
    where: status === "all" ? undefined : { status },
    orderBy: [{ status: "asc" }, { name: "asc" }],
    include: {
      parentTradition: { select: { name: true } },
      _count: { select: { saints: true, childTraditions: true } }
    }
  });
  const term = query.toLowerCase();

  if (!term) return traditions;

  return traditions.filter((tradition) => [
    tradition.name,
    tradition.shortDescription,
    tradition.status,
    tradition.parentTradition?.name,
    ...tradition.alternateNames
  ].filter(Boolean).join(" ").toLowerCase().includes(term));
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="admin-stat">
      <strong>{value ?? 0}</strong>
      <span>{label}</span>
    </div>
  );
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

function getSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return value?.trim() ?? "";
}

function getTraditionsReturnTo(status: StatusFilter, query: string) {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (query) params.set("q", query);
  const qs = params.toString();
  return qs ? `/admin/traditions?${qs}` : "/admin/traditions";
}
