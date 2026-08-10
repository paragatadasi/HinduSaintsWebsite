import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
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
import { getPublishedSaintSummariesByIds } from "@/lib/public-saints";
import { PUBLIC_CACHE_TAGS, PUBLIC_DATA_CACHE_SECONDS } from "@/lib/public-cache";
import { getPublicImageVariants } from "@/lib/responsive-images";
import { compareSaintDisplayNames } from "@/lib/saint-name-sort";
import {
  getPublicTraditionPresentation,
  PUBLIC_TRADITION_STATUSES
} from "@/lib/public-tradition-visibility";

type TraditionListRow = Awaited<ReturnType<typeof getTraditionRows>>[number];
type TraditionDetailRow = NonNullable<Awaited<ReturnType<typeof getPublishedTraditionRowBySlug>>>;
type TraditionSaintRow = TraditionListRow["saints"][number]["saint"];

const DEFAULT_DESCRIPTION = "A reviewed tradition profile from the Hindu Saints Archive.";
const BASIC_DESCRIPTION = "Explore saints associated with this tradition in the archive.";
const DEFAULT_LOCATION = "Location in review";
const DEFAULT_TRADITION = "Tradition in review";
const DEFAULT_ERA = "Dates in review";

async function getTraditionRows(
  statuses: readonly ("draft" | "needs_review" | "published")[],
  where: Prisma.TraditionWhereInput = {}
) {
  return db.tradition.findMany({
    where: {
      AND: [
        { status: { in: [...statuses] } },
        { saints: { some: { saint: { status: "published" } } } },
        where
      ]
    },
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

async function getTraditionDetailRow(where: Prisma.TraditionWhereInput) {
  return db.tradition.findFirst({
    where,
    include: {
      parentTradition: {
        include: {
          saints: { select: { saint: { select: { status: true } } } }
        }
      },
      childTraditions: {
        where: {
          status: "published",
          saints: { some: { saint: { status: "published" } } }
        },
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
        where: {
          relatedTradition: {
            status: "published",
            saints: { some: { saint: { status: "published" } } }
          }
        },
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

async function getPublishedTraditionRowBySlug(slug: string) {
  return getTraditionDetailRow({
    slug,
    status: "published",
    saints: { some: { saint: { status: "published" } } }
  });
}

export async function getPublishedTraditionSummaries(): Promise<PublicTraditionSummary[]> {
  return getPublishedTraditionSummariesCached();
}

const getPublishedTraditionSummariesCached = unstable_cache(async (): Promise<PublicTraditionSummary[]> => {
  const traditions = await getTraditionRows(["published"]);
  const founderNames = await getFounderNames(traditions.map((tradition) => tradition.founderSaintId));

  return traditions.map((tradition) => toPublicTraditionSummary(tradition, founderNames));
}, ["published-tradition-summaries"], {
  revalidate: PUBLIC_DATA_CACHE_SECONDS,
  tags: [PUBLIC_CACHE_TAGS.saints, PUBLIC_CACHE_TAGS.traditions]
});

export async function getPublicTraditionSummaries(): Promise<PublicTraditionSummary[]> {
  return getPublicTraditionSummariesCached();
}

const getPublicTraditionSummariesCached = unstable_cache(async (): Promise<PublicTraditionSummary[]> => {
  const traditions = await getTraditionRows(PUBLIC_TRADITION_STATUSES);
  const founderNames = await getFounderNames(
    traditions
      .filter((tradition) => tradition.status === "published")
      .map((tradition) => tradition.founderSaintId)
  );

  return traditions.map((tradition) => toPublicTraditionSummary(tradition, founderNames));
}, ["public-tradition-summaries"], {
  revalidate: PUBLIC_DATA_CACHE_SECONDS,
  tags: [PUBLIC_CACHE_TAGS.saints, PUBLIC_CACHE_TAGS.traditions]
});

export async function getPublicTraditionSummariesByIds(traditionIds: string[]): Promise<PublicTraditionSummary[]> {
  const uniqueIds = Array.from(new Set(traditionIds));
  if (uniqueIds.length === 0) return [];
  return getPublicTraditionSummariesByIdsCached(uniqueIds);
}

const getPublicTraditionSummariesByIdsCached = unstable_cache(async (
  uniqueIds: string[]
): Promise<PublicTraditionSummary[]> => {
  const traditions = await getTraditionRows(PUBLIC_TRADITION_STATUSES, { id: { in: uniqueIds } });
  const founderNames = await getFounderNames(
    traditions
      .filter((tradition) => tradition.status === "published")
      .map((tradition) => tradition.founderSaintId)
  );
  const summariesById = new Map(traditions.map((tradition) => [tradition.id, toPublicTraditionSummary(tradition, founderNames)]));

  return uniqueIds.flatMap((id) => {
    const summary = summariesById.get(id);
    return summary ? [summary] : [];
  });
}, ["public-tradition-summaries-by-ids"], {
  revalidate: PUBLIC_DATA_CACHE_SECONDS,
  tags: [PUBLIC_CACHE_TAGS.saints, PUBLIC_CACHE_TAGS.traditions]
});

export async function getPublishedTraditionSlugs() {
  return db.tradition.findMany({
    where: {
      status: "published",
      saints: { some: { saint: { status: "published" } } }
    },
    select: { slug: true },
    orderBy: { slug: "asc" }
  });
}

export async function getPublishedTraditionBySlug(
  slug: string
): Promise<PublicTraditionDetail | null> {
  return getPublishedTraditionBySlugCached(slug);
}

export async function getTraditionPreviewBaseById(id: string): Promise<PublicTraditionDetail | null> {
  const tradition = await getTraditionDetailRow({ id });
  if (!tradition) return null;

  const [founderNames, sources] = await Promise.all([
    getFounderNames([tradition.founderSaintId]),
    getSourcesForTradition(tradition.id)
  ]);
  return toPublicTraditionDetail({ ...tradition, status: "published" }, founderNames, sources);
}

const getPublishedTraditionBySlugCached = unstable_cache(async (
  slug: string
): Promise<PublicTraditionDetail | null> => {
  const tradition = await getPublishedTraditionRowBySlug(slug);
  if (!tradition) return null;

  const [founderNames, sources] = await Promise.all([
    getFounderNames([tradition.founderSaintId]),
    getSourcesForTradition(tradition.id)
  ]);

  return toPublicTraditionDetail(tradition, founderNames, sources);
}, ["published-tradition-detail"], {
  revalidate: PUBLIC_DATA_CACHE_SECONDS,
  tags: [PUBLIC_CACHE_TAGS.saints, PUBLIC_CACHE_TAGS.traditions]
});

export async function getPublicBasicTraditionBySlug(slug: string) {
  return getPublicBasicTraditionBySlugCached(slug);
}

const getPublicBasicTraditionBySlugCached = unstable_cache(async (slug: string) => {
  const tradition = await db.tradition.findFirst({
    where: {
      slug,
      status: { in: [...PUBLIC_TRADITION_STATUSES] },
      saints: { some: { saint: { status: "published" } } }
    },
    select: {
      name: true,
      slug: true,
      saints: {
        where: { saint: { status: "published" } },
        orderBy: { saint: { displayName: "asc" } },
        select: { saintId: true }
      }
    }
  });

  if (!tradition) return null;

  return {
    name: tradition.name,
    slug: tradition.slug,
    saints: await getPublishedSaintSummariesByIds(
      tradition.saints.map(({ saintId }) => saintId)
    )
  };
}, ["public-basic-tradition-detail"], {
  revalidate: PUBLIC_DATA_CACHE_SECONDS,
  tags: [PUBLIC_CACHE_TAGS.saints, PUBLIC_CACHE_TAGS.traditions]
});

function toPublicTraditionSummary(
  tradition: TraditionListRow,
  founderNames: Map<string, string>
): PublicTraditionSummary {
  const status = getPublicTraditionPresentation(tradition.status);

  if (!status) {
    throw new Error(`Cannot map non-public tradition status: ${tradition.status}`);
  }

  return {
    slug: tradition.slug,
    name: tradition.name,
    shortDescription: status === "published"
      ? tradition.shortDescription ?? DEFAULT_DESCRIPTION
      : BASIC_DESCRIPTION,
    saintCount: tradition.saints.length,
    founder: status === "published" ? getFounderLabel(tradition, founderNames) : undefined,
    status
  };
}

function toPublicTraditionDetail(
  tradition: TraditionDetailRow,
  founderNames: Map<string, string>,
  sources: PublicSourceSummary[]
): PublicTraditionDetail {
  return {
    ...toPublicTraditionSummary(tradition, founderNames),
    status: "published",
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
    tradition.parentTradition
      && tradition.parentTradition.status === "published"
      && tradition.parentTradition.saints.some(({ saint }) => saint.status === "published")
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
    variants: getPublicImageVariants(image?.variants),
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
    .sort((a, b) => compareSaintDisplayNames(a.displayName, b.displayName));
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
