import type { Prisma } from "@/lib/generated/prisma/client";
import type { InstagramFirstPageMetadata } from "@/lib/instagram-metadata";
import { rankWeightedTextSearch, type WeightedSearchField } from "@/lib/search-text";

export const instagramQueueStatuses = [
  "imported",
  "suggested",
  "needs_review",
  "matched",
  "published",
  "ignored"
] as const;

export const instagramQueueFormats = ["carousel", "reel"] as const;
export const instagramContentTypes = ["biography", "theme", "quote"] as const;

export type InstagramQueueStatus = typeof instagramQueueStatuses[number] | "all";
export type InstagramQueueFormat = typeof instagramQueueFormats[number] | "all";
export type InstagramContentFilter = typeof instagramContentTypes[number] | "untagged" | "all";

export type InstagramQueueFilters = {
  contentType?: InstagramContentFilter;
  format?: InstagramQueueFormat;
};

type SearchableInstagramItem = {
  captionText: string | null;
  contentType: string | null;
  extractedSaintName: string | null;
  firstPageMetadata: unknown;
  firstPageText: string | null;
  instagramShortcode: string | null;
  instagramUrl: string;
  postedAt: Date | null;
  status: string;
  type: string;
  updatedAt: Date;
  saints: Array<{
    matchConfidence: string;
    matchStatus: string;
    saint: {
      canonicalName: string;
      displayName: string;
    };
  }>;
};

export function getInstagramQueueWhere(status: InstagramQueueStatus, filters: InstagramQueueFilters = {}): Prisma.InstagramItemWhereInput {
  const clauses: Prisma.InstagramItemWhereInput[] = [];
  if (status === "published") {
    clauses.push({
      saints: {
        some: {
          matchStatus: { in: ["matched", "published"] },
          saint: { status: "published" }
        }
      }
    });
  } else if (status !== "all") {
    clauses.push({ status });
  }

  if (filters.format && filters.format !== "all") clauses.push({ type: filters.format });
  if (filters.contentType === "untagged") clauses.push({ contentType: null });
  else if (filters.contentType && filters.contentType !== "all") clauses.push({ contentType: filters.contentType });

  if (clauses.length === 0) return {};
  if (clauses.length === 1) return clauses[0];
  return { AND: clauses };
}

export function rankInstagramQueueItems<T extends SearchableInstagramItem>(items: T[], query: string) {
  return rankWeightedTextSearch(
    items,
    query,
    buildInstagramItemSearchFields,
    {
      tieBreaker: (left, right) => getInstagramSortDate(right) - getInstagramSortDate(left)
    }
  ).map(({ item }) => item);
}

export function getInstagramFirstPageMetadata(value: unknown): InstagramFirstPageMetadata {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const metadata = value as Record<string, unknown>;

  return {
    displayName: getString(metadata.displayName),
    subtitle: getString(metadata.subtitle),
    born: getString(metadata.born),
    samadhi: getString(metadata.samadhi),
    keyPlace: getString(metadata.keyPlace),
    tradition: getString(metadata.tradition),
    guru: getString(metadata.guru)
  };
}

function buildInstagramItemSearchFields(item: SearchableInstagramItem): WeightedSearchField[] {
  const metadata = getInstagramFirstPageMetadata(item.firstPageMetadata);
  return [
    { value: metadata.displayName, weight: 6 },
    { value: item.extractedSaintName, weight: 6 },
    ...item.saints.flatMap((link) => [
      { value: link.saint.displayName, weight: 6 },
      { value: link.saint.canonicalName, weight: 5 },
      { value: link.matchStatus, weight: 2 },
      { value: link.matchConfidence, weight: 1.5 }
    ]),
    { value: item.instagramShortcode, weight: 5 },
    { value: metadata.subtitle, weight: 3 },
    { value: metadata.keyPlace, weight: 3 },
    { value: metadata.tradition, weight: 3 },
    { value: metadata.guru, weight: 3 },
    { value: metadata.born, weight: 2 },
    { value: metadata.samadhi, weight: 2 },
    { value: item.firstPageText, weight: 2 },
    { value: item.captionText, weight: 1.4 },
    { value: item.instagramUrl, weight: 1 },
    { value: item.status, weight: 1 },
    { value: item.type, weight: 1 },
    { value: item.contentType, weight: 1 },
    { value: item.postedAt?.toLocaleDateString(), weight: 0.8 }
  ];
}

function getInstagramSortDate(item: SearchableInstagramItem) {
  return (item.postedAt ?? item.updatedAt).getTime();
}

function getString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}
