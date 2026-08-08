import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { getInstagramCarouselCoverImageUrl } from "@/lib/instagram";
import { PUBLIC_CACHE_TAGS, PUBLIC_DATA_CACHE_SECONDS } from "@/lib/public-cache";
import type { PublicImage } from "@/lib/public-contracts";
import { getPublicImageVariants } from "@/lib/responsive-images";

export type PublicInstagramCarouselPreview = {
  url: string;
  imageUrl: string;
  imageUrls: string[];
  imageVariants?: PublicImage["variants"];
  alt: string;
  caption?: string;
  postedAt?: string;
  saint?: {
    slug: string;
    displayName: string;
  };
};

export type PublicInstagramMediaAsset = {
  cachedUrl: string;
  sourceUrl?: string | null;
  variants?: unknown;
};

const INSTAGRAM_CDN_URL_PATTERN = /(^|\.)cdninstagram\.com$/i;
const INSTAGRAM_URL_EXPIRY_BUFFER_MS = 60 * 60 * 1000;

export async function getRecentInstagramCarouselPreviews(limit = 16): Promise<PublicInstagramCarouselPreview[]> {
  return getRecentInstagramCarouselPreviewsCached(limit);
}

const getRecentInstagramCarouselPreviewsCached = unstable_cache(async (
  limit = 16
): Promise<PublicInstagramCarouselPreview[]> => {
  const items = await db.instagramItem.findMany({
    where: {
      type: "carousel"
    },
    orderBy: [
      { postedAt: { sort: "desc", nulls: "last" } },
      { createdAt: "desc" }
    ],
    take: limit * 3,
    select: {
      id: true,
      instagramUrl: true,
      captionText: true,
      postedAt: true,
      thumbnailUrl: true,
      saints: {
        where: {
          matchStatus: { in: ["matched", "published"] },
          saint: { status: "published" }
        },
        orderBy: [
          { isPrimary: "desc" },
          { reviewedAt: "desc" }
        ],
        take: 1,
        select: {
          saint: {
            select: {
              slug: true,
              displayName: true
            }
          }
        }
      },
      mediaAssets: {
        orderBy: { sortOrder: "asc" },
        select: { cachedUrl: true, sourceUrl: true, variants: true }
      }
    }
  });

  if (items.length === 0) return [];

  const externalRecords = await db.externalRecord.findMany({
    where: {
      sourceType: "instagram",
      entityType: "InstagramItem",
      entityId: { in: items.map((item) => item.id) }
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

  return items
    .flatMap((item) => {
      const coverImageUrl = getInstagramCarouselCoverImageUrl(rawPayloadByItemId.get(item.id));
      const images = getPreviewImages({
        coverImageUrl,
        mediaAssets: item.mediaAssets,
        thumbnailUrl: item.thumbnailUrl
      });
      const imageUrls = images.map((image) => image.url);
      const imageUrl = imageUrls[0];
      if (!imageUrl) return [];

      return [{
        url: item.instagramUrl,
        imageUrl,
        imageUrls,
        imageVariants: images[0]?.variants,
        alt: getInstagramPreviewAlt(item.captionText),
        ...(item.captionText ? { caption: item.captionText } : {}),
        ...(item.postedAt ? { postedAt: item.postedAt.toISOString() } : {}),
        ...(item.saints[0]?.saint ? { saint: item.saints[0].saint } : {})
      }];
    })
    .slice(0, limit);
}, ["public-instagram-carousel-previews"], {
  revalidate: PUBLIC_DATA_CACHE_SECONDS,
  tags: [PUBLIC_CACHE_TAGS.instagram]
});

function getPreviewImages({
  coverImageUrl,
  mediaAssets,
  thumbnailUrl
}: {
  coverImageUrl?: string;
  mediaAssets: PublicInstagramMediaAsset[];
  thumbnailUrl?: string | null;
}): Array<{ url: string; variants?: PublicImage["variants"] }> {
  const cachedImages = getPublicInstagramMediaAssetImages(mediaAssets);
  if (cachedImages.length > 0) return cachedImages;

  return getFreshInstagramImageUrls([thumbnailUrl, coverImageUrl])
    .map((url) => ({ url }));
}

export function getPublicInstagramMediaAssetUrls(mediaAssets: PublicInstagramMediaAsset[]) {
  return getPublicInstagramMediaAssetImages(mediaAssets).map((image) => image.url);
}

export function getPublicInstagramMediaAssetImages(mediaAssets: PublicInstagramMediaAsset[]) {
  const hasCarouselMedia = mediaAssets.some((asset) => !isCachedCoverAsset(asset));
  const seen = new Set<string>();
  const images: Array<{ url: string; variants?: PublicImage["variants"] }> = [];

  for (const asset of mediaAssets) {
    if (hasCarouselMedia && isCachedCoverAsset(asset)) continue;

    const cachedUrl = asset.cachedUrl.trim();
    if (!cachedUrl || isExpiredInstagramCdnUrl(cachedUrl)) continue;

    const identity = getMediaAssetIdentity(asset) ?? cachedUrl;
    if (seen.has(identity)) continue;

    seen.add(identity);
    images.push({
      url: cachedUrl,
      variants: getPublicImageVariants(asset.variants)
    });
  }

  return images;
}

function getInstagramPreviewAlt(caption: string | null) {
  return caption ? `Instagram carousel cover: ${caption.slice(0, 80)}` : "Instagram carousel cover";
}

function getMediaAssetIdentity(asset: PublicInstagramMediaAsset) {
  const sourceUrl = asset.sourceUrl?.trim();
  if (!sourceUrl || isCachedCoverUrl(sourceUrl)) return undefined;

  return getCanonicalImageUrl(sourceUrl);
}

function isCachedCoverAsset(asset: PublicInstagramMediaAsset) {
  return isCachedCoverUrl(asset.cachedUrl) || isCachedCoverUrl(asset.sourceUrl);
}

function isCachedCoverUrl(url?: string | null) {
  return Boolean(url?.includes("/instagram-covers/"));
}

function getCanonicalImageUrl(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`.toLowerCase();
  } catch {
    return url;
  }
}

function getFreshInstagramImageUrls(urls: Array<string | null | undefined>) {
  return Array.from(new Set(urls.flatMap((url) => {
    const trimmedUrl = url?.trim();
    if (!trimmedUrl || isExpiredInstagramCdnUrl(trimmedUrl)) return [];
    return [trimmedUrl];
  })));
}

function isExpiredInstagramCdnUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (!INSTAGRAM_CDN_URL_PATTERN.test(parsed.hostname)) return false;

    const expiresAt = parseInstagramCdnExpiry(parsed.searchParams.get("oe"));
    return Boolean(expiresAt && expiresAt.getTime() <= Date.now() + INSTAGRAM_URL_EXPIRY_BUFFER_MS);
  } catch {
    return false;
  }
}

function parseInstagramCdnExpiry(value: string | null) {
  if (!value) return undefined;

  const seconds = Number.parseInt(value, 16);
  if (!Number.isFinite(seconds)) return undefined;

  return new Date(seconds * 1000);
}
