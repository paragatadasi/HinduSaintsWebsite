import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireSaintCatalogUser } from "@/lib/admin-access";
import {
  canManageSaintTeamVisibility,
  getAdminSaintCatalogScope,
  saintCatalogWhere,
  type SaintCatalogScope
} from "@/lib/admin-saint-access";
import { searchSaintCatalog } from "@/lib/admin-saint-search";
import { db } from "@/lib/db";
import type { Prisma, PublicationStatus, WorkflowStatus } from "@/lib/generated/prisma/client";
import { hasCapability } from "@/lib/permissions";
import { reviewedInstagramMatchWhere } from "@/lib/saint-match-status";
import { SaintsBulkReviewList } from "./saints-bulk-review-list";

const publicationFilters = ["all", "unpublished", "published", "archived"] as const;
type PublicationFilter = typeof publicationFilters[number];
const workflowFilters = ["all", "needs_review", "fact_checked", "populated", "polished"] as const;
type WorkflowFilter = typeof workflowFilters[number];
const matchFilters = ["all", "unmatched", "matched"] as const;
type MatchFilter = typeof matchFilters[number];
const descriptionFilters = ["all", "has_short_description", "missing_short_description"] as const;
type DescriptionFilter = typeof descriptionFilters[number];
const photoFilters = ["all", "has_photo", "missing_photo"] as const;
type PhotoFilter = typeof photoFilters[number];

type SaintQueueFilters = {
  publication: PublicationFilter;
  workflow: WorkflowFilter;
  match: MatchFilter;
  description: DescriptionFilter;
  photo: PhotoFilter;
};

type AdminSaintsPageProps = {
  searchParams: Promise<{
    description?: string;
    match?: string;
    photo?: string;
    publication?: string;
    q?: string | string[];
    scope?: string;
    workflow?: string;
  }>;
};

