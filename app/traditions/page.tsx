import { TraditionCard } from "@/components/traditions/tradition-card";
import { getPublishedTraditionSummaries } from "@/lib/public-traditions";
import { getTraditionsIndexContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export default async function TraditionsIndexPage() {
  const content = getTraditionsIndexContent();
  const traditions = await getPublishedTraditionSummaries();

  return (
    <main className="page-shell section site-grid">
      <div>
        <div className="eyebrow">{content.eyebrow}</div>
        <h1 className="page-title">{content.title}</h1>
        <p className="lede">{content.description}</p>
      </div>
      {traditions.length > 0 ? (
        <div className="card-grid">
          {traditions.map((tradition) => <TraditionCard key={tradition.slug} tradition={tradition} />)}
        </div>
      ) : (
        <p className="empty-note">Published traditions will appear here after editorial review.</p>
      )}
    </main>
  );
}
