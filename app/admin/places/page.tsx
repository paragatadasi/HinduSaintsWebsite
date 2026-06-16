import Link from "next/link";
import type { Route } from "next";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { getKnownPlaceScope } from "@/lib/place-taxonomy";

const scopes = ["all", "state", "locality"] as const;
type ScopeFilter = typeof scopes[number];

type AdminPlacesPageProps = {
  searchParams: Promise<{ q?: string | string[]; scope?: string }>;
};

export default async function AdminPlacesPage({ searchParams }: AdminPlacesPageProps) {
  const { q, scope } = await searchParams;
  const query = getSearchParam(q);
  const activeScope = scopes.includes(scope as ScopeFilter) ? scope as ScopeFilter : "all";
  const [counts, places] = await Promise.all([
    getScopeCounts(),
    getPlaces(activeScope, query)
  ]);

  return (
    <div className="admin-stack">
      <div className="admin-toolbar">
        <div>
          <div className="eyebrow">Place editor</div>
          <h1>Places</h1>
          <p className="lede">Choose a place to edit naming, state relationships, overview copy, and duplicate consolidation.</p>
        </div>
      </div>

      <div className="admin-stat-grid">
        <Stat label="States" value={counts.state} />
        <Stat label="Localities" value={counts.locality} />
        <Stat label="All places" value={(counts.state ?? 0) + (counts.locality ?? 0)} />
      </div>

      <nav className="admin-tabs" aria-label="Place unit filters">
        {scopes.map((item) => (
          <Link
            aria-current={activeScope === item ? "page" : undefined}
            className="admin-tab"
            href={getPlacesReturnTo(item, query) as Route}
            key={item}
          >
            {formatStatus(item)}
          </Link>
        ))}
      </nav>

      <form action="/admin/places" className="admin-search" role="search">
        {activeScope === "all" ? null : <input name="scope" type="hidden" value={activeScope} />}
        <label className="sr-only" htmlFor="admin-places-search">Search places</label>
        <input
          id="admin-places-search"
          name="q"
          placeholder="Search by name, alias, state, country, or place unit"
          type="search"
          defaultValue={query}
        />
        <button className="admin-form-button" type="submit">Search</button>
        {query ? <Link className="admin-form-button admin-form-button--secondary" href={getPlacesReturnTo(activeScope, "") as Route}>Clear</Link> : null}
      </form>

      <section className="review-list" aria-label="Place records">
        {places.map((place) => (
          <Link className="review-row__link review-row interactive-surface" href={`/admin/places/${place.slug}` as Route} key={place.id}>
            <div>
              <div className="review-meta">
                <StatusBadge label={formatStatus(getEffectivePlaceScope(place))} />
                <StatusBadge label={`${place._count.saints} saints`} />
                {place.parentState ? <StatusBadge label={`state: ${place.parentState.name}`} /> : null}
                {place._count.localities > 0 ? <StatusBadge label={`${place._count.localities} localities`} /> : null}
              </div>
              <h2>{place.name}</h2>
              <p>{formatPlaceLocation(place) || "No location context has been set."}</p>
            </div>
            <span className="admin-text-link">Edit</span>
          </Link>
        ))}
      </section>
    </div>
  );
}

async function getScopeCounts() {
  const places = await db.place.findMany({
    select: { placeScope: true, slug: true }
  });

  return places.reduce<Record<string, number>>((counts, place) => {
    const scope = getEffectivePlaceScope(place);
    counts[scope] = (counts[scope] ?? 0) + 1;
    return counts;
  }, {});
}

async function getPlaces(scope: ScopeFilter, query: string) {
  const places = await db.place.findMany({
    orderBy: [
      { placeScope: "desc" },
      { name: "asc" }
    ],
    include: {
      parentState: { select: { name: true } },
      _count: { select: { saints: true, localities: true } }
    }
  });
  const term = query.toLowerCase();
  const scopedPlaces = scope === "all"
    ? places
    : places.filter((place) => getEffectivePlaceScope(place) === scope);

  if (!term) return scopedPlaces;

  return scopedPlaces.filter((place) => [
    place.name,
    place.country,
    getEffectivePlaceScope(place),
    place.parentState?.name,
    ...place.alternateNames
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

function formatPlaceLocation(place: { country: string | null; parentState: { name: string } | null }) {
  return [place.parentState?.name, place.country].filter(Boolean).join(", ");
}

function getEffectivePlaceScope(place: { placeScope: "locality" | "state"; slug: string }) {
  return getKnownPlaceScope(place.slug) === "state" ? "state" : place.placeScope;
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

function getSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return value?.trim() ?? "";
}

function getPlacesReturnTo(scope: ScopeFilter, query: string) {
  const params = new URLSearchParams();
  if (scope !== "all") params.set("scope", scope);
  if (query) params.set("q", query);
  const qs = params.toString();
  return qs ? `/admin/places?${qs}` : "/admin/places";
}
