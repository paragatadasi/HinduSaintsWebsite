import { db } from "@/lib/db";
import type {
  PublicSaintSummary,
  PublicSourceSummary,
  PublicTraditionDetail,
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
      saints: {
        where: { saint: { status: "published" } },
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
    founder: tradition.founderSaintId ? founderNames.get(tradition.founderSaintId) : undefined,
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
    introductionMarkdown: tradition.longIntroductionMarkdown ?? undefined,
    saints: getSortedSaints(tradition).map(toPublicSaintSummary),
    sources,
    furtherReading: sources,
    seo: {
      title: tradition.seoTitle ?? tradition.name,
      description: tradition.seoDescription ?? tradition.shortDescription ?? undefined
    }
  };
}

function toPublicSaintSummary(saint: TraditionSaintRow): PublicSaintSummary {
  return {
    slug: saint.slug,
    displayName: saint.displayName,
    canonicalName: saint.canonicalName,
    shortDescription: saint.shortDescription ?? saint.biographySummary ?? "",
    eraLabel: saint.eraLabel ?? DEFAULT_ERA,
    primaryLocation: getPrimaryLocation(saint.places),
    tradition: getPrimaryTradition(saint.traditions),
    featured: saint.featured,
    instagramUrls: [],
    instagramItems: [],
    status: "published"
  };
}

function getSortedSaints(tradition: TraditionListRow | TraditionDetailRow) {
  return tradition.saints
    .map(({ saint }) => saint)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
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
