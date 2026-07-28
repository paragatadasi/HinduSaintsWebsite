import { db } from "@/lib/db";

export const feedbackEntityTypes = ["saint", "tradition", "place"] as const;

export type FeedbackEntityType = typeof feedbackEntityTypes[number];

export type FeedbackContext = {
  entityId?: string;
  entitySlug?: string;
  entityType: FeedbackEntityType | "page";
  pagePath: string;
  pageTitle?: string;
};

type FeedbackContextInput = {
  entityType?: string;
  entitySlug?: string;
  pagePath?: string;
};

export async function resolveFeedbackContext({
  entityType,
  entitySlug,
  pagePath
}: FeedbackContextInput): Promise<FeedbackContext | null> {
  const slug = normalizeSlug(entitySlug);

  if (entityType === "saint" && slug) {
    const saint = await db.saint.findFirst({
      where: { slug, status: "published" },
      select: { id: true, slug: true, displayName: true }
    });

    if (saint) {
      return {
        entityId: saint.id,
        entitySlug: saint.slug,
        entityType: "saint",
        pagePath: `/saints/${saint.slug}`,
        pageTitle: saint.displayName
      };
    }
  }

  if (entityType === "tradition" && slug) {
    const tradition = await db.tradition.findFirst({
      where: { slug, status: "published" },
      select: { id: true, slug: true, name: true }
    });

    if (tradition) {
      return {
        entityId: tradition.id,
        entitySlug: tradition.slug,
        entityType: "tradition",
        pagePath: `/traditions/${tradition.slug}`,
        pageTitle: tradition.name
      };
    }
  }

  if (entityType === "place" && slug) {
    const place = await db.place.findUnique({
      where: { slug },
      select: { id: true, slug: true, name: true }
    });

    if (place) {
      return {
        entityId: place.id,
        entitySlug: place.slug,
        entityType: "place",
        pagePath: `/places/${place.slug}`,
        pageTitle: place.name
      };
    }
  }

  const normalizedPath = normalizePublicPagePath(pagePath);
  return normalizedPath
    ? {
        entityType: "page",
        pagePath: normalizedPath
      }
    : null;
}

function normalizeSlug(value?: string) {
  const slug = value?.trim();
  if (!slug || slug.length > 200 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug)) return undefined;
  return slug;
}

function normalizePublicPagePath(value?: string) {
  const path = value?.trim();
  if (!path || path.length > 500 || !path.startsWith("/") || path.startsWith("//")) return undefined;

  const normalized = new URL(path, "https://hindu-saints.local").pathname;
  if (
    normalized.startsWith("/admin")
    || normalized.startsWith("/museumadmin")
    || normalized.startsWith("/api")
  ) {
    return undefined;
  }

  return normalized;
}
