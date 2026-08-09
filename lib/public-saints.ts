import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { getInstagramCarouselImageUrls } from "@/lib/instagram";
import {
  getPublicInstagramMediaAssetImages,
  getPublicInstagramMediaAssetUrls
} from "@/lib/public-instagram";
import type { Prisma, RelationshipType } from "@/lib/generated/prisma/client";
import type {
  PublicImage,
  PublicInstagramItem,
  PublicRelatedSaintSummary,
  PublicSaintDetail,
  PublicSaintSummary,
  PublicSourceSummary
} from "@/lib/public-contracts";
import { formatSaintDate, formatSaintEraLabel } from "@/lib/public-date-format";
import { PUBLIC_CACHE_TAGS, PUBLIC_DATA_CACHE_SECONDS } from "@/lib/public-cache";
import { getPublishedSaintSearchCandidateIds } from "@/lib/postgres-saint-search";
import { getPublicImageVariants } from "@/lib/responsive-images";
import { rankSaintSearchResults } from "@/lib/saint-search";
import { compareSaintDisplayNames } from "@/lib/saint-name-sort";
import { formatRelationshipType, getReciprocalRelationshipType } from "@/lib/saint-relationships";
import { PUBLIC_TRADITION_STATUSES } from "@/lib/public-tradition-visibility";

type SaintListRow = Awaited<ReturnType<typeof getPublishedSaintRows>>[number];
type SaintDetailRow = NonNullable<Awaited<ReturnType<typeof getPublishedSaintRowBySlug>>>;

const DEFAULT_DESCRIPTION = "";
const DEFAULT_LOCATION = "Location in review";
const DEFAULT_TRADITION = "Tradition in review";
const DEFAULT_ERA = "Dates in review";
const HOMEPAGE_FALLBACK_SAINT_COUNT = 12;

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

export async function getHomepageFallbackSaintSummaries() {
  return getHomepageFallbackSaintSummariesCached();
}

const getHomepageFallbackSaintSummariesCached = unstable_cache(async () => {
  const rows = shuffle(await getPublishedSaintRows())
    .slice(0, HOMEPAGE_FALLBACK_SAINT_COUNT);

  return rows.map(toPublicSaintSummary);
}, ["homepage-fallback-saint-summaries"], {
  revalidate: PUBLIC_DATA_CACHE_SECONDS,
  tags: [PUBLIC_CACHE_TAGS.saints]
});

function shuffle<T>(values: T[]) {
  const shuffled = [...values];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const targetIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[targetIndex]] = [shuffled[targetIndex], shuffled[index]];
  }

  return shuffled;
}

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
  endYear?: number;
  location?: string;
  query?: string;
  startYear?: number;
  tradition?: string;
};

export async function getPublishedSaintCatalog({
  endYear,
  location = "",
  query = "",
  startYear,
  tradition = ""
}: PublicSaintCatalogQuery) {
  const term = query.trim().slice(0, 120);
  const candidateIds = term ? await getPublishedSaintSearchCandidateIds(term) : undefined;
  const where = buildSaintCatalogFilterWhere({
    endYear,
    location: location.trim(),
    startYear,
    tradition: tradition.trim()
  });
  const searchWhere = candidateIds ? { ...where, id: { in: candidateIds } } : where;

  if (term) {
    const facets = await getPublishedSaintCatalogFacets({ candidateIds, endYear, location, startYear, tradition });
    const searchRows = candidateIds && candidateIds.length > 0
      ? await getPublishedSaintSearchRows(searchWhere)
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
    getPublishedSaintCatalogFacets({ endYear, location, startYear, tradition })
  ]);
  const rows = await getPublishedSaintRows(where);

  return {
    facets,
    items: rows
      .map(toPublicSaintSummary)
      .sort((left, right) => compareSaintDisplayNames(left.displayName, right.displayName)),
    total
  };
}

