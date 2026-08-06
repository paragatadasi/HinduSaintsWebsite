import Link from "next/link";
import type { Metadata } from "next";
import { TraditionCard } from "@/components/traditions/tradition-card";
import { IndexPageHero } from "@/components/layout/index-page-hero";
import { PublicSearchField } from "@/components/ui/public-search-field";
import { getPublicIndexHeroImages } from "@/lib/site-config";
import { getPublicTraditionSummaries } from "@/lib/public-traditions";
import { getTraditionsIndexContent } from "@/lib/site-content";
import { buildPublicMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

const traditionsDescription = "Explore Hindu traditions, lineages, teachings, founders, and their associated saints.";

type TraditionsIndexPageProps = {
  searchParams?: Promise<{ q?: string | string[] }>;
};

export async function generateMetadata({ searchParams }: TraditionsIndexPageProps): Promise<Metadata> {
  const params = await searchParams;
  const hasQuery = Boolean((Array.isArray(params?.q) ? params.q[0] : params?.q)?.trim());
  return buildPublicMetadata({
    title: "Traditions",
    description: traditionsDescription,
    path: "/traditions",
    noIndex: hasQuery
  });
}

export default async function TraditionsIndexPage({ searchParams }: TraditionsIndexPageProps) {
  const content = getTraditionsIndexContent();
  const params = await searchParams;
  const query = (Array.isArray(params?.q) ? params.q[0] : params?.q)?.trim() ?? "";
  const [allTraditions, heroImages] = await Promise.all([getPublicTraditionSummaries(), getPublicIndexHeroImages()]);
  const normalizedQuery = query.toLocaleLowerCase();
  const traditions = normalizedQuery
    ? allTraditions.filter((tradition) => [
        tradition.name,
        tradition.shortDescription,
        tradition.founder
      ].some((value) => value?.toLocaleLowerCase().includes(normalizedQuery)))
    : allTraditions;

  return (
    <main className="page-shell section site-grid index-page-layout traditions-index">
      <IndexPageHero {...content} image={heroImages.traditions}>
        <form className="catalog-controls" action="/traditions">
          <PublicSearchField
            defaultValue={query}
            id="traditions-search"
            label="Search traditions"
            placeholder="Search traditions by name, founder, or teaching…"
          />
        </form>
      </IndexPageHero>
      {query ? (
        <div className="results-summary">
          <p>{`${traditions.length} ${traditions.length === 1 ? "result" : "results"} for \"${query}\"`}</p>
          <Link href="/traditions">Clear search</Link>
        </div>
      ) : null}
      {traditions.length > 0 ? (
        <div className="card-grid">
          {traditions.map((tradition) => (
            <TraditionCard key={tradition.slug} tradition={tradition} showSaintCount />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>{query ? "No traditions found" : "No traditions available"}</h2>
          <p>{query
            ? "Try a tradition name, founder, or teaching."
            : "Traditions will appear here after they are added to the archive."}</p>
        </div>
      )}
    </main>
  );
}
