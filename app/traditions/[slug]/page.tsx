import { notFound } from "next/navigation";
import { SaintCard } from "@/components/saints/saint-card";
import { Prose } from "@/components/content/prose";
import { getPublishedTraditionBySlug, getPublishedTraditionSlugs } from "@/lib/public-traditions";
import { getTraditionDetailTemplateContent } from "@/lib/site-content";

export async function generateStaticParams() {
  const traditions = await getPublishedTraditionSlugs();
  return traditions.map((tradition) => ({ slug: tradition.slug }));
}

export default async function TraditionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const template = getTraditionDetailTemplateContent();
  const tradition = await getPublishedTraditionBySlug(slug);

  if (!tradition) notFound();

  return (
    <main className="page-shell section site-grid">
      <div>
        <div className="eyebrow">{template.eyebrow}</div>
        <h1 className="page-title">{tradition.name}</h1>
        <p className="lede">{tradition.shortDescription}</p>
        {tradition.alternateNames && tradition.alternateNames.length > 0 ? (
          <div className="chip-list" aria-label="Alternate names">
            {tradition.alternateNames.map((name) => <span className="chip" key={name}>{name}</span>)}
          </div>
        ) : null}
      </div>
      {tradition.founder ? (
        <div className="fact-grid">
          <div className="fact"><strong>Founder</strong><p>{tradition.founder}</p></div>
        </div>
      ) : null}
      <Prose markdown={tradition.introductionMarkdown ?? template.placeholderMarkdown} />
      <section className="site-grid">
        <div className="section-heading section-heading--text">
          <div>
            <div className="eyebrow">Saints</div>
            <h2>Associated Saints</h2>
          </div>
        </div>
        {tradition.saints.length > 0 ? (
          <div className="card-grid">
            {tradition.saints.map((saint) => <SaintCard key={saint.slug} saint={saint} />)}
          </div>
        ) : (
          <div className="empty-state">
            <h2>No published saints linked yet</h2>
            <p>Associated saints will appear here after editorial review.</p>
          </div>
        )}
      </section>
    </main>
  );
}
