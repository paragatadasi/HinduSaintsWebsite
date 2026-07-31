import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { getInstagramCarouselImageUrls } from "@/lib/instagram";
import {
  getPublicInstagramMediaAssetImages,
  getPublicInstagramMediaAssetUrls
} from "@/lib/public-instagram";
import type { Prisma } from "@/lib/generated/prisma/client";
import type {
  PublicImage,
  PublicInstagramItem,
  PublicSaintDetail,
  PublicSaintSummary,
  PublicSourceSummary
} from "@/lib/public-contracts";
import { formatSaintDate, formatSaintEraLabel } from "@/lib/public-date-format";
import { PUBLIC_CACHE_TAGS, PUBLIC_DATA_CACHE_SECONDS } from "@/lib/public-cache";
import { getPublishedSaintSearchCandidateIds } from "@/lib/postgres-saint-search";
import { getPublicImageVariants } from "@/lib/responsive-images";
import { rankSaintSearchResults } from "@/lib/saint-search";

type SaintListRow = Awaited<ReturnType<typeof getPublishedSaintRows>>[number];
type SaintDetailRow = NonNullable<Awaited<ReturnType<typeof getPublishedSaintRowBySlug>>>;

const DEFAULT_DESCRIPTION = "";
const DEFAULT_LOCATION = "Location in review";
const DEFAULT_TRADITION = "Tradition in review";
const DEFAULT_ERA = "Dates in review";

async function getPublishedSaintRows(
  where: Prisma.SaintWhereInput = {},
  pagination: { skip?: number; take?: number } = {}
) {
  return db.saint.findMany({
    where: { status: "published", ...where },
    orderBy: [{ featured: "desc" }, { displayName: "asc" }],
    ...pagination,
    include: {
      aliases: { orderBy: { createdAt: "asc" } },
      primaryImage: true,
      places: {
        include: { place: true },
        orderBy: { placeType: "asc" }
      },
      traditions: {
        include: { tradition: true },
        orderBy: { isPrimary: "desc" }
      }
    }
  });
}

async function getPublishedSaintSearchRows(where: Prisma.SaintWhereInput = {}) {
  return db.saint.findMany({
    where: { status: "published", ...where },
    select: {
      id: true,
      displayName: true,
      canonicalName: true,
      eraLabel: true,
      birthDateRaw: true,
      samadhiDateRaw: true,
      shortDescription: true,
      aliases: {
        select: { alias: true }
      },
      places: {
        select: {
          place: {
            select: {
              name: true,
              alternateNames: true,
              region: true,
              country: true
            }
          }
        }
      },
      traditions: {
        select: {
          tradition: {
            select: {
              name: true,
              alternateNames: true
            }
          }
        }
      }
    }
  });
}

