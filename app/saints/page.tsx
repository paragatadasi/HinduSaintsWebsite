import Link from "next/link";
import type { Metadata } from "next";
import { SaintCard } from "@/components/saints/saint-card";
import { SaintEncounterCard } from "@/components/saints/saint-encounter-card";
import { SaintEraRange } from "@/components/saints/saint-era-range";
import { SaintCatalogSelect } from "@/components/saints/saint-catalog-select";
import { IndexPageHero } from "@/components/layout/index-page-hero";
import { PublicSearchField } from "@/components/ui/public-search-field";
import { getPublicIndexHeroImages } from "@/lib/site-config";
import { getPublishedSaintCatalog } from "@/lib/public-saints";
import { getSaintsIndexContent } from "@/lib/site-content";
import { buildPublicMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

const saintsDescription = "Explore our rich collection of saints from the Hindu tradition and beyond.";

type SaintsIndexPageProps = {
  searchParams?: Promise<{
    endYear?: string | string[];
    location?: string | string[];
    q?: string | string[];
    startYear?: string | string[];
    tradition?: string | string[];
  }>;
};

export async function generateMetadata({ searchParams }: SaintsIndexPageProps): Promise<Metadata> {
  const params = await searchParams;
  const hasFilters = Boolean(
    getSearchParam(params?.q)
    || getSearchParam(params?.tradition)
    || getSearchParam(params?.location)
    || getSearchParam(params?.startYear)
    || getSearchParam(params?.endYear)
  );

  return buildPublicMetadata({
    title: "Saints",
    description: saintsDescription,
    path: "/saints",
    noIndex: hasFilters
  });
}

export default async function SaintsIndexPage({ searchParams }: SaintsIndexPageProps) {
  const content = getSaintsIndexContent();
  const params = await searchParams;
  const query = getSearchParam(params?.q);
  const selectedTradition = getSearchParam(params?.tradition);
  const selectedLocation = getSearchParam(params?.location);
  const selectedStartYear = getYearParam(params?.startYear);
  const selectedEndYear = getYearParam(params?.endYear);
  const hasActiveFilters = Boolean(selectedTradition || selectedLocation || selectedStartYear != null || selectedEndYear != null);
  const hasActiveCatalogQuery = Boolean(query || hasActiveFilters);
  const [catalog, heroImages] = await Promise.all([getPublishedSaintCatalog({
    endYear: selectedEndYear,
    location: selectedLocation,
    query,
    startYear: selectedStartYear,
    tradition: selectedTradition
  }), getPublicIndexHeroImages()]);
  const saints = catalog.items;
  const traditionOptions = catalog.facets.traditions;
  const locationOptions = catalog.facets.locations;
  const activeFilterCount = [selectedTradition, selectedLocation, selectedStartYear != null || selectedEndYear != null].filter(Boolean).length;
  const resultLabel = buildResultLabel(catalog.total, query, activeFilterCount);
  const timelineStart = clampYear(selectedStartYear ?? catalog.facets.timeline.min, catalog.facets.timeline.min, catalog.facets.timeline.max);
  const timelineEnd = clampYear(selectedEndYear ?? catalog.facets.timeline.max, timelineStart, catalog.facets.timeline.max);

  return (
    <main className="page-shell section site-grid index-page-layout saints-index">
      <IndexPageHero {...content} image={heroImages.saints}>
        <form className="catalog-controls" action="/saints">
          <PublicSearchField
            defaultValue={query}
            id="saints-search"
            label="Search saints"
            placeholder="Search saints by name, era, location, guru…"
          />
        <div className="catalog-filters" aria-label="Filter saints catalog">
          <SaintCatalogSelect
            allLabel="All traditions"
            label="Tradition"
            name="tradition"
            options={traditionOptions}
            value={selectedTradition}
          />
          <SaintCatalogSelect
            allLabel="All locations"
            label="Location"
            name="location"
            options={locationOptions}
            value={selectedLocation}
          />
          <SaintEraRange
            end={timelineEnd}
            max={catalog.facets.timeline.max}
            min={catalog.facets.timeline.min}
            start={timelineStart}
          />
          <button className="filter-submit" type="submit">Apply filters</button>
        </div>
        </form>
      </IndexPageHero>
      {hasActiveCatalogQuery ? (
        <div className="results-summary">
          <p>{resultLabel}</p>
          <Link href="/saints">Clear search and filters</Link>
        </div>
      ) : null}
      {saints.length > 0 ? (
        <div className="card-grid">
          {!hasActiveCatalogQuery ? <SaintEncounterCard variant="catalog" /> : null}
          {saints.map((saint) => <SaintCard key={saint.slug} saint={saint} />)}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No published saints found</h2>
          <p>Try a saint name, alternate spelling, place, era, or tradition.</p>
        </div>
      )}
    </main>
  );
}

function getSearchParam(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function getYearParam(value: string | string[] | undefined) {
  const raw = getSearchParam(value);
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isInteger(parsed) ? parsed : undefined;
}

function clampYear(year: number, min: number, max: number) {
  return Math.min(Math.max(year, min), max);
}

function buildResultLabel(count: number, query: string, activeFilterCount: number) {
  const resultText = `${count} ${count === 1 ? "result" : "results"}`;
  const filterText = activeFilterCount > 0
    ? ` with ${activeFilterCount} ${activeFilterCount === 1 ? "filter" : "filters"}`
    : "";

  if (query) return `${resultText} for "${query}"${filterText}`;
  if (activeFilterCount > 0) return `${resultText}${filterText}`;

  return `${count} published ${count === 1 ? "saint" : "saints"}`;
}
