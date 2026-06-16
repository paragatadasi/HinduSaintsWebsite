import { getInstagramCarouselCoverImageUrl } from "@/lib/instagram";
import { saveImageBuffer } from "@/lib/media-storage";

type CacheInstagramCoverInput = {
  fallbackUrl?: string | null;
  fileName: string;
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

export function isLocalMediaUrl(url: string) {
  return url.startsWith("/media/") || url.startsWith("/instagram-covers/");
}

function normalizeUrl(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}
