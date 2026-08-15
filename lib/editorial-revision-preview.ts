import { db } from "@/lib/db";
import {
  placeNarrativeRevisionSchema,
  saintNarrativeRevisionSchema,
  traditionNarrativeRevisionSchema,
  type PlaceNarrativeRevision,
  type SaintNarrativeRevision,
  type SourceRevision,
  type TraditionNarrativeRevision
} from "@/lib/editorial-revisions";
import type {
  PublicPlaceDetail,
  PublicSaintDetail,
  PublicSourceSummary,
  PublicTraditionDetail
} from "@/lib/public-contracts";
import { getPlacePreviewBaseById } from "@/lib/public-places";
import { getRelatedPublishedSaints, getSaintPreviewBaseById } from "@/lib/public-saints";
import { getTraditionPreviewBaseById } from "@/lib/public-traditions";

export type EditorialRevisionPreview =
  | {
      entityType: "saint";
      entityId: string;
      revisionId: string;
      revisionStatus: "draft" | "needs_review";
      title: string;
      backHref: `/admin/saints/${string}/biography`;
      content: PublicSaintDetail;
      relatedSaints: Awaited<ReturnType<typeof getRelatedPublishedSaints>>;
    }
  | {
      entityType: "tradition";
      entityId: string;
      revisionId: string;
      revisionStatus: "draft" | "needs_review";
      title: string;
      backHref: `/admin/traditions/${string}/content`;
      content: PublicTraditionDetail;
    }
  | {
      entityType: "place";
      entityId: string;
      revisionId: string;
      revisionStatus: "draft" | "needs_review";
      title: string;
      backHref: `/admin/places/${string}`;
      content: PublicPlaceDetail;
    };

export async function getEditorialRevisionPreview(revisionId: string): Promise<EditorialRevisionPreview | null> {
  const revision = await db.editorialRevision.findFirst({
    where: { id: revisionId, status: { in: ["draft", "needs_review"] } },
    select: { id: true, entityId: true, entityType: true, payload: true, status: true }
  });
  if (!revision || (revision.status !== "draft" && revision.status !== "needs_review")) return null;

  if (revision.entityType === "saint") {
    const parsed = saintNarrativeRevisionSchema.safeParse(revision.payload);
    const base = await getSaintPreviewBaseById(revision.entityId);
    if (!parsed.success || !base) return null;
    return {
      entityType: "saint",
      entityId: revision.entityId,
      revisionId: revision.id,
      revisionStatus: revision.status,
      title: base.displayName,
      backHref: `/admin/saints/${base.slug}/biography`,
      content: applySaintNarrativePreview(base, parsed.data),
      relatedSaints: await getRelatedPublishedSaints(base.slug)
    };
  }

  if (revision.entityType === "tradition") {
    const parsed = traditionNarrativeRevisionSchema.safeParse(revision.payload);
    const base = await getTraditionPreviewBaseById(revision.entityId);
    if (!parsed.success || !base) return null;
    return {
      entityType: "tradition",
      entityId: revision.entityId,
      revisionId: revision.id,
      revisionStatus: revision.status,
      title: base.name,
      backHref: `/admin/traditions/${base.slug}/content`,
      content: applyTraditionNarrativePreview(base, parsed.data)
    };
  }

  if (revision.entityType === "place") {
    const parsed = placeNarrativeRevisionSchema.safeParse(revision.payload);
    const base = await getPlacePreviewBaseById(revision.entityId);
    if (!parsed.success || !base) return null;
    return {
      entityType: "place",
      entityId: revision.entityId,
      revisionId: revision.id,
      revisionStatus: revision.status,
      title: base.name,
      backHref: `/admin/places/${base.slug}`,
      content: applyPlaceNarrativePreview(base, parsed.data)
    };
  }

  return null;
}

export function applySaintNarrativePreview(base: PublicSaintDetail, revision: SaintNarrativeRevision): PublicSaintDetail {
  const sources = revision.sources ? toPreviewSources(revision.sources) : base.sources;
  return {
    ...base,
    biography: {
      title: revision.biographyTitle,
      bodyMarkdown: revision.biographyMarkdown,
      sources
    },
    sources,
    furtherReading: sources
  };
}

export function applyTraditionNarrativePreview(base: PublicTraditionDetail, revision: TraditionNarrativeRevision): PublicTraditionDetail {
  const sources = toPreviewSources(revision.sources);
  return {
    ...base,
    shortDescription: revision.shortDescription ?? "",
    foundingAcharyaMarkdown: revision.foundingAcharyaMarkdown,
    historyMarkdown: revision.historyMarkdown,
    introductionMarkdown: revision.historyMarkdown,
    keyTeachingsMarkdown: revision.keyTeachingsMarkdown,
    sources,
    furtherReading: sources,
    seo: {
      ...base.seo,
      description: revision.shortDescription ?? base.seo?.description
    }
  };
}

export function applyPlaceNarrativePreview(base: PublicPlaceDetail, revision: PlaceNarrativeRevision): PublicPlaceDetail {
  return { ...base, overviewMarkdown: revision.overviewMarkdown };
}

export function toPreviewSources(sources: SourceRevision[]): PublicSourceSummary[] {
  return sources.map((source, index) => ({
    id: source.citationKey ?? source.sourceId ?? `preview-source-${index + 1}`,
    title: source.title,
    sourceType: source.sourceType,
    author: source.author,
    publisher: source.publisher,
    publicationYear: source.publicationYear === undefined ? undefined : String(source.publicationYear),
    url: source.url,
    note: source.note
  }));
}
