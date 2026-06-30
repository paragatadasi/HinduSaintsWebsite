import { db } from "@/lib/db";
import type { PublicImage } from "@/lib/public-contracts";
import { getPublishedSaintSummariesByIds } from "@/lib/public-saints";
import { getPublishedTraditionSummariesByIds } from "@/lib/public-traditions";
import {
  getHomeHeroContent,
  getHomeQuoteContent,
  type HomeHeroContent,
  type HomeQuoteContent
} from "@/lib/site-content";

export const HOME_PAGE_CONFIG_ID = "home";

export async function getPublicHomePageConfig() {
  const config = await db.homePageConfig.findUnique({
    where: { id: HOME_PAGE_CONFIG_ID },
    include: { bannerImage: true }
  });
  const defaultHero = getHomeHeroContent();
  const defaultQuote = getHomeQuoteContent();

  if (!config) {
    return {
      hero: defaultHero,
      quote: defaultQuote,
      bannerImage: undefined,
      bannerFocalArea: getDefaultBannerFocalArea(),
      featuredSaints: [],
      featuredTraditions: []
    };
  }

  const [featuredSaints, featuredTraditions] = await Promise.all([
    getPublishedSaintSummariesByIds(config.featuredSaintIds),
    getPublishedTraditionSummariesByIds(config.featuredTraditionIds)
  ]);

  return {
    hero: mergeHeroContent(defaultHero, config),
    quote: mergeQuoteContent(defaultQuote, config),
    bannerImage: config.bannerImage ? toPublicImage(config.bannerImage, config.heroTitle ?? defaultHero.title) : undefined,
    bannerFocalArea: {
      x: config.bannerFocalX,
      y: config.bannerFocalY,
      width: config.bannerFocalWidth,
      height: config.bannerFocalHeight
    },
    featuredSaints,
    featuredTraditions
  };
}

export function getDefaultBannerFocalArea() {
  return {
    x: 50,
    y: 50,
    width: 60,
    height: 60
  };
}

function mergeHeroContent(
  fallback: HomeHeroContent,
  config: {
    heroEyebrow: string | null;
    heroTitle: string | null;
    heroBody: string | null;
    heroPrimaryLabel: string | null;
    heroPrimaryHref: string | null;
    heroSecondaryLabel: string | null;
    heroSecondaryHref: string | null;
  }
): HomeHeroContent {
  return {
    eyebrow: config.heroEyebrow || fallback.eyebrow,
    title: config.heroTitle || fallback.title,
    body: config.heroBody || fallback.body,
    primaryAction: {
      label: config.heroPrimaryLabel || fallback.primaryAction.label,
      href: config.heroPrimaryHref || fallback.primaryAction.href
    },
    secondaryAction: {
      label: config.heroSecondaryLabel || fallback.secondaryAction.label,
      href: config.heroSecondaryHref || fallback.secondaryAction.href
    }
  };
}

function mergeQuoteContent(
  fallback: HomeQuoteContent,
  config: {
    quoteEyebrow: string | null;
    quoteText: string | null;
    quoteAttribution: string | null;
  }
): HomeQuoteContent {
  return {
    eyebrow: config.quoteEyebrow || fallback.eyebrow,
    quote: config.quoteText || fallback.quote,
    attribution: config.quoteAttribution || fallback.attribution
  };
}

function toPublicImage(
  image: {
    url: string;
    altText: string | null;
    caption: string | null;
    credit: string | null;
    sourceUrl: string | null;
    width: number | null;
    height: number | null;
  },
  fallbackAlt: string
): PublicImage {
  return {
    url: image.url,
    alt: image.altText ?? fallbackAlt,
    caption: image.caption ?? undefined,
    credit: image.credit ?? undefined,
    sourceUrl: image.sourceUrl ?? undefined,
    width: image.width ?? undefined,
    height: image.height ?? undefined
  };
}
