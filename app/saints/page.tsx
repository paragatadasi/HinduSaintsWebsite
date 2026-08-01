import Link from "next/link";
import { Search } from "lucide-react";
import { SaintCard } from "@/components/saints/saint-card";
import { IndexPageHero } from "@/components/layout/index-page-hero";
import { getPublicIndexHeroImages } from "@/lib/site-config";
import { getPublishedSaintCatalog } from "@/lib/public-saints";
import { getSaintsIndexContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

type SaintsIndexPageProps = {
  searchParams?: Promise<{
    era?: string | string[];
    location?: string | string[];
    q?: string | string[];
    tradition?: string | string[];
  }>;
};

export default async function SaintsIndexPage({ searchParams }: SaintsIndexPageProps) {
  const content = getSaintsIndexContent();
  const params = await searchParams;
  const query = getSearchParam(params?.q);
  const selectedTradition = getSearchParam(params?.tradition);
  const selectedLocation = getSearchParam(params?.location);
  const selectedEra = getSearchParam(params?.era);
  const hasActiveFilters = Boolean(selectedTradition || selectedLocation || selectedEra);
  const hasActiveCatalogQuery = Boolean(query || hasActiveFilters);
  const [catalog, heroImages] = await Promise.all([getPublishedSaintCatalog({
    era: selectedEra,
    location: selectedLocation,
    query,
    tradition: selectedTradition
  }), getPublicIndexHeroImages()]);
  const saints = catalog.items;
  const traditionOptions = catalog.facets.traditions;
  const locationOptions = catalog.facets.locations;
  const eraOptions = catalog.facets.eras;
  const activeFilterCount = [selectedTradition, selectedLocation, selectedEra].filter(Boolean).length;
  const resultLabel = buildResultLabel(catalog.total, query, activeFilterCount);

  return (
    <main className="page-shell section site-grid index-page-layout saints-index">
      <IndexPageHero {...content} image={heroImages.saints}>
        <form className="catalog-controls" action="/saints">
        <div className="index-search">
          <label className="sr-only" htmlFor="saints-search">Search saints</label>
          <input
            id="saints-search"
            name="q"
            placeholder="Search by name, era, location, or tradition"
            type="search"
            defaultValue={query}
          />
          <button type="submit" aria-label="Search saints">
            <Search size={20} />
          </button>
        </div>
        <div className="catalog-filters" aria-label="Filter saints catalog">
          <label>
            <span>Tradition</span>
            <select name="tradition" defaultValue={selectedTradition}>
              <option value="">All traditions</option>
              {traditionOptions.map((tradition) => <option key={tradition} value={tradition}>{tradition}</option>)}
            </select>
          </label>
          <label>
            <span>Location</span>
            <select name="location" defaultValue={selectedLocation}>
              <option value="">All locations</option>
              {locationOptions.map((location) => <option key={location} value={location}>{location}</option>)}
            </select>
          </label>
          <label>
            <span>Era</span>
            <select name="era" defaultValue={selectedEra}>
              <option value="">All eras</option>
              {eraOptions.map((era) => <option key={era} value={era}>{era}</option>)}
            </select>
          </label>
          <button className="filter-submit" type="submit">Apply filters</button>
        </div>
        </form>
      </IndexPageHero>
      <div className="results-summary">
        <p>{resultLabel}</p>
        {hasActiveCatalogQuery ? <Link href="/saints">Clear search and filters</Link> : null}
      </div>
      {saints.length > 0 ? (
        <div className="card-grid">
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

function buildResultLabel(count: number, query: string, activeFilterCount: number) {
  const resultText = `${count} ${count === 1 ? "result" : "results"}`;
  const filterText = activeFilterCount > 0
    ? ` with ${activeFilterCount} ${activeFilterCount === 1 ? "filter" : "filters"}`
    : "";

  if (query) return `${resultText} for "${query}"${filterText}`;
  if (activeFilterCount > 0) return `${resultText}${filterText}`;

  return `${count} published ${count === 1 ? "saint" : "saints"}`;
}
