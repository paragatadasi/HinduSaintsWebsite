import type { Metadata } from "next";

export const SITE_NAME = "Hindu Saints Archive";
export const DEFAULT_SOCIAL_IMAGE = "/images/hindu-saints-share.jpg";

export function siteTitle(title: string) {
  return `${title} | ${SITE_NAME}`;
}

export function getSiteUrl() {
  return new URL(process.env.PUBLIC_SITE_URL ?? "http://localhost:3000");
}

export function buildPublicMetadata({
  title,
  description,
  path,
  image = DEFAULT_SOCIAL_IMAGE,
  imageAlt = "A devotee meditating beside a sacred river at night",
  noIndex = false,
  openGraphType = "website"
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  noIndex?: boolean;
  openGraphType?: "profile" | "website";
}): Metadata {
  const socialTitle = siteTitle(title);

  return {
    title,
    description,
    alternates: { canonical: path },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: openGraphType,
      url: path,
      siteName: SITE_NAME,
      title: socialTitle,
      description,
      images: [{ url: image, alt: imageAlt }]
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [image]
    }
  };
}
