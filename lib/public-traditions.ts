import { db } from "@/lib/db";
import type {
  PublicImage,
  PublicPlaceLink,
  PublicTraditionLineageSaint,
  PublicSaintSummary,
  PublicSourceSummary,
  PublicTraditionScripturalBasis,
  PublicTraditionDetail,
  PublicTraditionLink,
  PublicTraditionSummary
} from "@/lib/public-contracts";

type TraditionListRow = Awaited<ReturnType<typeof getPublishedTraditionRows>>[number];
type TraditionDetailRow = NonNullable<Awaited<ReturnType<typeof getPublishedTraditionRowBySlug>>>;
type TraditionSaintRow = TraditionListRow["saints"][number]["saint"];

const DEFAULT_DESCRIPTION = "A reviewed tradition profile from the Hindu Saints Archive.";
const DEFAULT_LOCATION = "Location in review";
const DEFAULT_TRADITION = "Tradition in review";
const DEFAULT_ERA = "Dates in review";

async function getPublishedTraditionRows() {
  return db.tradition.findMany({
    where: { status: "published" },
    orderBy: { name: "asc" },
    include: {
      saints: {
        where: { saint: { status: "published" } },
        include: {
          saint: {
            include: {
              places: {
                include: { place: true },
                orderBy: { placeType: "asc" }
              },
              primaryImage: true,
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

async function getPublishedTraditionRowBySlug(slug: string) {
  return db.tradition.findFirst({
    where: { slug, status: "published" },
    include: {
      parentTradition: true,
      childTraditions: {
        where: { status: "published" },
        orderBy: { name: "asc" }
      },
      heroImage: true,
      galleryImages: {
        include: { mediaAsset: true },
        orderBy: { sortOrder: "asc" }
      },
      originPlace: true,
      lineageSaints: {
        where: { saint: { status: "published" } },
        include: {
          saint: {
            include: {
              places: {
                include: { place: true },
                orderBy: { placeType: "asc" }
              },
              primaryImage: true,
              traditions: {
                include: { tradition: true },
                orderBy: { isPrimary: "desc" }
              }
            }
          },
          parentSaint: { select: { slug: true } }
        },
        orderBy: { sortOrder: "asc" }
      },
      relatedTraditions: {
        where: { relatedTradition: { status: "published" } },
        include: { relatedTradition: true },
        orderBy: { sortOrder: "asc" }
      },
      relatedPlaces: {
        include: { place: true },
        orderBy: { sortOrder: "asc" }
      },
      scripturalBasis: {
        include: { source: true },
        orderBy: { sortOrder: "asc" }
      },
      saints: {
        where: { saint: { status: "published" } },
        include: {
          saint: {
            include: {
              places: {
                include: { place: true },
                orderBy: { placeType: "asc" }
              },
              primaryImage: true,
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

export async function getPublishedTraditionSummaries(): Promise<PublicTraditionSummary[]> {
  const traditions = await getPublishedTraditionRows();
  const founderNames = await getFounderNames(traditions.map((tradition) => tradition.founderSaintId));

  return traditions.map((tradition) => toPublicTraditionSummary(tradition, founderNames));
}

export async function getPublishedTraditionSlugs() {
  return db.tradition.findMany({
    where: { status: "published" },
    select: { slug: true },
    orderBy: { slug: "asc" }
  });
}

export async function getPublishedTraditionBySlug(slug: string): Promise<PublicTraditionDetail | null> {
  const tradition = await getPublishedTraditionRowBySlug(slug);
  if (!tradition) return null;

  const [founderNames, sources] = await Promise.all([
    getFounderNames([tradition.founderSaintId]),
    getSourcesForTradition(tradition.id)
  ]);

  return toPublicTraditionDetail(tradition, founderNames, sources);
}

function toPublicTraditionSummary(
  tradition: TraditionListRow,
  founderNames: Map<string, string>
): PublicTraditionSummary {
  return {
    slug: tradition.slug,
    name: tradition.name,
    shortDescription: tradition.shortDescription ?? DEFAULT_DESCRIPTION,
    founder: getFounderLabel(tradition, founderNames),
    status: "published"
  };
}

function toPublicTraditionDetail(
  tradition: TraditionDetailRow,
  founderNames: Map<string, string>,
  sources: PublicSourceSummary[]
): PublicTraditionDetail {
  return {
    ...toPublicTraditionSummary(tradition, founderNames),
    alternateNames: tradition.alternateNames.length > 0 ? tradition.alternateNames : undefined,
    historyMarkdown: tradition.historyMarkdown ?? tradition.longIntroductionMarkdown ?? undefined,
    foundingAcharyaMarkdown: tradition.foundingAcharyaMarkdown ?? undefined,
    keyTeachingsMarkdown: tradition.keyTeachingsMarkdown ?? undefined,
    introductionMarkdown: tradition.historyMarkdown ?? tradition.longIntroductionMarkdown ?? undefined,
    heroImage: tradition.heroImage ? toPublicImage(tradition.heroImage, tradition.name) : undefined,
    gallery: tradition.galleryImages
      .filter((image) => image.publicVisible !== false)
      .map((image) => toPublicImage(image.mediaAsset, tradition.name)),
    overviewFacts: {
      founder: getFounderLabel(tradition, founderNames),
      origin: tradition.origin ?? undefined,
      eraLabel: tradition.eraLabel ?? undefined,
      focus: tradition.focus ?? undefined,
      originPlace: getOriginPlace(tradition)
    },
    lineageSaints: getLineageSaints(tradition),
    scripturalBasis: getScripturalBasis(tradition),
    saints: getSortedSaints(tradition).map(toPublicSaintSummary),
    relatedTraditions: getRelatedTraditions(tradition),
    relatedPlaces: getRelatedPlaces(tradition),
    sources,
    furtherReading: sources,
    seo: {
      title: tradition.seoTitle ?? tradition.name,
      description: tradition.seoDescription ?? tradition.shortDescription ?? undefined
    }
  };
}

function getRelatedTraditions(tradition: TraditionDetailRow) {
  const hierarchyLinks = [
    tradition.parentTradition && tradition.parentTradition.status === "published"
      ? toPublicTraditionLink(tradition.parentTradition)
      : null,
    ...tradition.childTraditions.map(toPublicTraditionLink)
  ].filter((relatedTradition): relatedTradition is PublicTraditionLink => Boolean(relatedTradition));
  const manualLinks = tradition.relatedTraditions.map(({ label, relatedTradition }) => ({
    ...toPublicTraditionLink(relatedTradition),
    shortDescription: label ?? relatedTradition.shortDescription ?? undefined
  }));
  const links = new Map<string, PublicTraditionLink>();

  [...hierarchyLinks, ...manualLinks].forEach((link) => {
    if (!links.has(link.slug)) links.set(link.slug, link);
  });

  return Array.from(links.values());
}

function toPublicTraditionLink(tradition: {
  slug: string;
  name: string;
  shortDescription: string | null;
}): PublicTraditionLink {
  return {
    slug: tradition.slug,
    name: tradition.name,
    shortDescription: tradition.shortDescription ?? undefined
  };
}

function toPublicSaintSummary(saint: TraditionSaintRow): PublicSaintSummary {
  return {
    slug: saint.slug,
    displayName: saint.displayName,
    canonicalName: saint.canonicalName,
    shortDescription: saint.shortDescription ?? saint.biographySummary ?? "",
    image: saint.primaryImage ? toPublicImage(saint.primaryImage, saint.displayName) : undefined,
    eraLabel: saint.eraLabel ?? DEFAULT_ERA,
    primaryLocation: getPrimaryLocation(saint.places),
    tradition: getPrimaryTradition(saint.traditions),
    featured: saint.featured,
    instagramUrls: [],
    instagramItems: [],
    status: "published"
  };
}

function toPublicImage(image: TraditionSaintRow["primaryImage"], displayName: string): PublicImage {
  return {
    url: image?.url ?? "/images/devotional-archive-placeholder.svg",
    alt: image?.altText ?? `${displayName} portrait`,
    caption: image?.caption ?? undefined,
    credit: image?.credit ?? undefined,
    sourceUrl: image?.sourceUrl ?? undefined,
    width: image?.width ?? undefined,
    height: image?.height ?? undefined
  };
}

function getSortedSaints(tradition: TraditionListRow | TraditionDetailRow) {
  return tradition.saints
    .map(({ saint }) => saint)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

function getLineageSaints(tradition: TraditionDetailRow): PublicTraditionLineageSaint[] {
  return tradition.lineageSaints.map((item) => ({
    ...toPublicSaintSummary(item.saint),
    roleLabel: item.roleLabel ?? undefined,
    parentSaintSlug: item.parentSaint?.slug ?? undefined
  }));
}

function getRelatedPlaces(tradition: TraditionDetailRow): PublicPlaceLink[] {
  return tradition.relatedPlaces.map((placeLink) => {
    const place = placeLink.place;

    return {
      slug: place.slug,
      name: placeLink.label ?? place.name,
      region: place.region ?? undefined,
      country: place.country ?? undefined,
      shortDescription: buildPlaceSummary(place)
    };
  });
}

function getScripturalBasis(tradition: TraditionDetailRow): PublicTraditionScripturalBasis[] {
  return tradition.scripturalBasis.map((item) => ({
    title: item.title,
    url: item.url ?? item.source?.url ?? undefined,
    note: item.note ?? undefined,
    source: item.source ? toPublicSourceSummary(item.source, item.note) : undefined
  }));
}

function getOriginPlace(tradition: TraditionDetailRow): PublicPlaceLink | undefined {
  if (!tradition.originPlace) return undefined;

  return {
    slug: tradition.originPlace.slug,
    name: tradition.originPlaceLabel ?? tradition.originPlace.name,
    region: tradition.originPlace.region ?? undefined,
    country: tradition.originPlace.country ?? undefined,
    shortDescription: buildPlaceSummary(tradition.originPlace)
  };
}

function getFounderLabel(
  tradition: { founderDisplayName: string | null; founderSaintId: string | null },
  founderNames: Map<string, string>
) {
  return tradition.founderDisplayName
    ?? (tradition.founderSaintId ? founderNames.get(tradition.founderSaintId) : undefined);
}

function buildPlaceSummary(place: { region: string | null; country: string | null }) {
  return [place.region, place.country].filter(Boolean).join(", ") || "Location details in review";
}

function getPrimaryLocation(places: TraditionSaintRow["places"]) {
  const primary = places.find((place) => place.placeType === "primary") ?? places[0];
  return primary?.place.name ?? DEFAULT_LOCATION;
}

function getPrimaryTradition(traditions: TraditionSaintRow["traditions"]) {
  const primary = traditions.find((tradition) => tradition.isPrimary) ?? traditions[0];
  return primary?.tradition.name ?? DEFAULT_TRADITION;
}

async function getFounderNames(founderIds: Array<string | null>) {
  const ids = Array.from(new Set(founderIds.filter((id): id is string => Boolean(id))));
  if (ids.length === 0) return new Map<string, string>();

  const saints = await db.saint.findMany({
    where: { id: { in: ids }, status: "published" },
    select: { id: true, displayName: true }
  });

  return new Map(saints.map((saint) => [saint.id, saint.displayName]));
}

async function getSourcesForTradition(traditionId: string): Promise<PublicSourceSummary[]> {
  const sourceLinks = await db.contentSource.findMany({
    where: { entityType: "Tradition", entityId: traditionId },
    orderBy: { sortOrder: "asc" },
    include: { source: true }
  });

  return sourceLinks.map(({ source }) => toPublicSourceSummary(source, source.notes));
}

function toPublicSourceSummary(
  source: {
    title: string;
    sourceType: "book" | "article" | "website" | "scripture" | "oral_tradition" | "other";
    author: string | null;
    publisher: string | null;
    publicationYear: number | null;
    url: string | null;
    notes: string | null;
  },
  note?: string | null
): PublicSourceSummary {
  return {
    title: source.title,
    sourceType: source.sourceType,
    author: source.author ?? undefined,
    publisher: source.publisher ?? undefined,
    publicationYear: source.publicationYear ? String(source.publicationYear) : undefined,
    url: source.url ?? undefined,
    note: note ?? undefined
  };
}
