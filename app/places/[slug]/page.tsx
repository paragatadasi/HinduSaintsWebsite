import { notFound } from "next/navigation";
import { Prose } from "@/components/content/prose";
import { SaintCard } from "@/components/saints/saint-card";
import { logPageView } from "@/lib/page-views";
import { getPublishedPlaceBySlug } from "@/lib/public-places";
import { getPlaceDetailTemplateContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export default async function PlaceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const template = getPlaceDetailTemplateContent();
  const place = await getPublishedPlaceBySlug(slug);

  if (!place) notFound();
  logPageView(`/places/${slug}`);

  return (
    <main className="page-shell section site-grid">
      <div>
        <div className="eyebrow">{template.eyebrow}</div>
        <h1 className="page-title">{place.name}</h1>
        <p className="lede">{place.shortDescription}</p>
      </div>
      {place.overviewMarkdown ? <Prose markdown={place.overviewMarkdown} /> : null}
      <section className="saint-detail-main">
        <h2>{template.associatedSaintsTitle}</h2>
        {place.saints.length > 0 ? (
          <div className="card-grid">
            {place.saints.map((saint) => <SaintCard key={saint.slug} saint={saint} />)}
          </div>
        ) : (
          <p className="empty-note">{template.emptySaintsMessage}</p>
        )}
      </section>
    </main>
  );
}
