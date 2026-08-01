import { TraditionCard } from "@/components/traditions/tradition-card";
import { IndexPageHero } from "@/components/layout/index-page-hero";
import { getPublicIndexHeroImages } from "@/lib/site-config";
import { getPublicTraditionSummaries } from "@/lib/public-traditions";
import { getTraditionsIndexContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export default async function TraditionsIndexPage() {
  const content = getTraditionsIndexContent();
  const [traditions, heroImages] = await Promise.all([getPublicTraditionSummaries(), getPublicIndexHeroImages()]);

  return (
    <main className="page-shell section site-grid index-page-layout">
      <IndexPageHero {...content} image={heroImages.traditions} />
      {traditions.length > 0 ? (
        <div className="card-grid">
          {traditions.map((tradition) => <TraditionCard key={tradition.slug} tradition={tradition} />)}
        </div>
      ) : (
        <p className="empty-note">Traditions will appear here after they are added to the archive.</p>
      )}
    </main>
  );
}
