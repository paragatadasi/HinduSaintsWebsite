import { db } from "@/lib/db";
import { getPlaceCoordinate } from "@/lib/place-geocoding";
import type {
  PublicPlaceDetail,
  PublicPlaceMapData,
  PublicPlaceMapPoint,
  PublicPlaceMapSaint,
  PublicPlaceSummary,
  PublicSaintSummary
} from "@/lib/public-contracts";

type PublishedPlaceRow = Awaited<ReturnType<typeof getPublishedPlaceRows>>[number];
type PublishedPlaceDetailRow = NonNullable<Awaited<ReturnType<typeof getPublishedPlaceRowBySlug>>>;
type PublishedPlaceSaint = PublishedPlaceRow["saints"][number]["saint"];

const DEFAULT_DESCRIPTION = "A reviewed place associated with published saint profiles.";
const DEFAULT_LOCATION = "Location in review";
const DEFAULT_TRADITION = "Tradition in review";
const DEFAULT_ERA = "Dates in review";
const MIN_PUBLIC_PLACE_SAINTS = 3;

async function getPublishedPlaceRows() {
  return db.place.findMany({
    where: {
      saints: {
        some: {
          saint: { status: "published" }
        }
      }
    },
    orderBy: { name: "asc" },
    include: {
      saints: {
        where: {
          saint: { status: "published" }
        },
        include: {
          saint: {
            include: {
              places: {
                include: { place: true },
                orderBy: { placeType: "asc" }
              },
              traditions: {
                include: { tradition: true },
                orderBy: { isPrimary: "desc" }
              }
            }
          }
        }
      }
    }
  });
}

async function getPublishedPlaceRowBySlug(slug: string) {
  return db.place.findFirst({
    where: {
      slug,
      saints: {
        some: {
          saint: { status: "published" }
        }
      }
    },
    include: {
      saints: {
        where: {
          saint: { status: "published" }
        },
        include: {
          saint: {
            include: {
              places: {
                include: { place: true },
                orderBy: { placeType: "asc" }
              },
              traditions: {
                include: { tradition: true },
                orderBy: { isPrimary: "desc" }
              }
            }
          }
        }
      }
    }
  });
}

export async function getPublishedPlaceSummaries(): Promise<PublicPlaceSummary[]> {
  const places = await getPublishedPlaceRows();
  return places.filter(hasMinimumPublishedSaints).map(toPublicPlaceSummary);
}

