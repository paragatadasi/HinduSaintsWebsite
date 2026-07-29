import { notFound } from "next/navigation";
import { SaintCard } from "@/components/saints/saint-card";
import { TraditionPageLayouts } from "@/components/traditions/tradition-page-layouts";
import {
  getPublicBasicTraditionBySlug,
  getPublishedTraditionBySlug,
} from "@/lib/public-traditions";
import { logPageView } from "@/lib/page-views";
import { getTraditionDetailTemplateContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export default async function TraditionDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const template = getTraditionDetailTemplateContent();
  const tradition = await getPublishedTraditionBySlug(slug);

  if (tradition) {
    logPageView(`/traditions/${slug}`);
    return <TraditionPageLayouts tradition={tradition} template={template} />;
  }

  const traditionIndex = await getPublicBasicTraditionBySlug(slug);

  if (!traditionIndex) notFound();
  logPageView(`/traditions/${slug}`);

  return (
    <main className="page-shell section site-grid">
      <div>
        <div className="eyebrow">Tradition</div>
        <h1 className="page-title">{traditionIndex.name}</h1>
      </div>
      <section className="saint-detail-main">
        <h2>Associated saints</h2>
        {traditionIndex.saints.length > 0 ? (
          <div className="card-grid">
            {traditionIndex.saints.map((saint) => (
              <SaintCard key={saint.slug} saint={saint} />
            ))}
          </div>
        ) : (
          <p className="empty-note">
            Associated saints will appear here after editorial review.
          </p>
        )}
      </section>
    </main>
  );
}
