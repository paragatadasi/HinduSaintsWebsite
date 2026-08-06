import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SaintCard } from "@/components/saints/saint-card";
import { TraditionPageLayouts } from "@/components/traditions/tradition-page-layouts";
import {
  getPublicBasicTraditionBySlug,
  getPublishedTraditionBySlug,
} from "@/lib/public-traditions";
import { getTraditionDetailTemplateContent } from "@/lib/site-content";
import { buildPublicMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const published = await getPublishedTraditionBySlug(slug);
  if (published) {
    return buildPublicMetadata({
      title: published.seo?.title ?? published.name,
      description: published.seo?.description ?? published.shortDescription,
      path: `/traditions/${slug}`,
      image: published.heroImage?.url,
      imageAlt: published.heroImage?.alt
    });
  }

  const basic = await getPublicBasicTraditionBySlug(slug);
  if (!basic) return { robots: { index: false, follow: false } };
  return buildPublicMetadata({
    title: basic.name,
    description: `Explore published saints associated with ${basic.name}. Additional tradition details are awaiting editorial review.`,
    path: `/traditions/${slug}`
  });
}

export default async function TraditionDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const template = getTraditionDetailTemplateContent();
  const tradition = await getPublishedTraditionBySlug(slug);

  if (tradition) {
    return <TraditionPageLayouts tradition={tradition} template={template} />;
  }

  const traditionIndex = await getPublicBasicTraditionBySlug(slug);

  if (!traditionIndex) notFound();

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