export default async function AdminSaintsPage({ searchParams }: AdminSaintsPageProps) {
  const user = await requireSaintCatalogUser();
  const params = await searchParams;
  const query = getSearchParam(params.q);
  const scope = getAdminSaintCatalogScope(user.roles, params.scope);
  const hasFullCatalog = hasCapability(user.roles, "view_full_saint_catalog");
  const canReviewInstagram = hasCapability(user.roles, "view_instagram_review");
  const filters: SaintQueueFilters = {
    publication: member(publicationFilters, params.publication, "all"),
    workflow: member(workflowFilters, params.workflow, "all"),
    match: canReviewInstagram ? member(matchFilters, params.match, "all") : "all",
    description: member(descriptionFilters, params.description, "all"),
    photo: member(photoFilters, params.photo, "all")
  };
  const rankedIds = query
    ? (await searchSaintCatalog({ query, scope, limit: 500 })).map((saint) => saint.id)
    : undefined;
  const [workflowCounts, saints] = await Promise.all([
    getWorkflowCounts(scope, { ...filters, workflow: "all" }, rankedIds),
    getSaints(scope, filters, rankedIds, canReviewInstagram)
  ]);
  const returnTo = getSaintsReturnTo(scope, filters, query);
  const reviewRows = saints.map((saint) => ({
    id: saint.id,
    slug: saint.slug,
    displayName: saint.displayName,
    birthDateRaw: saint.birthDateRaw,
    samadhiDateRaw: saint.samadhiDateRaw,
    teamVisibility: saint.teamVisibility,
    publicationStatus: saint.publicationStatus,
    workflowStatus: saint.workflowStatus,
    matchStatus: saint.instagramItems.length > 0 ? "matched" as const : "unmatched" as const
  }));
  const canManageVisibility = canManageSaintTeamVisibility(user.roles);

  return (
    <div className="admin-stack">
      <div className="admin-toolbar">
        <div>
          <div className="eyebrow">Saint review</div>
          <h1>Saints</h1>
          <p className="lede">Move team-visible profiles through review while keeping private catalog records inside the authorized circle.</p>
        </div>
      </div>

      {hasFullCatalog ? <CatalogTabs activeScope={scope} filters={filters} query={query} /> : null}

      <section className="review-panel review-panel--workflow admin-review-queue">
        <div className="review-workflow__header admin-review-queue__header">
          <div className="review-workflow__heading">
            <div className="review-workflow__eyebrow">{scope === "full" ? "Full catalog" : "Public team queue"}</div>
            <h2>{formatWorkflowLabel(filters.workflow)}</h2>
            <p>{formatQueueDescription(scope, query, reviewRows.length)}</p>
          </div>
        </div>

        {scope === "public" ? (
          <div aria-label="Workflow status" className="admin-stat-grid">
            {workflowFilters.slice(1).map((workflow) => (
              <WorkflowCard
                active={filters.workflow === workflow}
                count={workflowCounts[workflow as WorkflowStatus] ?? 0}
                href={getSaintsReturnTo(scope, { ...filters, workflow }, query)}
                key={workflow}
                label={formatWorkflowLabel(workflow)}
              />
            ))}
          </div>
        ) : null}

        <div className="admin-queue-filter-groups">
          {scope === "full" ? (
            <FilterGroup label="Workflow">
              {workflowFilters.map((workflow) => (
                <FilterLink
                  active={filters.workflow === workflow}
                  href={getSaintsReturnTo(scope, { ...filters, workflow }, query)}
                  key={workflow}
                  label={formatWorkflowLabel(workflow)}
                  value={workflow === "all" ? undefined : workflowCounts[workflow] ?? 0}
                />
              ))}
            </FilterGroup>
          ) : null}
          <FilterGroup label="Publication">
            {publicationFilters.map((publication) => (
              <FilterLink
                active={filters.publication === publication}
                href={getSaintsReturnTo(scope, { ...filters, publication }, query)}
                key={publication}
                label={formatLabel(publication)}
              />
            ))}
          </FilterGroup>
          {canReviewInstagram ? <FilterGroup label="Instagram match">
            {matchFilters.map((match) => (
              <FilterLink
                active={filters.match === match}
                href={getSaintsReturnTo(scope, { ...filters, match }, query)}
                key={match}
                label={formatLabel(match)}
              />
            ))}
          </FilterGroup> : null}
          <FilterGroup label="Short description">
            {descriptionFilters.map((description) => (
              <FilterLink
                active={filters.description === description}
                href={getSaintsReturnTo(scope, { ...filters, description }, query)}
                key={description}
                label={formatDescriptionFilterLabel(description)}
              />
            ))}
          </FilterGroup>
          <FilterGroup label="Primary photo">
            {photoFilters.map((photo) => (
              <FilterLink
                active={filters.photo === photo}
                href={getSaintsReturnTo(scope, { ...filters, photo }, query)}
                key={photo}
                label={formatPhotoFilterLabel(photo)}
              />
            ))}
          </FilterGroup>
        </div>

        <form action="/admin/saints" className="admin-search admin-search--queue" role="search">
          <QueueHiddenFields filters={filters} scope={scope} />
          <label className="sr-only" htmlFor="admin-saints-search">Search saints</label>
          <input
            id="admin-saints-search"
            name="q"
            placeholder="Search by name, alias, place, tradition, date, or status"
            type="search"
            defaultValue={query}
          />
          <button className="admin-form-button" type="submit">Search</button>
          {query ? <Link className="admin-form-button admin-form-button--secondary" href={getSaintsReturnTo(scope, filters, "") as Route}>Clear</Link> : null}
        </form>

        <SaintsBulkReviewList
          canDelete={hasCapability(user.roles, "manage_sensitive_actions")}
          canManagePublication={hasCapability(user.roles, "publish_content")}
          canManageVisibility={canManageVisibility}
          returnTo={returnTo}
          saints={reviewRows}
          showMatch={canReviewInstagram}
          showVisibility={scope === "full"}
        />
      </section>
    </div>
  );
}

async function getWorkflowCounts(scope: Exclude<SaintCatalogScope, "published">, filters: SaintQueueFilters, rankedIds?: string[]) {
  const grouped = await db.saint.groupBy({
    by: ["workflowStatus"],
    where: getSaintQueueWhere(scope, filters, rankedIds),
    _count: { _all: true }
  });
  return Object.fromEntries(grouped.map((row) => [row.workflowStatus, row._count._all])) as Partial<Record<WorkflowStatus, number>>;
}

async function getSaints(
  scope: Exclude<SaintCatalogScope, "published">,
  filters: SaintQueueFilters,
  rankedIds: string[] | undefined,
  canReviewInstagram: boolean
) {
  const saints = await db.saint.findMany({
    where: getSaintQueueWhere(scope, filters, rankedIds),
    orderBy: [{ workflowStatus: "asc" }, { displayName: "asc" }],
    select: {
      id: true,
      slug: true,
      displayName: true,
      birthDateRaw: true,
      samadhiDateRaw: true,
      teamVisibility: true,
      publicationStatus: true,
      workflowStatus: true,
      instagramItems: {
        where: canReviewInstagram ? reviewedInstagramMatchWhere() : { id: "__hidden__" },
        select: { id: true },
        take: 1
      }
    }
  });
  if (!rankedIds) return saints;
  const rank = new Map(rankedIds.map((id, index) => [id, index]));
  return saints.sort((left, right) => (rank.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(right.id) ?? Number.MAX_SAFE_INTEGER));
}

