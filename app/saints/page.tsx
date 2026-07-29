import Link from "next/link";
import { Search } from "lucide-react";
import { SaintCard } from "@/components/saints/saint-card";
import { Button } from "@/components/ui/button";
import { getPublishedSaintCatalog } from "@/lib/public-saints";
import { getSaintsIndexContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

type SaintsIndexPageProps = {
  searchParams?: Promise<{
    era?: string | string[];
    location?: string | string[];
    page?: string | string[];
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
  const requestedPage = getPositivePage(params?.page);
  const hasActiveFilters = Boolean(selectedTradition || selectedLocation || selectedEra);
  const hasActiveCatalogQuery = Boolean(query || hasActiveFilters);
  const catalog = await getPublishedSaintCatalog({
    era: selectedEra,
    location: selectedLocation,
    page: requestedPage,
    query,
    tradition: selectedTradition
  });
  const saints = catalog.items;
  const traditionOptions = catalog.facets.traditions;
  const locationOptions = catalog.facets.locations;
  const eraOptions = catalog.facets.eras;
  const activeFilterCount = [selectedTradition, selectedLocation, selectedEra].filter(Boolean).length;
  const resultLabel = buildResultLabel(catalog.total, query, activeFilterCount);

  return (
    <main className="page-shell section site-grid saints-index">
      <div>
        <div className="eyebrow">{content.eyebrow}</div>
        <h1 className="page-title">{content.title}</h1>
        <p className="lede">{content.description}</p>
      </div>
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
      <div className="results-summary">
        <p>{resultLabel}</p>
        {hasActiveCatalogQuery ? <Link href="/saints">Clear search and filters</Link> : null}
      </div>
      {saints.length > 0 ? (
        <>
          <div className="card-grid">
            {saints.map((saint) => <SaintCard key={saint.slug} saint={saint} />)}
          </div>
          {catalog.pageCount > 1 ? (
            <nav className="cluster" aria-label="Saint catalog pagination">
              {catalog.page > 1 ? (
                <Button
                  href={buildPageHref({
                    era: selectedEra,
                    location: selectedLocation,
                    page: catalog.page - 1,
                    query,
                    tradition: selectedTradition
                  })}
                  variant="secondary"
                >
                  Previous
                </Button>
              ) : null}
              <span aria-live="polite">
                Page {catalog.page} of {catalog.pageCount}
              </span>
              {catalog.page < catalog.pageCount ? (
                <Button
                  href={buildPageHref({
                    era: selectedEra,
                    location: selectedLocation,
                    page: catalog.page + 1,
                    query,
                    tradition: selectedTradition
                  })}
                  variant="secondary"
                >
                  Next
                </Button>
              ) : null}
            </nav>
          ) : null}
        </>
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

function getPositivePage(value: string | string[] | undefined) {
  const parsed = Number.parseInt(getSearchParam(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
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

function buildPageHref({
  era,
  location,
  page,
  query,
  tradition
}: {
  era: string;
  location: string;
  page: number;
  query: string;
  tradition: string;
}) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (tradition) params.set("tradition", tradition);
  if (location) params.set("location", location);
  if (era) params.set("era", era);
  if (page > 1) params.set("page", String(page));

  const queryString = params.toString();
  return queryString ? `/saints?${queryString}` : "/saints";
}
