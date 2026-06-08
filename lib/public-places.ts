import { db } from "@/lib/db";
import type {
  PublicPlaceDetail,
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
