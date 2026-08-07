import type { PublicImage } from "@/lib/public-contracts";
import { getManagedStorageKeyFromUrl } from "@/lib/media-storage";

const DEFAULT_SHARE_IMAGE: PublicImage = {
  url: "/images/hindu-saints-share.jpg",
  width: 1200,
  height: 630,
  alt: "A devotee meditating beside a sacred river at night"
};

type SocialImageOptions = {
  fallbackAlt?: string;
  focalPoint?: { x: number; y: number };
  optimizeManagedImage?: boolean;
};

export function getSocialImage(image?: PublicImage, options: SocialImageOptions = {}) {
  const source = image ?? DEFAULT_SHARE_IMAGE;
  const managedStorageKey = options.optimizeManagedImage
    ? getManagedStorageKeyFromUrl(source.url)
    : undefined;
  const focalPoint = options.focalPoint ?? source.focalPoint ?? { x: 50, y: 50 };
  const url = managedStorageKey
    ? buildOptimizedSocialImageUrl(managedStorageKey, focalPoint)
    : source.url;
  const contentType = managedStorageKey ? "image/jpeg" : getImageContentType(source.url);

  return {
    url,
    ...(managedStorageKey ? { width: 1200, height: 630 } : source.width ? { width: source.width } : {}),
    ...(!managedStorageKey && source.height ? { height: source.height } : {}),
    ...(contentType ? { type: contentType } : {}),
    alt: source.alt.trim() || options.fallbackAlt || DEFAULT_SHARE_IMAGE.alt
  };
}

function buildOptimizedSocialImageUrl(storageKey: string, focalPoint: { x: number; y: number }) {
  const encodedKey = storageKey.split("/").map(encodeURIComponent).join("/");
  const params = new URLSearchParams({
    x: String(clampPercentage(focalPoint.x)),
    y: String(clampPercentage(focalPoint.y))
  });
  return `/social-image/${encodedKey}/preview.jpg?${params}`;
}

function clampPercentage(value: number) {
  return Math.min(100, Math.max(0, Math.round(value * 100) / 100));
}

function getImageContentType(url: string) {
  const pathname = url.split("?", 1)[0].toLowerCase();
  if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) return "image/jpeg" as const;
  if (pathname.endsWith(".png")) return "image/png" as const;
  if (pathname.endsWith(".webp")) return "image/webp" as const;
  if (pathname.endsWith(".gif")) return "image/gif" as const;
  return undefined;
}
