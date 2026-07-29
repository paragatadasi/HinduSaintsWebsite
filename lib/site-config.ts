import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { PUBLIC_CACHE_TAGS, PUBLIC_DATA_CACHE_SECONDS } from "@/lib/public-cache";
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

export async function getPublicAboutPageContent(): Promise<AboutPageContent | null> {
  return getPublicAboutPageContentCached();
}

const getPublicAboutPageContentCached = unstable_cache(async (): Promise<AboutPageContent | null> => {
  const fallback = getAboutPageContent();
  if (!fallback) return null;

  const config = await db.siteConfig.findUnique({
    where: { id: SITE_CONFIG_ID },
    select: {
      aboutEyebrow: true,
      aboutTitle: true,
      aboutIntroduction: true,
      aboutSectionTitles: true,
      aboutSectionBodies: true
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
    sections
  };
}, ["public-about-content"], {
  revalidate: PUBLIC_DATA_CACHE_SECONDS,
  tags: [PUBLIC_CACHE_TAGS.site]
});
