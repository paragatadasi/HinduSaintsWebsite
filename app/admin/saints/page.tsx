import Link from "next/link";
import type { Route } from "next";
import { AdminQueueFilterSelect } from "@/components/admin/admin-queue-filter-select";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireSaintCatalogUser } from "@/lib/admin-access";
import {
  canManageSaintTeamVisibility,
  getAdminSaintCatalogScope,
  saintCatalogWhere,
  type SaintCatalogScope
} from "@/lib/admin-saint-access";
import { searchSaintCatalog } from "@/lib/admin-saint-search";
import { getAdminSaintsQueueUrl } from "@/lib/admin-saint-queue";
import { db } from "@/lib/db";
import type { Prisma, PublicationStatus, TeamVisibility, WorkflowStatus } from "@/lib/generated/prisma/client";
import { hasCapability } from "@/lib/permissions";
import { getPublicImageVariants } from "@/lib/responsive-images";
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
const visibilityFilters = ["all", "public", "private"] as const;
type VisibilityFilter = typeof visibilityFilters[number];

type SaintQueueFilters = {
  publication: PublicationFilter;
  workflow: WorkflowFilter;
  match: MatchFilter;
  description: DescriptionFilter;
  photo: PhotoFilter;
  visibility: VisibilityFilter;
};

type AdminSaintsPageProps = {
  searchParams: Promise<{
    description?: string;
    match?: string;
    photo?: string;
    publication?: string;
    q?: string | string[];
    scope?: string;
    visibility?: string;
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
    workflow: scope === "public" ? member(workflowFilters, params.workflow, "all") : "all",
    match: canReviewInstagram ? member(matchFilters, params.match, "all") : "all",
    description: member(descriptionFilters, params.description, "all"),
    photo: member(photoFilters, params.photo, "all"),
    visibility: scope === "full" ? member(visibilityFilters, params.visibility, "all") : "all"
  };
  const rankedIds = query
    ? (await searchSaintCatalog({ query, scope, limit: 500 })).map((saint) => saint.id)
    : undefined;
  const [workflowCounts, saints] = await Promise.all([
    scope === "public"
      ? getWorkflowCounts(scope, { ...filters, workflow: "all" }, rankedIds)
      : Promise.resolve({} as Partial<Record<WorkflowStatus, number>>),
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
    primaryImage: getSaintQueueThumbnail(saint.primaryImage),
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

        <form action="/admin/saints" aria-label="Saint queue filters" className="admin-form-grid admin-search--queue">
          <input name="scope" type="hidden" value={scope} />
          {query ? <input name="q" type="hidden" value={query} /> : null}
          {scope === "full" ? (
            <AdminQueueFilterSelect
              label="Team visibility"
              name="visibility"
              options={visibilityFilters.map((visibility) => ({ label: formatVisibilityFilterLabel(visibility), value: visibility }))}
              value={filters.visibility}
            />
          ) : null}
          <AdminQueueFilterSelect
            label="Publication"
            name="publication"
            options={publicationFilters.map((publication) => ({ label: formatLabel(publication), value: publication }))}
            value={filters.publication}
          />
          {canReviewInstagram ? (
            <AdminQueueFilterSelect
              label="Instagram match"
              name="match"
              options={matchFilters.map((match) => ({ label: formatLabel(match), value: match }))}
              value={filters.match}
            />
          ) : null}
          <AdminQueueFilterSelect
            label="Short description"
            name="description"
            options={descriptionFilters.map((description) => ({ label: formatDescriptionFilterLabel(description), value: description }))}
            value={filters.description}
          />
          <AdminQueueFilterSelect
            label="Primary photo"
            name="photo"
            options={photoFilters.map((photo) => ({ label: formatPhotoFilterLabel(photo), value: photo }))}
            value={filters.photo}
          />
        </form>

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
          showThumbnail={scope === "public"}
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
      primaryImage: {
        select: {
          focalX: true,
          focalY: true,
          height: true,
          url: true,
          variants: true,
          width: true
        }
      },
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

function getSaintQueueThumbnail(image: {
  focalX: number;
  focalY: number;
  height: number | null;
  url: string;
  variants: Prisma.JsonValue;
  width: number | null;
} | null) {
  if (!image) return null;

  const smallestVariant = getPublicImageVariants(image.variants)?.[0];
  return {
    focalX: image.focalX,
    focalY: image.focalY,
    height: smallestVariant?.height ?? image.height,
    url: smallestVariant?.url ?? image.url,
    width: smallestVariant?.width ?? image.width
  };
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
  if (scope === "full" && filters.visibility !== "all") clauses.push({ teamVisibility: filters.visibility as TeamVisibility });
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

function QueueHiddenFields({ filters, scope }: { filters: SaintQueueFilters; scope: "full" | "public" }) {
  return <>
    <input name="scope" type="hidden" value={scope} />
    {Object.entries(filters).map(([name, value]) => value === "all" ? null : <input key={name} name={name} type="hidden" value={value} />)}
  </>;
}

function getSaintsReturnTo(scope: "full" | "public", filters: SaintQueueFilters, query: string) {
  return getAdminSaintsQueueUrl(scope, filters, query);
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

function formatVisibilityFilterLabel(filter: VisibilityFilter) {
  if (filter === "all") return "Any visibility";
  if (filter === "private") return "Not public";
  return "Public";
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
