import { db } from "@/lib/db";
import { getInstagramCarouselCoverImageUrl } from "@/lib/instagram";

export type PublicInstagramCarouselPreview = {
  url: string;
  imageUrl: string;
  imageUrls: string[];
  alt: string;
  postedAt?: string;
};

const INSTAGRAM_CDN_URL_PATTERN = /(^|\.)cdninstagram\.com$/i;
const INSTAGRAM_URL_EXPIRY_BUFFER_MS = 60 * 60 * 1000;

export async function getRecentInstagramCarouselPreviews(limit = 8): Promise<PublicInstagramCarouselPreview[]> {
  const items = await db.instagramItem.findMany({
    where: {
      type: "carousel",
      status: { not: "hidden" }
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
      thumbnailUrl: true
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
      const imageUrls = getFreshInstagramImageUrls([item.thumbnailUrl, coverImageUrl]);
      const imageUrl = imageUrls[0];
      if (!imageUrl) return [];

      return [{
        url: item.instagramUrl,
        imageUrl,
        imageUrls,
        alt: getInstagramPreviewAlt(item.captionText),
        ...(item.postedAt ? { postedAt: item.postedAt.toISOString() } : {})
      }];
    })
    .slice(0, limit);
}

function getInstagramPreviewAlt(caption: string | null) {
  return caption ? `Instagram carousel cover: ${caption.slice(0, 80)}` : "Instagram carousel cover";
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