export async function getPublishedPlaceSlugs() {
  const places = await getPublishedPlaceRows();

  return places
    .filter(hasMinimumPublishedSaints)
    .map((place) => ({ slug: place.slug }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

export async function getPublishedPlaceBySlug(slug: string): Promise<PublicPlaceDetail | null> {
  const place = await getPublishedPlaceRowBySlug(slug);
  if (!place) return null;
  if (!hasMinimumPublishedSaints(place)) return null;

  const saints = getSortedPublishedSaints(place).map(toPublicSaintSummary);

  return {
    ...toPublicPlaceSummary(place),
    saints,
    traditions: getUniqueSorted(saints.map((saint) => saint.tradition)),
    eras: getUniqueSorted(saints.map((saint) => saint.eraLabel))
  };
}

export async function getIndiaPlaceMapData(): Promise<PublicPlaceMapData> {
  const places = await getPublishedPlaceRows();
  const rawPoints = places
    .filter(hasMinimumPublishedSaints)
    .map(toPublicPlaceMapPoint)
    .filter((point): point is PublicPlaceMapPoint => Boolean(point))
    .sort((a, b) => b.saintCount - a.saintCount || a.name.localeCompare(b.name));
  const points = aggregateMapPoints(rawPoints);
  const years = points.flatMap((point) => point.saints.flatMap(getSaintYears));

  return {
    points,
    yearRange: years.length > 0
      ? {
          min: Math.min(...years),
          max: Math.max(...years)
        }
      : undefined
  };
}

function toPublicPlaceSummary(place: PublishedPlaceRow | PublishedPlaceDetailRow): PublicPlaceSummary {
  const saints = getSortedPublishedSaints(place);

  return {
    slug: place.slug,
    name: place.name,
    shortDescription: buildPlaceDescription(place, saints),
    saintCount: saints.length,
    status: "published"
  };
}

function toPublicPlaceMapPoint(place: PublishedPlaceRow): PublicPlaceMapPoint | null {
  const coordinate = getPlaceCoordinate(
    place.name,
    place.latitude == null ? null : Number(place.latitude),
    place.longitude == null ? null : Number(place.longitude)
  );

  if (!coordinate) return null;

  const saints = getSortedPublishedSaints(place).map(toPublicPlaceMapSaint);

  return {
    slug: place.slug,
    name: place.name,
    region: place.region ?? undefined,
    country: place.country ?? undefined,
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    saintCount: saints.length,
    saints
  };
}

function toPublicSaintSummary(saint: PublishedPlaceSaint): PublicSaintSummary {
  return {
    slug: saint.slug,
    displayName: saint.displayName,
    canonicalName: saint.canonicalName,
    shortDescription: saint.shortDescription ?? saint.biographySummary ?? DEFAULT_DESCRIPTION,
    eraLabel: saint.eraLabel ?? DEFAULT_ERA,
    primaryLocation: getPrimaryLocation(saint.places),
    tradition: getPrimaryTradition(saint.traditions),
    featured: saint.featured,
    instagramUrls: [],
    status: "published"
  };
}

function toPublicPlaceMapSaint(saint: PublishedPlaceSaint): PublicPlaceMapSaint {
  return {
    slug: saint.slug,
    displayName: saint.displayName,
    eraLabel: saint.eraLabel ?? DEFAULT_ERA,
    birthYear: saint.birthYear ?? undefined,
    samadhiYear: saint.samadhiYear ?? undefined,
    tradition: getPrimaryTradition(saint.traditions)
  };
}

function getSortedPublishedSaints(place: PublishedPlaceRow | PublishedPlaceDetailRow) {
  return place.saints
    .map(({ saint }) => saint)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

function hasMinimumPublishedSaints(place: PublishedPlaceRow | PublishedPlaceDetailRow) {
  return getSortedPublishedSaints(place).length >= MIN_PUBLIC_PLACE_SAINTS;
}

function getPrimaryLocation(places: PublishedPlaceSaint["places"]) {
  const primary = places.find((place) => place.placeType === "primary") ?? places[0];
  return primary?.place.name ?? DEFAULT_LOCATION;
}

function getPrimaryTradition(traditions: PublishedPlaceSaint["traditions"]) {
  const primary = traditions.find((tradition) => tradition.isPrimary) ?? traditions[0];
  return primary?.tradition.name ?? DEFAULT_TRADITION;
}

function getUniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function buildPlaceDescription(place: PublishedPlaceRow | PublishedPlaceDetailRow, saints: PublishedPlaceSaint[]) {
  if (place.region || place.country) {
    const location = [place.region, place.country].filter(Boolean).join(", ");
    return `${place.name} is a reviewed place in ${location} associated with ${saints.length} published ${getSaintLabel(saints.length)}.`;
  }

  return `${place.name} is associated with ${saints.length} published ${getSaintLabel(saints.length)}.`;
}

function getSaintLabel(count: number) {
  return count === 1 ? "saint" : "saints";
}

function getSaintYears(saint: PublicPlaceMapSaint) {
  return [saint.birthYear, saint.samadhiYear].filter((year): year is number => typeof year === "number");
}

function aggregateMapPoints(points: PublicPlaceMapPoint[]) {
  const pointsByName = new Map<string, PublicPlaceMapPoint>();

  for (const point of points) {
    const key = getMapPlaceKey(point.name);
    const existingPoint = pointsByName.get(key);

    if (!existingPoint) {
      pointsByName.set(key, {
        ...point,
        name: getMapPlaceName(point.name)
      });
      continue;
    }

    const saintsBySlug = new Map(existingPoint.saints.map((saint) => [saint.slug, saint]));
    for (const saint of point.saints) {
      saintsBySlug.set(saint.slug, saint);
    }

    existingPoint.saints = Array.from(saintsBySlug.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
    existingPoint.saintCount = existingPoint.saints.length;
  }

  return Array.from(pointsByName.values()).sort((a, b) => b.saintCount - a.saintCount || a.name.localeCompare(b.name));
}

function getMapPlaceKey(name: string) {
  return getMapPlaceName(name).toLowerCase();
}

function getMapPlaceName(name: string) {
  return name.replace(/,\s*(india|orissa)$/i, "").trim();
}
