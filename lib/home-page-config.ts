import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { PUBLIC_CACHE_TAGS, PUBLIC_DATA_CACHE_SECONDS } from "@/lib/public-cache";
import type { PublicImage } from "@/lib/public-contracts";
import { getPublishedSaintSummariesByIds } from "@/lib/public-saints";
import { getPublicTraditionSummariesByIds } from "@/lib/public-traditions";
import { getPublicImageVariants } from "@/lib/responsive-images";
import {
  getHomeHeroContent,
  getHomeQuoteContent,
  type HomeHeroContent,
  type HomeQuoteContent
} from "@/lib/site-content";

export const HOME_PAGE_CONFIG_ID = "home";

export async function getPublicHomePageConfig() {
  return getPublicHomePageConfigCached();
}

const getPublicHomePageConfigCached = unstable_cache(async () => {
  const config = await db.homePageConfig.findUnique({
    where: { id: HOME_PAGE_CONFIG_ID },
    include: {
      bannerImage: true,
      featuredTraditionBannerImage: true,
      featuredTraditionPlacements: {
        include: { bannerImage: true },
        orderBy: { sortOrder: "asc" }
      },
      quoteSaint: {
        select: {
          displayName: true,
          slug: true,
          status: true
        }
      }
    }
  });
  const defaultHero = getHomeHeroContent();
  const defaultQuote = getHomeQuoteContent();

  if (!config) {
    return {
      hero: defaultHero,
      quote: defaultQuote,
      bannerImage: undefined,
      bannerFocalArea: getDefaultBannerFocalArea(),
      featuredTraditionBannerImage: undefined,
      featuredTraditionBannerFocalArea: getDefaultBannerFocalArea(),
      featuredSaints: [],
      featuredTraditions: [],
      featuredTraditionPlacements: []
    };
  }

  const placementRows = config.featuredTraditionPlacements.length > 0
    ? config.featuredTraditionPlacements
    : config.featuredTraditionIds.slice(0, 5).map((traditionId, index) => ({
        traditionId,
        bannerImage: index === 0 ? config.featuredTraditionBannerImage : null,
        focalX: index === 0 ? config.featuredTraditionBannerFocalX : 50,
        focalY: index === 0 ? config.featuredTraditionBannerFocalY : 50,
        focalWidth: index === 0 ? config.featuredTraditionBannerFocalWidth : 60,
        focalHeight: index === 0 ? config.featuredTraditionBannerFocalHeight : 60
      }));
  const [featuredSaints, placementResults] = await Promise.all([
    getPublishedSaintSummariesByIds(config.featuredSaintIds),
    Promise.all(placementRows.map(async (placement) => {
      const [tradition] = await getPublicTraditionSummariesByIds([placement.traditionId]);
      if (!tradition) return null;
      return {
        tradition,
        bannerImage: placement.bannerImage
          ? toPublicImage(placement.bannerImage, `${tradition.name} homepage banner`)
          : undefined,
        focalArea: {
          x: placement.focalX,
          y: placement.focalY,
          width: placement.focalWidth,
          height: placement.focalHeight
        }
      };
    }))
  ]);
  const featuredTraditionPlacements = placementResults.filter((placement): placement is NonNullable<typeof placement> => Boolean(placement));
  const featuredTraditions = featuredTraditionPlacements.map((placement) => placement.tradition);

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
    featuredTraditionBannerImage: config.featuredTraditionBannerImage
      ? toPublicImage(config.featuredTraditionBannerImage, "Featured tradition banner")
      : undefined,
    featuredTraditionBannerFocalArea: {
      x: config.featuredTraditionBannerFocalX,
      y: config.featuredTraditionBannerFocalY,
      width: config.featuredTraditionBannerFocalWidth,
      height: config.featuredTraditionBannerFocalHeight
    },
    featuredSaints,
    featuredTraditions,
    featuredTraditionPlacements
  };
}, ["public-home-page-config"], {
  revalidate: PUBLIC_DATA_CACHE_SECONDS,
  tags: [
    PUBLIC_CACHE_TAGS.home,
    PUBLIC_CACHE_TAGS.saints,
    PUBLIC_CACHE_TAGS.traditions
  ]
});

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
    quoteSaint: {
      displayName: string;
      slug: string;
      status: "draft" | "needs_review" | "published" | "archived";
    } | null;
  }
): HomeQuoteContent {
  const publishedQuoteSaint = config.quoteSaint?.status === "published"
    ? config.quoteSaint
    : null;

  return {
    eyebrow: config.quoteEyebrow || fallback.eyebrow,
    quote: config.quoteText || fallback.quote,
    attribution: publishedQuoteSaint?.displayName || config.quoteAttribution || fallback.attribution,
    attributionHref: publishedQuoteSaint
      ? `/saints/${publishedQuoteSaint.slug}` as `/saints/${string}`
      : undefined
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
    variants: unknown;
  },
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