async function getPublishedSaintCatalogFacets({
  candidateIds,
  endYear,
  location = "",
  startYear,
  tradition = ""
}: {
  candidateIds?: string[];
  endYear?: number;
  location?: string;
  startYear?: number;
  tradition?: string;
}) {
  const saints = await db.saint.findMany({
    where: { status: "published", ...(candidateIds ? { id: { in: candidateIds } } : {}) },
    select: {
      birthYear: true,
      birthYearEnd: true,
      samadhiYear: true,
      samadhiYearEnd: true,
      places: {
        select: { place: { select: { name: true } } }
      },
      traditions: {
        where: { tradition: { status: { in: [...PUBLIC_TRADITION_STATUSES] } } },
        select: { tradition: { select: { name: true } } }
      }
    }
  });

  const matchesTradition = (saint: typeof saints[number]) => !tradition || (tradition === DEFAULT_TRADITION
    ? saint.traditions.length === 0
    : saint.traditions.some(({ tradition: item }) => item.name === tradition));
  const matchesLocation = (saint: typeof saints[number]) => !location || (location === DEFAULT_LOCATION
    ? saint.places.length === 0
    : saint.places.some(({ place }) => place.name === location));
  const matchesRange = (saint: typeof saints[number]) => saintOverlapsRange(saint, startYear, endYear);
  const locationSaints = saints.filter((saint) => matchesTradition(saint) && matchesRange(saint));
  const traditionSaints = saints.filter((saint) => matchesLocation(saint) && matchesRange(saint));
  const timelineSaints = saints.filter((saint) => matchesTradition(saint) && matchesLocation(saint));
  const years = timelineSaints.flatMap(getSaintKnownYears);
  const timeline = {
    min: years.length > 0 ? Math.min(...years) : 0,
    max: years.length > 0 ? Math.max(...years) : new Date().getFullYear()
  };

  return {
    locations: getUniqueSorted(
      locationSaints.flatMap((saint) => saint.places.map(({ place }) => place.name))
    ),
    timeline,
    traditions: getUniqueSorted(
      traditionSaints.flatMap((saint) => saint.traditions.map(({ tradition }) => tradition.name))
    )
  };
}

export async function getPublishedSaintSlugs() {
  return getPublishedSaintSlugsCached();
}

const getPublishedSaintSlugsCached = unstable_cache(async () => {
  return db.saint.findMany({
    where: { status: "published" },
    select: { slug: true },
    orderBy: { slug: "asc" }
  });
}, ["published-saint-slugs"], {
  revalidate: PUBLIC_DATA_CACHE_SECONDS,
  tags: [PUBLIC_CACHE_TAGS.saints]
});

export async function getPublishedSaintBySlug(slug: string): Promise<PublicSaintDetail | null> {
  return getPublishedSaintBySlugCached(slug);
}

export async function getPublishedSaintRedirectBySlug(slug: string) {
  return getPublishedSaintRedirectBySlugCached(slug);
}

const getPublishedSaintRedirectBySlugCached = unstable_cache(async (slug: string) => {
  const redirect = await db.saintSlugRedirect.findUnique({
    where: { slug },
    select: { saint: { select: { slug: true, status: true } } }
  });
  return redirect?.saint.status === "published" ? redirect.saint.slug : null;
}, ["published-saint-slug-redirect"], {
  revalidate: PUBLIC_DATA_CACHE_SECONDS,
  tags: [PUBLIC_CACHE_TAGS.saints]
});

export async function getRelatedPublishedSaints(slug: string): Promise<PublicRelatedSaintSummary[]> {
  return getRelatedPublishedSaintsCached(slug);
}