async function getPublishedSaintRowBySlug(slug: string) {
  return db.saint.findFirst({
    where: { slug, status: "published" },
    include: {
      aliases: { orderBy: { createdAt: "asc" } },
      biographies: {
        where: { status: "published" },
        orderBy: { updatedAt: "desc" },
        take: 1
      },
      galleryImages: {
        include: { mediaAsset: true },
        orderBy: { sortOrder: "asc" }
      },
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
  });
}

export async function getPublishedSaintSummaries() {
  return getPublishedSaintSummariesCached();
}

const getPublishedSaintSummariesCached = unstable_cache(async () => {
  const rows = await getPublishedSaintRows();
  return rows.map(toPublicSaintSummary);
}, ["published-saint-summaries"], {
  revalidate: PUBLIC_DATA_CACHE_SECONDS,
  tags: [PUBLIC_CACHE_TAGS.saints]
});

export async function getFeaturedSaintSummaries() {
  return getFeaturedSaintSummariesCached();
}

const getFeaturedSaintSummariesCached = unstable_cache(async () => {
  const featuredRows = await getPublishedSaintRows({ featured: true }, { take: 6 });
  const rows = featuredRows.length > 0
    ? featuredRows
    : await getPublishedSaintRows({}, { take: 6 });

  return rows.map(toPublicSaintSummary);
}, ["featured-saint-summaries"], {
  revalidate: PUBLIC_DATA_CACHE_SECONDS,
  tags: [PUBLIC_CACHE_TAGS.saints]
});

export async function getPublishedSaintSummariesByIds(saintIds: string[]) {
  const uniqueIds = Array.from(new Set(saintIds));
  if (uniqueIds.length === 0) return [];
  return getPublishedSaintSummariesByIdsCached(uniqueIds);
}

const getPublishedSaintSummariesByIdsCached = unstable_cache(async (uniqueIds: string[]) => {
  const rows = await getPublishedSaintRows({ id: { in: uniqueIds } });
  const summariesById = new Map(rows.map((row) => [row.id, toPublicSaintSummary(row)]));

  return uniqueIds.flatMap((id) => {
    const summary = summariesById.get(id);
    return summary ? [summary] : [];
  });
}, ["published-saint-summaries-by-ids"], {
  revalidate: PUBLIC_DATA_CACHE_SECONDS,
  tags: [PUBLIC_CACHE_TAGS.saints]
});

export type PublicSaintCatalogQuery = {
  era?: string;
  location?: string;
  query?: string;
  tradition?: string;
};

export async function getPublishedSaintCatalog({
  era = "",
  location = "",
  query = "",
  tradition = ""
}: PublicSaintCatalogQuery) {
  const term = query.trim().slice(0, 120);
  const where = buildSaintCatalogFilterWhere({
    era: era.trim(),
    location: location.trim(),
    tradition: tradition.trim()
  });

  if (term) {
    const [candidateIds, facets] = await Promise.all([
      getPublishedSaintSearchCandidateIds(term),
      getPublishedSaintCatalogFacets()
    ]);
    const searchRows = candidateIds.length > 0
      ? await getPublishedSaintSearchRows({
          ...where,
          id: { in: candidateIds }
        })
      : [];
    const rankedRows = rankSaintSearchResults(searchRows, term);
    const itemIds = rankedRows.map(({ item }) => item.id);
    const rows = itemIds.length > 0
      ? await getPublishedSaintRows({ id: { in: itemIds } })
      : [];
    const rowsById = new Map(rows.map((row) => [row.id, row]));

    return {
      facets,
      items: itemIds.flatMap((id) => {
        const row = rowsById.get(id);
        return row ? [toPublicSaintSummary(row)] : [];
      }),
      total: rankedRows.length
    };
  }

  const [total, facets] = await Promise.all([
    db.saint.count({ where: { status: "published", ...where } }),
    getPublishedSaintCatalogFacets()
  ]);
  const rows = await getPublishedSaintRows(where);

  return {
    facets,
    items: rows.map(toPublicSaintSummary),
    total
  };
}

const getPublishedSaintCatalogFacets = unstable_cache(async () => {
  const saints = await db.saint.findMany({
    where: { status: "published" },
    select: {
      eraLabel: true,
      places: {
        select: { place: { select: { name: true } } }
      },
      traditions: {
        select: { tradition: { select: { name: true } } }
      }
    }
  });

  return {
    eras: getUniqueSorted(saints.map((saint) => saint.eraLabel
      ? formatSaintEraLabel(saint.eraLabel)
      : DEFAULT_ERA)),
    locations: getUniqueSorted(
      saints.flatMap((saint) => saint.places.length > 0
        ? saint.places.map(({ place }) => place.name)
        : [DEFAULT_LOCATION])
    ),
    traditions: getUniqueSorted(
      saints.flatMap((saint) => saint.traditions.length > 0
        ? saint.traditions.map(({ tradition }) => tradition.name)
        : [DEFAULT_TRADITION])
    )
  };
}, ["published-saint-catalog-facets"], {
  revalidate: PUBLIC_DATA_CACHE_SECONDS,
  tags: [PUBLIC_CACHE_TAGS.saints]
});

export async function getPublishedSaintSlugs() {
  return db.saint.findMany({
    where: { status: "published" },
    select: { slug: true },
    orderBy: { slug: "asc" }
  });
}

export async function getPublishedSaintBySlug(slug: string): Promise<PublicSaintDetail | null> {
  return getPublishedSaintBySlugCached(slug);
}

const getPublishedSaintBySlugCached = unstable_cache(async (
  slug: string
): Promise<PublicSaintDetail | null> => {
  const saint = await getPublishedSaintRowBySlug(slug);
  if (!saint) return null;

  const [instagramItems, sources] = await Promise.all([
    getInstagramItemsForSaint(saint.id),
    getSourcesForSaint(saint.id)
  ]);
  const instagramUrls = instagramItems.map((item) => item.url);
  return toPublicSaintDetail(saint, instagramUrls, instagramItems, sources);
}, ["published-saint-detail"], {
  revalidate: PUBLIC_DATA_CACHE_SECONDS,
  tags: [PUBLIC_CACHE_TAGS.instagram, PUBLIC_CACHE_TAGS.saints]
});

function toPublicSaintSummary(saint: SaintListRow): PublicSaintSummary {
  return {
    slug: saint.slug,
    displayName: saint.displayName,
    canonicalName: saint.canonicalName,
    shortDescription: saint.shortDescription ?? saint.biographySummary ?? DEFAULT_DESCRIPTION,
    image: saint.primaryImage ? toPublicImage(saint.primaryImage, saint.displayName) : undefined,
    eraLabel: saint.eraLabel ? formatSaintEraLabel(saint.eraLabel) : DEFAULT_ERA,
    primaryLocation: getPrimaryLocation(saint.places),
    tradition: getPrimaryTradition(saint.traditions),
    featured: saint.featured,
    instagramUrls: [],
    instagramItems: [],
    status: "published"
  };
}

function toPublicSaintDetail(
  saint: SaintDetailRow,
  instagramUrls: string[],
  instagramItems: PublicInstagramItem[],
  sources: PublicSourceSummary[]
): PublicSaintDetail {
  const summary = toPublicSaintSummary(saint);
  const biography = saint.biographies[0];
  const gallery = saint.galleryImages
    .filter((image) => image.publicVisible !== false)
    .map((image) => toPublicImage(image.mediaAsset, saint.displayName));
  const heroImage = saint.primaryImage ? toPublicImage(saint.primaryImage, saint.displayName) : gallery[0];

  return {
    ...summary,
    instagramUrls,
    instagramItems,
    heroImage,
    gallery,
    aliases: saint.aliases.map((alias) => alias.alias),
    traditions: saint.traditions.map(({ tradition }) => ({
      slug: tradition.slug,
      name: tradition.name,
      shortDescription: tradition.shortDescription ?? undefined
    })),
    facts: buildFacts(saint, summary),
    places: getUniquePlaceNames(saint.places),
    placeLinks: getUniquePlaceLinks(saint.places),
    biography: biography
      ? {
          title: biography.title,
          bodyMarkdown: biography.bodyMarkdown,
          sources
        }
      : undefined,
    sources,
    furtherReading: sources,
    seo: {
      title: saint.seoTitle ?? saint.displayName,
      description: saint.seoDescription ?? saint.shortDescription ?? undefined
    }
  };
}

function getPrimaryLocation(places: SaintListRow["places"]) {
  const primary = places.find((place) => place.placeType === "primary") ?? places[0];
  return primary?.place.name ?? DEFAULT_LOCATION;
}

function getUniquePlaceNames(places: SaintDetailRow["places"]) {
  const placeNames: string[] = [];
  const seenPlaceIds = new Set<string>();

  for (const { place } of places) {
    if (seenPlaceIds.has(place.id)) continue;

    seenPlaceIds.add(place.id);
    placeNames.push(place.name);
  }

  return placeNames;
}

function getUniquePlaceLinks(places: SaintDetailRow["places"]) {
  const placeLinks: PublicSaintDetail["placeLinks"] = [];
  const seenPlaceIds = new Set<string>();

  for (const { place } of places) {
    if (seenPlaceIds.has(place.id)) continue;

    seenPlaceIds.add(place.id);
    placeLinks.push({
      slug: place.slug,
      name: place.name,
      region: place.region ?? undefined,
      country: place.country ?? undefined
    });
  }

  return placeLinks;
}

function getPrimaryTradition(traditions: SaintListRow["traditions"]) {
  const primary = traditions.find((tradition) => tradition.isPrimary) ?? traditions[0];
  return primary?.tradition.name ?? DEFAULT_TRADITION;
}

function toPublicImage(image: SaintDetailRow["primaryImage"], displayName: string): PublicImage {
  return {
    url: image?.url ?? "/images/devotional-archive-placeholder.svg",
    variants: getPublicImageVariants(image?.variants),
    alt: image?.altText ?? `${displayName} portrait`,
    caption: image?.caption ?? undefined,
    credit: image?.credit ?? undefined,
    sourceUrl: image?.sourceUrl ?? undefined,
    width: image?.width ?? undefined,
    height: image?.height ?? undefined,
    focalPoint: image ? {
      x: image.focalX,
      y: image.focalY
    } : undefined
  };
}

function buildFacts(saint: SaintDetailRow, summary: PublicSaintSummary) {
  const birthDate = formatSaintDate({
    raw: saint.birthDateRaw,
    year: saint.birthYear,
    month: saint.birthMonth,
    day: saint.birthDay,
    precision: saint.birthDatePrecision
  });
  const samadhiDate = formatSaintDate({
    raw: saint.samadhiDateRaw,
    year: saint.samadhiYear,
    month: saint.samadhiMonth,
    day: saint.samadhiDay,
    precision: saint.samadhiDatePrecision
  });

  return [
    { label: "Era", value: summary.eraLabel },
    birthDate ? { label: "Birth date", value: birthDate } : undefined,
    samadhiDate ? { label: "Samadhi date", value: samadhiDate } : undefined
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact));
}

