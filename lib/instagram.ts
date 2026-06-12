export function getInstagramShortcode(url: string) {
  const match = url.match(/instagram\.com\/(?:p|reel)\/([^/?#]+)/i);
  return match?.[1] ?? null;
}

export function getInstagramTypeFromUrl(url: string) {
  if (/instagram\.com\/reel\//i.test(url)) return "reel" as const;
  if (/instagram\.com\/p\//i.test(url)) return "post" as const;
  return "unknown" as const;
}

export function getInstagramCarouselImageUrls(rawPayloadJson: unknown) {
  const raw = getRawPayload(rawPayloadJson);
  const children = getRawPayload(raw?.children);
  const data = Array.isArray(children?.data) ? children.data : [];
  const urls = data
    .map((child) => pickImageUrl(getRawPayload(child)))
    .filter((url): url is string => Boolean(url));

  return Array.from(new Set(urls));
}

export function getInstagramImageUrls(rawPayloadJson: unknown, fallbackUrl?: string | null) {
  const raw = getRawPayload(rawPayloadJson);
  const urls = [
    ...getInstagramCarouselImageUrls(rawPayloadJson),
    pickImageUrl(raw),
    fallbackUrl?.trim() || undefined
  ].filter((url): url is string => Boolean(url));

  return Array.from(new Set(urls));
}

type RawPayload = Record<string, unknown>;

const IMAGE_KEYS = ["mediaUrl", "media_url", "thumbnailUrl", "thumbnail_url", "imageUrl", "image_url", "url"];

function getRawPayload(value: unknown): RawPayload | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as RawPayload : undefined;
}

function pickImageUrl(raw: RawPayload | undefined) {
  if (!raw) return undefined;
  const normalizedKeys = new Set(IMAGE_KEYS.map((key) => key.toLowerCase()));
  const match = Object.entries(raw).find(([key, value]) => normalizedKeys.has(key.trim().toLowerCase()) && value != null);
  return typeof match?.[1] === "string" ? match[1].trim() || undefined : undefined;
}