const getRelatedPublishedSaintsCached = unstable_cache(async (slug: string) => {
  const saint = await db.saint.findFirst({
    where: { slug, status: "published" },
    select: {
      id: true,
      traditions: { select: { traditionId: true } },
      relationshipsFrom: {
        where: { publicVisible: true, status: "published" },
        select: { toSaintId: true, relationshipType: true }
      },
      relationshipsTo: {
        where: { publicVisible: true, status: "published" },
        select: { fromSaintId: true, relationshipType: true }
      }
    }
  });
  if (!saint) return [];

  const directRelationshipIds = [...new Set([
    ...saint.relationshipsFrom.map(({ toSaintId }) => toSaintId),
    ...saint.relationshipsTo.map(({ fromSaintId }) => fromSaintId)
  ])];
  const directRelationshipLabels = new Map<string, string>();
  const directRelationshipPriorities = new Map<string, number>();
  saint.relationshipsFrom.forEach(({ relationshipType, toSaintId }) => {
    const priority = getDirectRelationshipPriority(relationshipType);
    if (priority < (directRelationshipPriorities.get(toSaintId) ?? Number.MAX_SAFE_INTEGER)) {
      directRelationshipLabels.set(toSaintId, formatRelationshipType(relationshipType));
      directRelationshipPriorities.set(toSaintId, priority);
    }
  });
  saint.relationshipsTo.forEach(({ fromSaintId, relationshipType }) => {
    const reciprocalType = getReciprocalRelationshipType(relationshipType);
    const priority = getDirectRelationshipPriority(reciprocalType);
    if (priority < (directRelationshipPriorities.get(fromSaintId) ?? Number.MAX_SAFE_INTEGER)) {
      directRelationshipLabels.set(
        fromSaintId,
        formatRelationshipType(reciprocalType)
      );
      directRelationshipPriorities.set(fromSaintId, priority);
    }
  });
  const relationshipDepthById = await getPublishedRelationshipTree(
    saint.id,
    directRelationshipIds,
    8
  );
  const relationshipIds = [...relationshipDepthById.keys()];
  const traditionIds = saint.traditions.map(({ traditionId }) => traditionId);
  const rows = await getPublishedSaintRows({
    id: { not: saint.id },
    OR: [
      ...(relationshipIds.length > 0 ? [{ id: { in: relationshipIds } }] : []),
      ...(relationshipIds.length < 8 && traditionIds.length > 0
        ? [{ traditions: { some: { traditionId: { in: traditionIds } } } }]
        : [])
    ]
  });

  return rows
    .sort((left, right) => (
      getRelatedSaintSortRank(left.id, directRelationshipPriorities, relationshipDepthById)
      - getRelatedSaintSortRank(right.id, directRelationshipPriorities, relationshipDepthById)
    ))
    .slice(0, 8)
    .map((row) => ({
      ...toPublicSaintSummary(row),
      relationshipLabel: directRelationshipLabels.get(row.id)
    }));
}, ["related-published-saints"], {
  revalidate: PUBLIC_DATA_CACHE_SECONDS,
  tags: [PUBLIC_CACHE_TAGS.saints]
});

const familyRelationshipTypes = new Set<RelationshipType>([
  "family", "parent", "child", "father", "mother", "son", "daughter", "husband", "wife", "partner"
]);

function getDirectRelationshipPriority(type: RelationshipType) {
  if (type === "guru") return 0;
  if (familyRelationshipTypes.has(type)) return 1;
  if (type === "disciple") return 2;
  return 3;
}

function getRelatedSaintSortRank(
  saintId: string,
  directPriorities: Map<string, number>,
  relationshipDepths: Map<string, number>
) {
  const directPriority = directPriorities.get(saintId);
  if (directPriority !== undefined) return directPriority;

  const relationshipDepth = relationshipDepths.get(saintId);
  if (relationshipDepth !== undefined) return 10 + relationshipDepth;
  return Number.MAX_SAFE_INTEGER;
}