async function getSourcesForSaint(saintId: string): Promise<PublicSourceSummary[]> {
  const sourceLinks = await db.contentSource.findMany({
    where: { entityType: "Saint", entityId: saintId },
    orderBy: { sortOrder: "asc" },
    include: { source: true }
  });

  return sourceLinks.map(({ source }) => ({
    title: source.title,
    sourceType: source.sourceType,
    author: source.author ?? undefined,
    publisher: source.publisher ?? undefined,
    publicationYear: source.publicationYear ? String(source.publicationYear) : undefined,
    url: source.url ?? undefined,
    note: source.notes ?? undefined
  }));
}

async function getInstagramItemsForSaint(saintId: string): Promise<PublicInstagramItem[]> {
  const links = await db.instagramItemSaint.findMany({
    where: {
      saintId,
      matchStatus: { in: ["matched", "published"] },
      instagramItem: { status: { in: ["matched", "published"] } }
    },
    orderBy: [
      { isPrimary: "desc" },
      { instagramItem: { postedAt: "desc" } }
    ],
    select: {
      instagramItem: {
        select: {
          id: true,
          instagramUrl: true,
          instagramShortcode: true,
          type: true,
          captionText: true,
          thumbnailUrl: true,
          mediaAssets: {
            orderBy: { sortOrder: "asc" },
            select: { cachedUrl: true, sourceUrl: true, variants: true }
          },
          postedAt: true
        }
      }
    }
  });

  const externalRecords = await db.externalRecord.findMany({
    where: {
      sourceType: "instagram",
      entityType: "InstagramItem",
      entityId: { in: links.map(({ instagramItem }) => instagramItem.id) }
    },
    orderBy: { lastSeenAt: "desc" },
    select: {
      entityId: true,
      rawPayloadJson: true
    }
  });
  const rawPayloadByItemId = new Map<string, unknown>();
  for (const record of externalRecords) {
    if (record.entityId && !rawPayloadByItemId.has(record.entityId)) {
      rawPayloadByItemId.set(record.entityId, record.rawPayloadJson);
    }
  }

  return links.map(({ instagramItem }) => {
    const mediaImages = getPublicInstagramMediaAssetImages(instagramItem.mediaAssets);

    return {
    url: instagramItem.instagramUrl,
    shortcode: instagramItem.instagramShortcode ?? undefined,
    type: instagramItem.type,
    caption: instagramItem.captionText ?? undefined,
    thumbnailUrl: mediaImages[0]?.url ?? instagramItem.thumbnailUrl ?? undefined,
    thumbnailVariants: mediaImages[0]?.variants,
    carouselImageUrls: instagramItem.mediaAssets.length > 0
      ? getPublicInstagramMediaAssetUrls(instagramItem.mediaAssets)
      : getInstagramCarouselImageUrls(rawPayloadByItemId.get(instagramItem.id)),
    postedAt: instagramItem.postedAt?.toISOString()
    };
  });
}

function buildSaintCatalogFilterWhere({
  era,
  location,
  tradition
}: {
  era: string;
  location: string;
  tradition: string;
}): Prisma.SaintWhereInput {
  const and: Prisma.SaintWhereInput[] = [];

  if (tradition) {
    and.push(tradition === DEFAULT_TRADITION
      ? { traditions: { none: {} } }
      : { traditions: { some: { tradition: { name: tradition } } } });
  }

  if (location) {
    and.push(location === DEFAULT_LOCATION
      ? { places: { none: {} } }
      : { places: { some: { place: { name: location } } } });
  }

  if (era) {
    and.push(era === DEFAULT_ERA ? { eraLabel: null } : { eraLabel: era });
  }

  return and.length > 0 ? { AND: and } : {};
}

function getUniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
    .sort((left, right) => left.localeCompare(right));
}