function getSaintQueueWhere(
  scope: Exclude<SaintCatalogScope, "published">,
  filters: SaintQueueFilters,
  rankedIds?: string[]
): Prisma.SaintWhereInput {
  const clauses: Prisma.SaintWhereInput[] = [saintCatalogWhere(scope)];
  if (rankedIds) clauses.push({ id: { in: rankedIds } });
  if (filters.publication !== "all") clauses.push({ publicationStatus: filters.publication as PublicationStatus });
  if (filters.workflow !== "all") clauses.push({ workflowStatus: filters.workflow as WorkflowStatus });
  if (filters.match === "matched") clauses.push({ instagramItems: { some: reviewedInstagramMatchWhere() } });
  if (filters.match === "unmatched") clauses.push({ instagramItems: { none: reviewedInstagramMatchWhere() } });
  if (filters.description === "has_short_description") clauses.push({ AND: [{ shortDescription: { not: null } }, { shortDescription: { not: "" } }] });
  if (filters.description === "missing_short_description") clauses.push({ OR: [{ shortDescription: null }, { shortDescription: "" }] });
  if (filters.photo === "has_photo") clauses.push({ primaryImageId: { not: null } });
  if (filters.photo === "missing_photo") clauses.push({ primaryImageId: null });
  return { AND: clauses };
}

function CatalogTabs({ activeScope, filters, query }: { activeScope: "full" | "public"; filters: SaintQueueFilters; query: string }) {
  return (
    <nav aria-label="Saint catalog views" className="admin-workspace-tabs">
      <span className="admin-workspace-tabs__label">Catalog view</span>
      <div className="admin-workspace-tabs__rail admin-tab-strip">
        {(["full", "public"] as const).map((scope) => (
          <Link
            aria-current={activeScope === scope ? "page" : undefined}
            className="admin-workspace-tab admin-tab-strip__tab"
            href={getSaintsReturnTo(scope, filters, query) as Route}
            key={scope}
          >
            {scope === "full" ? "Full Catalog" : "Public"}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function WorkflowCard({ active, count, href, label }: { active: boolean; count: number; href: string; label: string }) {
  return (
    <Link aria-current={active ? "page" : undefined} className="admin-stat admin-stat--link interactive-surface" href={href as Route}>
      <StatusBadge label={String(count)} />
      <h3>{label}</h3>
    </Link>
  );
}

function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return <div className="admin-queue-filter-group"><span>{label}</span><div className="admin-queue-filters">{children}</div></div>;
}

function FilterLink({ active, href, label, value }: { active: boolean; href: string; label: string; value?: number }) {
  return (
    <Link aria-current={active ? "page" : undefined} className="admin-queue-filter" href={href as Route}>
      <span>{label}</span>
      {typeof value === "number" ? <StatusBadge label={String(value)} /> : null}
    </Link>
  );
}

function QueueHiddenFields({ filters, scope }: { filters: SaintQueueFilters; scope: "full" | "public" }) {
  return <>
    {scope === "full" ? <input name="scope" type="hidden" value="full" /> : null}
    {Object.entries(filters).map(([name, value]) => value === "all" ? null : <input key={name} name={name} type="hidden" value={value} />)}
  </>;
}

function getSaintsReturnTo(scope: "full" | "public", filters: SaintQueueFilters, query: string) {
  const params = new URLSearchParams();
  if (scope === "full") params.set("scope", "full");
  for (const [name, value] of Object.entries(filters)) if (value !== "all") params.set(name, value);
  if (query) params.set("q", query);
  const qs = params.toString();
  return qs ? `/admin/saints?${qs}` : "/admin/saints";
}

function formatQueueDescription(scope: "full" | "public", query: string, count: number) {
  const base = `${count.toLocaleString()} ${count === 1 ? "record" : "records"} in the ${scope === "full" ? "full catalog" : "Public team queue"}.`;
  return query ? `${base} Filtered by “${query}”.` : base;
}

function formatWorkflowLabel(workflow: WorkflowFilter) {
  if (workflow === "all") return "All workflow stages";
  if (workflow === "fact_checked") return "Fact-checked";
  return formatLabel(workflow);
}

function formatDescriptionFilterLabel(filter: DescriptionFilter) {
  if (filter === "has_short_description") return "Has description";
  if (filter === "missing_short_description") return "Missing description";
  return "Any";
}

function formatPhotoFilterLabel(filter: PhotoFilter) {
  if (filter === "has_photo") return "Has photo";
  if (filter === "missing_photo") return "Missing photo";
  return "Any";
}

function formatLabel(value: string) {
  if (value === "all") return "Any";
  return value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

function getSearchParam(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function member<const Values extends readonly string[]>(values: Values, value: string | undefined, fallback: Values[number]): Values[number] {
  return values.includes(value as Values[number]) ? value as Values[number] : fallback;
}