async function getPublishedRelationshipTree(
  rootSaintId: string,
  directRelationshipIds: string[],
  targetCount: number
) {
  const depthById = new Map<string, number>();
  let frontier = await getPublishedSaintIds(directRelationshipIds);
  frontier.forEach((id) => depthById.set(id, 1));

  for (let depth = 2; depth <= 3 && frontier.length > 0 && depthById.size < targetCount; depth += 1) {
    const edges = await db.saintRelationship.findMany({
      where: {
        publicVisible: true,
        status: "published",
        OR: [
          { fromSaintId: { in: frontier } },
          { toSaintId: { in: frontier } }
        ]
      },
      select: { fromSaintId: true, toSaintId: true }
    });
    const candidateIds = [...new Set(edges.flatMap(({ fromSaintId, toSaintId }) => [fromSaintId, toSaintId]))]
      .filter((id) => id !== rootSaintId && !depthById.has(id));
    frontier = await getPublishedSaintIds(candidateIds, targetCount - depthById.size);
    frontier.forEach((id) => depthById.set(id, depth));
  }

  return depthById;
}

async function getPublishedSaintIds(ids: string[], take?: number) {
  if (ids.length === 0) return [];

  const saints = await db.saint.findMany({
    where: { id: { in: ids }, status: "published" },
    select: { id: true },
    orderBy: { displayName: "asc" },
    ...(take === undefined ? {} : { take })
  });
  return saints.map(({ id }) => id);
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
  endYear,
  location,
  startYear,
  tradition
}: {
  endYear?: number;
  location: string;
  startYear?: number;
  tradition: string;
}): Prisma.SaintWhereInput {
  const and: Prisma.SaintWhereInput[] = [];

  if (tradition) {
    and.push(tradition === DEFAULT_TRADITION
      ? { traditions: { none: { tradition: { status: { in: [...PUBLIC_TRADITION_STATUSES] } } } } }
      : { traditions: { some: { tradition: { name: tradition, status: { in: [...PUBLIC_TRADITION_STATUSES] } } } } });
  }

  if (location) {
    and.push(location === DEFAULT_LOCATION
      ? { places: { none: {} } }
      : { places: { some: { place: { name: location } } } });
  }

  if (startYear != null || endYear != null) {
    const selectedStart = startYear ?? Number.MIN_SAFE_INTEGER;
    const selectedEnd = endYear ?? Number.MAX_SAFE_INTEGER;
    and.push({
      AND: [
        { OR: [{ birthYear: { lte: selectedEnd } }, { birthYear: null, samadhiYear: { lte: selectedEnd } }] },
        { OR: [{ samadhiYearEnd: { gte: selectedStart } }, { samadhiYearEnd: null, samadhiYear: { gte: selectedStart } }, { samadhiYear: null, birthYearEnd: { gte: selectedStart } }, { samadhiYear: null, birthYearEnd: null, birthYear: { gte: selectedStart } }] }
      ]
    });
  }

  return and.length > 0 ? { AND: and } : {};
}

function saintOverlapsRange(
  saint: { birthYear: number | null; birthYearEnd: number | null; samadhiYear: number | null; samadhiYearEnd: number | null },
  startYear?: number,
  endYear?: number
) {
  if (startYear == null && endYear == null) return true;
  const years = getSaintKnownYears(saint);
  if (years.length === 0) return false;
  const saintStart = saint.birthYear ?? saint.samadhiYear ?? years[0];
  const saintEnd = saint.samadhiYearEnd ?? saint.samadhiYear ?? saint.birthYearEnd ?? saint.birthYear ?? years[years.length - 1];
  return saintStart <= (endYear ?? Number.MAX_SAFE_INTEGER) && saintEnd >= (startYear ?? Number.MIN_SAFE_INTEGER);
}

function getSaintKnownYears(saint: { birthYear: number | null; birthYearEnd: number | null; samadhiYear: number | null; samadhiYearEnd: number | null }) {
  return [saint.birthYear, saint.birthYearEnd, saint.samadhiYear, saint.samadhiYearEnd]
    .filter((year): year is number => year != null);
}

function getUniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
    .sort((left, right) => left.localeCompare(right));
}
