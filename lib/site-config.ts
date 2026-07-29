import { db } from "@/lib/db";
import {
  getAboutPageContent,
  getFooterContent,
  type AboutPageContent,
  type FooterContent
} from "@/lib/site-content";

export const SITE_CONFIG_ID = "site";

export async function getPublicFooterContent(): Promise<FooterContent> {
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
}

export async function getPublicAboutPageContent(): Promise<AboutPageContent | null> {
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
    && config.aboutSectionTitles.length === fallback.sections.length
    && config.aboutSectionBodies.length === fallback.sections.length
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
}
