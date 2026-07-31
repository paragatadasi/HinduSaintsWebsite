import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { PUBLIC_CACHE_TAGS, PUBLIC_DATA_CACHE_SECONDS } from "@/lib/public-cache";
import type { PublicImage } from "@/lib/public-contracts";
import { getPublicImageVariants } from "@/lib/responsive-images";
import {
  getAboutPageContent,
  getFooterContent,
  type AboutPageContent,
  type FooterContent
} from "@/lib/site-content";

export const SITE_CONFIG_ID = "site";

export async function getPublicFooterContent(): Promise<FooterContent> {
  return getPublicFooterContentCached();
}

const getPublicFooterContentCached = unstable_cache(async (): Promise<FooterContent> => {
  const fallback = getFooterContent();
  const config = await db.siteConfig.findUnique({
    where: { id: SITE_CONFIG_ID },
    select: {
      imprintUrl: true,
      privacyPolicyUrl: true
    }
  });

  return {
    ...fallback,
    imprint: {
      ...fallback.imprint,
      href: config?.imprintUrl || fallback.imprint.href
    },
    privacyPolicy: {
      ...fallback.privacyPolicy,
      href: config?.privacyPolicyUrl || fallback.privacyPolicy.href
    }
  };
}, ["public-footer-content"], {
  revalidate: PUBLIC_DATA_CACHE_SECONDS,
  tags: [PUBLIC_CACHE_TAGS.site]
});

export type PublicAboutPageContent = AboutPageContent & {
  heroImage?: PublicImage;
  visionImage?: PublicImage;
  storyImage?: PublicImage;
  guruImage?: PublicImage;
};

export async function getPublicAboutPageContent(): Promise<PublicAboutPageContent | null> {
  return getPublicAboutPageContentCached();
}

const getPublicAboutPageContentCached = unstable_cache(async (): Promise<PublicAboutPageContent | null> => {
  const fallback = getAboutPageContent();
  if (!fallback) return null;

  const config = await db.siteConfig.findUnique({
    where: { id: SITE_CONFIG_ID },
    select: {
      aboutEyebrow: true,
      aboutTitle: true,
      aboutIntroduction: true,
      aboutSectionTitles: true,
      aboutSectionBodies: true,
      aboutHeroImage: true,
      aboutVisionImage: true,
      aboutStoryImage: true,
      aboutGuruImage: true
    }
  });
  const sections =
    config
    && config.aboutSectionTitles.length > 0
    && config.aboutSectionTitles.length === config.aboutSectionBodies.length
      ? config.aboutSectionTitles.map((title, index) => ({
          title,
          body: config.aboutSectionBodies[index] ?? ""
        }))
      : fallback.sections;

  return {
    ...fallback,
    eyebrow: config?.aboutEyebrow || fallback.eyebrow,
    title: config?.aboutTitle || fallback.title,
    introduction: config?.aboutIntroduction || fallback.introduction,
    sections,
    heroImage: config?.aboutHeroImage ? toPublicImage(config.aboutHeroImage, "A devotee beside a sacred river") : undefined,
    visionImage: config?.aboutVisionImage ? toPublicImage(config.aboutVisionImage, "A temple beneath a star-filled sky") : undefined,
    storyImage: config?.aboutStoryImage ? toPublicImage(config.aboutStoryImage, "A devotional gathering by lamplight") : undefined,
    guruImage: config?.aboutGuruImage ? toPublicImage(config.aboutGuruImage, "Paramahamsa Vishwananda") : undefined
  };
}, ["public-about-content"], {
  revalidate: PUBLIC_DATA_CACHE_SECONDS,
  tags: [PUBLIC_CACHE_TAGS.site]
});

function toPublicImage(
  image: { url: string; altText: string | null; caption: string | null; credit: string | null; sourceUrl: string | null; width: number | null; height: number | null; variants: unknown },
  fallbackAlt: string
): PublicImage {
  return {
    url: image.url,
    variants: getPublicImageVariants(image.variants),
    alt: image.altText ?? fallbackAlt,
    caption: image.caption ?? undefined,
    credit: image.credit ?? undefined,
    sourceUrl: image.sourceUrl ?? undefined,
    width: image.width ?? undefined,
    height: image.height ?? undefined
  };
}
