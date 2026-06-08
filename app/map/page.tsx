import { IndiaSaintsMap } from "@/components/places/india-saints-map";
import { PlaceCard } from "@/components/places/place-card";
import { INDIA_STATE_MAP_SHAPES, type IndiaStateMapShape } from "@/lib/india-state-map-shapes";
import { getIndiaPlaceMapData, getPublishedPlaceSummaries } from "@/lib/public-places";
import type { PublicPlaceMapData } from "@/lib/public-contracts";
import { getPlacesIndexContent, getPlacesMapContent } from "@/lib/site-content";

export default async function MapIndexPage() {
  const content = getPlacesIndexContent();
  const mapContent = getPlacesMapContent();
  const [places, mapData] = await Promise.all([
    getPublishedPlaceSummaries(),
    getIndiaPlaceMapData()
  ]);
  const stateSaintCountsBySlug = getStateSaintCountsBySlug(mapData);
  const stateNamesBySlug = getStateNamesBySlug();

  return (
    <main className="page-shell section site-grid">
      <div>
        <div className="eyebrow">{content.eyebrow}</div>
        <h1 className="page-title">{content.title}</h1>
        <p className="lede">{content.description}</p>
      </div>
      <IndiaSaintsMap
        content={mapContent}
        mapData={mapData}
        stateLayerMarkup={getIndiaStateLayerMarkup(stateSaintCountsBySlug)}
        stateNamesBySlug={stateNamesBySlug}
      />
      <div className="card-grid">
        {places.map((place) => <PlaceCard key={place.slug} place={place} />)}
      </div>
    </main>
  );
}

function getIndiaStateLayerMarkup(stateSaintCountsBySlug: Map<string, number>) {
  return INDIA_STATE_MAP_SHAPES.map((state) => {
    const activeSlug = getActiveStateSlug(state, stateSaintCountsBySlug);
    const saintCount = activeSlug ? stateSaintCountsBySlug.get(activeSlug) ?? 0 : 0;
    const isActive = saintCount > 0;
    const label = isActive ? `${state.name}, ${saintCount} ${saintCount === 1 ? "saint" : "saints"}` : state.name;
    const attributes = [
      `aria-label="${escapeSvgAttribute(label)}"`,
      `class="${isActive ? "places-map__state places-map__state--active" : "places-map__state"}"`,
      `d="${escapeSvgAttribute(state.path)}"`,
      activeSlug ? `data-state-slug="${escapeSvgAttribute(activeSlug)}"` : "",
      isActive ? `role="button"` : "",
      isActive ? `tabindex="0"` : ""
    ].filter(Boolean).join(" ");

    return `<path ${attributes}></path>`;
  }).join("");
}

function escapeSvgAttribute(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("\"", "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function getStateSaintCountsBySlug(mapData: PublicPlaceMapData) {
  const saintSlugsByStateSlug = new Map<string, Set<string>>();

  for (const point of mapData.points) {
    const stateSlug = point.stateSlug ?? (point.placeScope === "state" ? point.slug : undefined);
    if (!stateSlug) continue;

    const saintSlugs = saintSlugsByStateSlug.get(stateSlug) ?? new Set<string>();
    for (const saint of point.saints) {
      saintSlugs.add(saint.slug);
    }
    saintSlugsByStateSlug.set(stateSlug, saintSlugs);
  }

  return new Map(Array.from(saintSlugsByStateSlug.entries()).map(([slug, saintSlugs]) => [slug, saintSlugs.size]));
}

function getStateNamesBySlug() {
  return Object.fromEntries(
    INDIA_STATE_MAP_SHAPES.flatMap((state) => [
      [state.slug, state.name],
      ...(state.aliases ?? []).map((alias) => [alias, state.name])
    ])
  );
}

function getActiveStateSlug(state: IndiaStateMapShape, stateSaintCountsBySlug: Map<string, number>) {
  if (stateSaintCountsBySlug.has(state.slug)) return state.slug;
  return state.aliases?.find((alias) => stateSaintCountsBySlug.has(alias));
}
