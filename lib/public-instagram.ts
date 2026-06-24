import { db } from "@/lib/db";
import { getInstagramCarouselCoverImageUrl } from "@/lib/instagram";

export type PublicInstagramCarouselPreview = {
  url: string;
  imageUrl: string;
  imageUrls: string[];
  alt: string;
  caption?: string;
  postedAt?: string;
};

export type PublicInstagramMediaAsset = {
  cachedUrl: string;
  sourceUrl?: string | null;
};

const INSTAGRAM_CDN_URL_PATTERN = /(^|\.)cdninstagram\.com$/i;
const INSTAGRAM_URL_EXPIRY_BUFFER_MS = 60 * 60 * 1000;

export async function getRecentInstagramCarouselPreviews(limit = 8): Promise<PublicInstagramCarouselPreview[]> {
  const items = await db.instagramItem.findMany({
    where: {
      type: "carousel",
      status: { in: ["matched", "published"] },
      saints: {
        some: {
          matchStatus: { in: ["matched", "published"] },
          saint: { status: "published" }
        }
      }
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
      mediaAssets: {
        orderBy: { sortOrder: "asc" },
        select: { cachedUrl: true, sourceUrl: true }
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
      const imageUrls = getPreviewImageUrls({
        coverImageUrl,
        mediaAssets: item.mediaAssets,
        thumbnailUrl: item.thumbnailUrl
      });
      const imageUrl = imageUrls[0];
      if (!imageUrl) return [];

      return [{
        url: item.instagramUrl,
        imageUrl,
        imageUrls,
        alt: getInstagramPreviewAlt(item.captionText),
        ...(item.captionText ? { caption: item.captionText } : {}),
        ...(item.postedAt ? { postedAt: item.postedAt.toISOString() } : {})
      }];
    })
    .slice(0, limit);
}

function getPreviewImageUrls({
  coverImageUrl,
  mediaAssets,
  thumbnailUrl
}: {
  coverImageUrl?: string;
  mediaAssets: PublicInstagramMediaAsset[];
  thumbnailUrl?: string | null;
}) {
  const cachedUrls = getPublicInstagramMediaAssetUrls(mediaAssets);
  if (cachedUrls.length > 0) return cachedUrls;

  return getFreshInstagramImageUrls([thumbnailUrl, coverImageUrl]);
}

export function getPublicInstagramMediaAssetUrls(mediaAssets: PublicInstagramMediaAsset[]) {
  const hasCarouselMedia = mediaAssets.some((asset) => !isCachedCoverAsset(asset));
  const seen = new Set<string>();
  const urls: string[] = [];

  for (const asset of mediaAssets) {
    if (hasCarouselMedia && isCachedCoverAsset(asset)) continue;

    const cachedUrl = asset.cachedUrl.trim();
    if (!cachedUrl || isExpiredInstagramCdnUrl(cachedUrl)) continue;

    const identity = getMediaAssetIdentity(asset) ?? cachedUrl;
    if (seen.has(identity)) continue;

    seen.add(identity);
    urls.push(cachedUrl);
  }

  return urls;
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
