import { IndiaSaintsMap } from "@/components/places/india-saints-map";
import { PlaceCard } from "@/components/places/place-card";
import { getIndiaPlaceMapData, getPublishedPlaceSummaries } from "@/lib/public-places";
import { getPlacesIndexContent, getPlacesMapContent } from "@/lib/site-content";

export default async function MapIndexPage() {
  const content = getPlacesIndexContent();
  const mapContent = getPlacesMapContent();
  const [places, mapData] = await Promise.all([
    getPublishedPlaceSummaries(),
    getIndiaPlaceMapData()
  ]);

  return (
    <main className="page-shell section site-grid">
      <div>
        <div className="eyebrow">{content.eyebrow}</div>
        <h1 className="page-title">{content.title}</h1>
        <p className="lede">{content.description}</p>
      </div>
      <IndiaSaintsMap content={mapContent} mapData={mapData} />
      <div className="card-grid">
        {places.map((place) => <PlaceCard key={place.slug} place={place} />)}
      </div>
    </main>
  );
}
