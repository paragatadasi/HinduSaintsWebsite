import { db } from "@/lib/db";
import { getInstagramCarouselCoverImageUrl, getInstagramImageUrls } from "@/lib/instagram";
import { saveImageBuffer } from "@/lib/media-storage";

type CacheInstagramCoverInput = {
  fallbackUrl?: string | null;
  fileName: string;
  rawPayloadJson?: unknown;
};

type CacheInstagramMediaInput = {
  fallbackUrl?: string | null;
  fileNamePrefix: string;
  instagramItemId: string;
  rawPayloadJson?: unknown;
};

export async function cacheInstagramCoverImage({ fallbackUrl, fileName, rawPayloadJson }: CacheInstagramCoverInput) {
  const sourceUrl = getInstagramCarouselCoverImageUrl(rawPayloadJson) ?? normalizeUrl(fallbackUrl);
  if (!sourceUrl || isLocalMediaUrl(sourceUrl)) return sourceUrl;

  const response = await fetch(sourceUrl, { cache: "no-store" });
  const contentType = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();

  if (!response.ok || !contentType?.startsWith("image/")) {
    throw new Error(`Instagram cover image could not be loaded: ${response.status} ${response.statusText}`);
  }

  const stored = await saveImageBuffer({
    body: Buffer.from(await response.arrayBuffer()),
    contentType,
    fileName,
    folder: "instagram-covers"
  });

  return stored.url;
}

export async function cacheInstagramMediaAssets({
  fallbackUrl,
  fileNamePrefix,
  instagramItemId,
  rawPayloadJson
}: CacheInstagramMediaInput) {
  const sourceUrls = getInstagramImageUrls(rawPayloadJson, fallbackUrl);
  const cachedAssets = [];
  let sortOrder = 0;

  for (const sourceUrl of sourceUrls) {
    let cached;
    try {
      cached = await cacheInstagramMediaSource({
        fileName: `${fileNamePrefix}-${sortOrder + 1}`,
        folder: "instagram-media",
        sourceUrl
      });
    } catch (error) {
      console.warn(`Skipping Instagram media source ${sourceUrl}: ${error instanceof Error ? error.message : "unknown error"}`);
      continue;
    }

    if (!cached) continue;

    const asset = await db.instagramMediaAsset.upsert({
      where: {
        instagramItemId_sortOrder: {
          instagramItemId,
          sortOrder
        }
      },
      create: {
        instagramItemId,
        sourceUrl,
        cachedUrl: cached.url,
        storageKey: cached.storageKey,
        mediaType: cached.mimeType,
        sortOrder,
        isCover: sortOrder === 0
      },
      update: {
        sourceUrl,
        cachedUrl: cached.url,
        storageKey: cached.storageKey,
        mediaType: cached.mimeType,
        isCover: sortOrder === 0
      }
    });

    cachedAssets.push(asset);
    sortOrder += 1;
  }

  if (cachedAssets.length < sourceUrls.length) {
    await db.instagramMediaAsset.deleteMany({
      where: {
        instagramItemId,
        sortOrder: { gte: cachedAssets.length }
      }
    });
  }

  return cachedAssets;
}

export function isLocalMediaUrl(url: string) {
  return url.startsWith("/media/") || url.startsWith("/instagram-covers/");
}

async function cacheInstagramMediaSource({
  fileName,
  folder,
  sourceUrl
}: {
  fileName: string;
  folder: string;
  sourceUrl: string;
}) {
  if (isLocalMediaUrl(sourceUrl)) {
    return {
      url: sourceUrl,
      storageKey: getStorageKeyFromLocalMediaUrl(sourceUrl),
      mimeType: undefined
    };
  }

  const response = await fetch(sourceUrl, { cache: "no-store" });
  const contentType = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();

  if (!response.ok || !contentType?.startsWith("image/")) {
    throw new Error(`Instagram media could not be loaded: ${response.status} ${response.statusText}`);
  }

  return saveImageBuffer({
    body: Buffer.from(await response.arrayBuffer()),
    contentType,
    fileName,
    folder
  });
}

function getStorageKeyFromLocalMediaUrl(url: string) {
  return url.startsWith("/media/") ? url.slice("/media/".length) : undefined;
}

function normalizeUrl(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}
