import { TraditionCard } from "@/components/traditions/tradition-card";
import { getPublishedTraditions } from "@/lib/sample-data";
import { getTraditionsIndexContent } from "@/lib/site-content";

export default function TraditionsIndexPage() {
  const content = getTraditionsIndexContent();

  return (
    <main className="page-shell section site-grid">
      <div>
        <div className="eyebrow">{content.eyebrow}</div>
        <h1 className="page-title">{content.title}</h1>
        <p className="lede">{content.description}</p>
      </div>
      <div className="card-grid">
        {getPublishedTraditions().map((tradition) => <TraditionCard key={tradition.slug} tradition={tradition} />)}
      </div>
    </main>
  );
}
