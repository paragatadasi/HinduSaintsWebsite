import { notFound } from "next/navigation";
import { InstagramEmbedGrid } from "@/components/instagram/instagram-embed-grid";
import { Prose } from "@/components/content/prose";
import { getSaintBySlug, getPublishedSaints } from "@/lib/sample-data";

export function generateStaticParams() {
  return getPublishedSaints().map((saint) => ({ slug: saint.slug }));
}

export default async function SaintDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const saint = getSaintBySlug(slug);

  if (!saint) notFound();

  return (
    <main>
      <section className="page-shell hero">
        <div>
          <div className="eyebrow">{saint.sampradaya}</div>
          <h1>{saint.displayName}</h1>
          <p>{saint.shortDescription}</p>
        </div>
        <div className="hero-media" aria-label={`${saint.displayName} visual placeholder`} />
      </section>
      <section className="page-shell section">
        <div className="fact-grid">
          <div className="fact"><strong>Era</strong><p>{saint.eraLabel}</p></div>
          <div className="fact"><strong>Location</strong><p>{saint.primaryLocation}</p></div>
          <div className="fact"><strong>Tradition</strong><p>{saint.sampradaya}</p></div>
        </div>
      </section>
      <section className="page-shell section">
        <div className="eyebrow">Biography</div>
        <Prose markdown={`This launch profile is ready for a reviewed biography. The CMS will store long-form content as safe Markdown and reuse this public rendering component for previews.`} />
      </section>
      <div className="page-shell">
        <InstagramEmbedGrid urls={saint.instagramUrls} />
      </div>
    </main>
  );
}
