import Link from "next/link";
import { Search } from "lucide-react";
import { SaintCard } from "@/components/saints/saint-card";
import { getPublishedSaintSummaries, searchPublishedSaintSummaries } from "@/lib/public-saints";
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
  const allSaints = await getPublishedSaintSummaries();
  const searchedSaints = query ? await searchPublishedSaintSummaries(query) : allSaints;
  const saints = searchedSaints.filter((saint) => (
    (!selectedTradition || saint.tradition === selectedTradition)
    && (!selectedLocation || saint.primaryLocation === selectedLocation)
    && (!selectedEra || saint.eraLabel === selectedEra)
  ));
  const traditionOptions = getUniqueOptions(allSaints.map((saint) => saint.tradition));
  const locationOptions = getUniqueOptions(allSaints.map((saint) => saint.primaryLocation));
  const eraOptions = getUniqueOptions(allSaints.map((saint) => saint.eraLabel));
  const activeFilterCount = [selectedTradition, selectedLocation, selectedEra].filter(Boolean).length;
  const resultLabel = buildResultLabel(saints.length, query, activeFilterCount);

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

function getUniqueOptions(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
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
