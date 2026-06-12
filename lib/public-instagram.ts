import { db } from "@/lib/db";
import { getInstagramCarouselImageUrls } from "@/lib/instagram";

export type PublicInstagramCarouselPreview = {
  url: string;
  imageUrl: string;
  alt: string;
  postedAt?: string;
};

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
      const carouselImages = getInstagramCarouselImageUrls(rawPayloadByItemId.get(item.id));
      const imageUrl = carouselImages[0] ?? item.thumbnailUrl;
      if (!imageUrl) return [];

      return [{
        url: item.instagramUrl,
        imageUrl,
        alt: getInstagramPreviewAlt(item.captionText),
        ...(item.postedAt ? { postedAt: item.postedAt.toISOString() } : {})
      }];
    })
    .slice(0, limit);
}

function getInstagramPreviewAlt(caption: string | null) {
  return caption ? `Instagram carousel cover: ${caption.slice(0, 80)}` : "Instagram carousel cover";
}
