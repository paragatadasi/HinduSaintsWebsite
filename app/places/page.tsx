import { PlaceCard } from "@/components/places/place-card";
import { getPublishedPlaceSummaries } from "@/lib/public-places";
import { getPlacesIndexContent } from "@/lib/site-content";

export default async function PlacesIndexPage() {
  const content = getPlacesIndexContent();
  const places = await getPublishedPlaceSummaries();

  return (
    <main className="page-shell section site-grid">
      <div>
        <div className="eyebrow">{content.eyebrow}</div>
        <h1 className="page-title">{content.title}</h1>
        <p className="lede">{content.description}</p>
      </div>
      <div className="card-grid">
        {places.map((place) => <PlaceCard key={place.slug} place={place} />)}
      </div>
    </main>
  );
}
