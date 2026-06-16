import { notFound } from "next/navigation";
import { Prose } from "@/components/content/prose";
import { SaintCard } from "@/components/saints/saint-card";
import { getPublishedPlaceBySlug } from "@/lib/public-places";
import { getPlaceDetailTemplateContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export default async function PlaceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const template = getPlaceDetailTemplateContent();
  const place = await getPublishedPlaceBySlug(slug);

  if (!place) notFound();

  return (
    <main className="page-shell section site-grid">
      <div>
        <div className="eyebrow">{template.eyebrow}</div>
        <h1 className="page-title">{place.name}</h1>
        <p className="lede">{place.shortDescription}</p>
      </div>
      {place.overviewMarkdown ? <Prose markdown={place.overviewMarkdown} /> : null}
      <section className="saint-detail-layout">
        <article className="saint-detail-main">
          <h2>{template.associatedSaintsTitle}</h2>
          {place.saints.length > 0 ? (
            <div className="card-grid">
              {place.saints.map((saint) => <SaintCard key={saint.slug} saint={saint} />)}
            </div>
          ) : (
            <p className="empty-note">{template.emptySaintsMessage}</p>
          )}
        </article>
        <aside className="saint-detail-aside" aria-label={`${place.name} context`}>
          <h2>{template.contextTitle}</h2>
          <ContextList label="Traditions" values={place.traditions} />
          <ContextList label="Eras" values={place.eras} />
        </aside>
      </section>
    </main>
  );
}

function ContextList({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <h3>{label}</h3>
      {values.length > 0 ? (
        <ul>
          {values.map((value) => <li key={value}>{value}</li>)}
        </ul>
      ) : (
        <p className="empty-note">Editorial context is in review.</p>
      )}
    </div>
  );
}
