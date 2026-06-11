import { db } from "@/lib/db";
import { getInstagramCarouselImageUrls } from "@/lib/instagram";
import type { Prisma } from "@prisma/client";
import type {
  PublicImage,
  PublicInstagramItem,
  PublicSaintDetail,
  PublicSaintSummary,
  PublicSourceSummary
} from "@/lib/public-contracts";
import { rankSaintSearchResults } from "@/lib/saint-search";

type SaintListRow = Awaited<ReturnType<typeof getPublishedSaintRows>>[number];
type SaintDetailRow = NonNullable<Awaited<ReturnType<typeof getPublishedSaintRowBySlug>>>;

const DEFAULT_DESCRIPTION = "A reviewed saint profile from the Hindu Saints Archive.";
const DEFAULT_LOCATION = "Location in review";
const DEFAULT_TRADITION = "Tradition in review";
const DEFAULT_ERA = "Dates in review";

async function getPublishedSaintRows(where: Prisma.SaintWhereInput = {}) {
  return db.saint.findMany({
    where: { status: "published", ...where },
    orderBy: [{ featured: "desc" }, { displayName: "asc" }],
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
  const rows = await getPublishedSaintRows();
  return rows.map(toPublicSaintSummary);
}

export async function searchPublishedSaintSummaries(query: string) {
  const term = query.trim();
  if (!term) return getPublishedSaintSummaries();

  const rows = await getPublishedSaintRows();
  return rankSaintSearchResults(rows, term)
    .map(({ item }) => toPublicSaintSummary(item));
}

export async function getFeaturedSaintSummaries() {
  const saints = await getPublishedSaintSummaries();
  const featured = saints.filter((saint) => saint.featured);
  return featured.length > 0 ? featured : saints.slice(0, 6);
}

export async function getPublishedSaintSlugs() {
  return db.saint.findMany({
    where: { status: "published" },
    select: { slug: true },
    orderBy: { slug: "asc" }
  });
}

export async function getPublishedSaintBySlug(slug: string): Promise<PublicSaintDetail | null> {
  const saint = await getPublishedSaintRowBySlug(slug);
  if (!saint) return null;

  const instagramUrls = await getInstagramUrlsForSaint(saint.id);
  const instagramItems = await getInstagramItemsForSaint(saint.id);
  const sources = await getSourcesForSaint(saint.id);
  return toPublicSaintDetail(saint, instagramUrls, instagramItems, sources);
}

function toPublicSaintSummary(saint: SaintListRow): PublicSaintSummary {
  return {
    slug: saint.slug,
    displayName: saint.displayName,
    canonicalName: saint.canonicalName,
    shortDescription: saint.shortDescription ?? saint.biographySummary ?? DEFAULT_DESCRIPTION,
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

function scorePublicSaintSearch(saint: SaintListRow, query: string) {
  const weightedFields = buildSaintSearchFields(saint);
  const queryForms = getQuerySearchForms(query);
  const uniqueQueryForms = Array.from(new Set(queryForms)).filter(Boolean);
  const queryTokens = Array.from(new Set(uniqueQueryForms.flatMap(getSearchTokens)))
    .filter((token) => token.length >= 2 && !SEARCH_HONORIFICS.has(token));

  let score = 0;

  for (const field of weightedFields) {
    const fieldForms = getSearchForms(field.value);
    for (const fieldForm of fieldForms) {
      for (const queryForm of uniqueQueryForms) {
        if (fieldForm === queryForm) score += 120 * field.weight;
        else if (fieldForm.startsWith(queryForm)) score += 80 * field.weight;
        else if (fieldForm.includes(queryForm)) score += 55 * field.weight;
      }

      const fieldTokens = getSearchTokens(fieldForm);
      for (const queryToken of queryTokens) {
        if (fieldTokens.includes(queryToken)) score += 18 * field.weight;
        else if (fieldTokens.some((fieldToken) => fieldToken.startsWith(queryToken))) score += 10 * field.weight;
        else if (fieldTokens.some((fieldToken) => fieldToken.includes(queryToken))) score += 4 * field.weight;
      }
    }
  }

  return score;
}

function buildSaintSearchFields(saint: SaintListRow) {
  const fields: Array<{ value?: string | null; weight: number }> = [
    { value: saint.displayName, weight: 6 },
    { value: saint.canonicalName, weight: 5 },
    ...saint.aliases.map((alias) => ({ value: alias.alias, weight: 5 })),
    ...saint.places.flatMap(({ place }) => [
      { value: place.name, weight: 3 },
      ...place.alternateNames.map((name) => ({ value: name, weight: 3 })),
      { value: place.region, weight: 2 },
      { value: place.country, weight: 2 }
    ]),
    ...saint.traditions.flatMap(({ tradition }) => [
      { value: tradition.name, weight: 2 },
      ...tradition.alternateNames.map((name) => ({ value: name, weight: 2 }))
    ]),
    { value: saint.eraLabel, weight: 1.5 },
    { value: saint.birthDateRaw, weight: 1 },
    { value: saint.samadhiDateRaw, weight: 1 },
    { value: saint.shortDescription, weight: 0.8 },
    { value: saint.biographySummary, weight: 0.6 }
  ];

  return fields.filter((field): field is { value: string; weight: number } => Boolean(field.value));
}

function getSearchForms(value: string) {
  const normalized = normalizeSearchText(value);
  const withoutHonorifics = getSearchTokens(normalized)
    .filter((token) => !SEARCH_HONORIFICS.has(token))
    .join(" ");

  return [normalized, withoutHonorifics].filter(Boolean);
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ṛ/g, "r")
    .replace(/ṝ/g, "r")
    .replace(/ḷ/g, "l")
    .replace(/ṅ/g, "n")
    .replace(/ñ/g, "n")
    .replace(/ṇ/g, "n")
    .replace(/ṃ/g, "m")
    .replace(/ṁ/g, "m")
    .replace(/ś/g, "sh")
    .replace(/ṣ/g, "sh")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function getSearchTokens(value: string) {
  return value.split(" ").filter(Boolean);
}

function getQuerySearchForms(value: string) {
  return expandTransliterationVariants(value).flatMap((variant) => [
    ...getSearchForms(variant),
    ...getSearchTokens(variant).flatMap(expandTransliterationVariants).flatMap(getSearchForms)
  ]);
}

function expandTransliterationVariants(value: string) {
  const normalized = normalizeSearchText(value);
  const variants = new Set([normalized]);
  const substitutions: Array<[RegExp, string]> = [
    [/\bmaharishi\b/g, "maharshi"],
    [/\bmaharshi\b/g, "maharishi"],
    [/\bkrishna\b/g, "krsna"],
    [/\bkrsna\b/g, "krishna"],
    [/\bshiva\b/g, "siva"],
    [/\bsiva\b/g, "shiva"],
    [/\bchaitanya\b/g, "caitanya"],
    [/\bcaitanya\b/g, "chaitanya"],
    [/\bchandra\b/g, "candra"],
    [/\bcandra\b/g, "chandra"],
    [/\bshankar/g, "sankar"],
    [/\bsankar/g, "shankar"],
    [/\bshankara\b/g, "sankara"],
    [/\bsankara\b/g, "shankara"],
    [/\bvaishnava\b/g, "vaisnava"],
    [/\bvaisnava\b/g, "vaishnava"],
    [/\bvrindavan\b/g, "brindavan"],
    [/\bbrindavan\b/g, "vrindavan"],
    [/\bv/g, "w"],
    [/\bw/g, "v"],
    [/\bb/g, "v"],
    [/\bv/g, "b"],
    [/aa/g, "a"],
    [/ee/g, "i"],
    [/oo/g, "u"]
  ];

  for (const [pattern, replacement] of substitutions) {
    variants.add(normalized.replace(pattern, replacement));
  }

  return Array.from(variants);
}

const SEARCH_HONORIFICS = new Set([
  "acharya",
  "amma",
  "baba",
  "babaji",
  "bhagavan",
  "deva",
  "devi",
  "ji",
  "ma",
  "maharaj",
  "maharaja",
  "mata",
  "paramahamsa",
  "paramhansa",
  "saint",
  "sant",
  "shree",
  "shri",
  "sri",
  "swami"
]);

function toPublicSaintDetail(
  saint: SaintDetailRow,
  instagramUrls: string[],
  instagramItems: PublicInstagramItem[],
  sources: PublicSourceSummary[]
): PublicSaintDetail {
  const summary = toPublicSaintSummary(saint);
  const biography = saint.biographies[0];
  const gallery = saint.galleryImages.map((image) => toPublicImage(image.mediaAsset, saint.displayName));
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
    places: saint.places.map(({ place }) => place.name),
    biography: biography
      ? {
          title: biography.title,
          bodyMarkdown: biography.bodyMarkdown,
          sources
        }
      : saint.biographySummary
        ? {
            title: "Profile notes",
            bodyMarkdown: saint.biographySummary,
            sources
          }
        : undefined,
    sources,
    furtherReading: sources,
    seo: {
      title: saint.seoTitle ?? saint.displayName,
      description: saint.seoDescription ?? saint.shortDescription ?? saint.biographySummary ?? undefined
    }
  };
}

function getPrimaryLocation(places: SaintListRow["places"]) {
  const primary = places.find((place) => place.placeType === "primary") ?? places[0];
  return primary?.place.name ?? DEFAULT_LOCATION;
}

function getPrimaryTradition(traditions: SaintListRow["traditions"]) {
  const primary = traditions.find((tradition) => tradition.isPrimary) ?? traditions[0];
  return primary?.tradition.name ?? DEFAULT_TRADITION;
}

function toPublicImage(image: SaintDetailRow["primaryImage"], displayName: string): PublicImage {
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

function buildFacts(saint: SaintDetailRow, summary: PublicSaintSummary) {
  return [
    { label: "Era", value: summary.eraLabel },
    { label: "Primary place", value: summary.primaryLocation },
    { label: "Tradition", value: summary.tradition },
    saint.birthDateRaw ? { label: "Birth date", value: saint.birthDateRaw } : undefined,
    saint.samadhiDateRaw ? { label: "Samadhi date", value: saint.samadhiDateRaw } : undefined
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

async function getInstagramUrlsForSaint(saintId: string) {
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
        select: { instagramUrl: true }
      }
    }
  });

  return links.map((link) => link.instagramItem.instagramUrl);
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

  return links.map(({ instagramItem }) => ({
    url: instagramItem.instagramUrl,
    shortcode: instagramItem.instagramShortcode ?? undefined,
    type: instagramItem.type,
    caption: instagramItem.captionText ?? undefined,
    thumbnailUrl: instagramItem.thumbnailUrl ?? undefined,
    carouselImageUrls: getInstagramCarouselImageUrls(rawPayloadByItemId.get(instagramItem.id)),
    postedAt: instagramItem.postedAt?.toISOString()
  }));
}
