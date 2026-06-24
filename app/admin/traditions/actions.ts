"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/lib/generated/prisma/client";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { toSlug } from "@/lib/slugs";

const contentStatusSchema = z.enum(["draft", "needs_review", "published", "archived"]);

const traditionEditorSchema = z.object({
  traditionId: z.string().cuid(),
  name: z.string().trim().min(1).max(200),
  alternateNames: z.array(z.string().trim().min(1).max(200)).max(100),
  parentTraditionId: z.string().cuid().optional(),
  founderSaintId: z.string().cuid().optional(),
  founderDisplayName: z.string().trim().max(200).optional(),
  origin: z.string().trim().max(200).optional(),
  eraLabel: z.string().trim().max(120).optional(),
  focus: z.string().trim().max(300).optional(),
  originPlaceId: z.string().cuid().optional(),
  originPlaceLabel: z.string().trim().max(200).optional(),
  shortDescription: z.string().trim().max(500).optional(),
  historyMarkdown: z.string().trim().max(20000).optional(),
  foundingAcharyaMarkdown: z.string().trim().max(20000).optional(),
  keyTeachingsMarkdown: z.string().trim().max(20000).optional(),
  status: contentStatusSchema,
  seoTitle: z.string().trim().max(120).optional(),
  seoDescription: z.string().trim().max(300).optional()
});

const traditionOverviewSchema = traditionEditorSchema.pick({
  traditionId: true,
  name: true,
  alternateNames: true,
  parentTraditionId: true,
  shortDescription: true,
  status: true
});

const traditionOtherPublicFieldsSchema = traditionEditorSchema.pick({
  traditionId: true,
  founderSaintId: true,
  founderDisplayName: true,
  origin: true,
  eraLabel: true,
  focus: true,
  originPlaceId: true,
  originPlaceLabel: true,
  historyMarkdown: true,
  foundingAcharyaMarkdown: true,
  keyTeachingsMarkdown: true,
  seoTitle: true,
  seoDescription: true
});

const mergeTraditionsSchema = z.object({
  sourceTraditionId: z.string().cuid(),
  targetTraditionId: z.string().cuid()
}).refine((value) => value.sourceTraditionId !== value.targetTraditionId, {
  message: "Choose two different traditions."
});

const traditionStatusSchema = z.object({
  traditionId: z.string().cuid(),
  status: z.enum(["needs_review", "published", "archived"])
});

const traditionLineageSchema = z.object({
  traditionId: z.string().cuid(),
  saints: z.array(z.object({
    saintId: z.string().cuid(),
    sortOrder: z.number().int().min(0).max(1000),
    roleLabel: z.string().trim().max(120).optional(),
    parentSaintId: z.string().cuid().optional()
  })).max(100)
});

const traditionRelatedLinksSchema = z.object({
  traditionId: z.string().cuid(),
  relatedTraditions: z.array(z.object({
    relatedTraditionId: z.string().cuid(),
    sortOrder: z.number().int().min(0).max(1000),
    label: z.string().trim().max(120).optional()
  })).max(100),
  relatedPlaces: z.array(z.object({
    placeId: z.string().cuid(),
    sortOrder: z.number().int().min(0).max(1000),
    label: z.string().trim().max(120).optional()
  })).max(100)
});

const traditionScripturalBasisSchema = z.object({
  traditionId: z.string().cuid(),
  items: z.array(z.object({
    title: z.string().trim().max(300).optional(),
    sourceId: z.string().cuid().optional(),
    url: z.string().trim().url().max(1000).optional(),
    note: z.string().trim().max(500).optional(),
    sortOrder: z.number().int().min(0).max(1000)
  })).max(50)
});

const traditionImageAttachmentSchema = z.object({
  traditionId: z.string().cuid(),
  mediaAssetId: z.string().cuid(),
  placement: z.enum(["gallery", "hero", "both"])
});

const traditionImageVisibilitySchema = z.object({
  traditionId: z.string().cuid(),
  mediaAssetId: z.string().cuid(),
  publicVisible: z.boolean()
});

const traditionHeroImageSchema = z.object({
  traditionId: z.string().cuid(),
  mediaAssetId: z.string().cuid().optional()
});

const traditionImageDeleteSchema = z.object({
  traditionId: z.string().cuid(),
  mediaAssetId: z.string().cuid()
});

export async function updateTradition(formData: FormData) {
  await requireAdminSession();

  const parsed = traditionEditorSchema.parse({
    traditionId: formData.get("traditionId"),
    name: formData.get("name"),
    alternateNames: parseList(formData.get("alternateNames")),
    parentTraditionId: emptyToUndefined(formData.get("parentTraditionId")),
    founderSaintId: emptyToUndefined(formData.get("founderSaintId")),
    founderDisplayName: emptyToUndefined(formData.get("founderDisplayName")),
    origin: emptyToUndefined(formData.get("origin")),
    eraLabel: emptyToUndefined(formData.get("eraLabel")),
    focus: emptyToUndefined(formData.get("focus")),
    originPlaceId: emptyToUndefined(formData.get("originPlaceId")),
    originPlaceLabel: emptyToUndefined(formData.get("originPlaceLabel")),
    shortDescription: emptyToUndefined(formData.get("shortDescription")),
    historyMarkdown: emptyToUndefined(formData.get("historyMarkdown")),
    foundingAcharyaMarkdown: emptyToUndefined(formData.get("foundingAcharyaMarkdown")),
    keyTeachingsMarkdown: emptyToUndefined(formData.get("keyTeachingsMarkdown")),
    status: formData.get("status"),
    seoTitle: emptyToUndefined(formData.get("seoTitle")),
    seoDescription: emptyToUndefined(formData.get("seoDescription"))
  });
  const now = new Date();
  const existing = await db.tradition.findUnique({
    where: { id: parsed.traditionId },
    select: { slug: true }
  });

  if (!existing) redirect("/admin/traditions");

  const slug = await getUniqueTraditionSlug(parsed.name, parsed.traditionId);
  const tradition = await db.tradition.update({
    where: { id: parsed.traditionId },
    data: {
      name: parsed.name,
      slug,
      alternateNames: parsed.alternateNames,
      parentTraditionId: parsed.parentTraditionId === parsed.traditionId ? null : parsed.parentTraditionId ?? null,
      founderSaintId: parsed.founderSaintId ?? null,
      founderDisplayName: parsed.founderDisplayName ?? null,
      origin: parsed.origin ?? null,
      eraLabel: parsed.eraLabel ?? null,
      focus: parsed.focus ?? null,
      originPlaceId: parsed.originPlaceId ?? null,
      originPlaceLabel: parsed.originPlaceLabel ?? null,
      shortDescription: parsed.shortDescription ?? null,
      historyMarkdown: parsed.historyMarkdown ?? null,
      longIntroductionMarkdown: parsed.historyMarkdown ?? null,
      foundingAcharyaMarkdown: parsed.foundingAcharyaMarkdown ?? null,
      keyTeachingsMarkdown: parsed.keyTeachingsMarkdown ?? null,
      status: parsed.status,
      seoTitle: parsed.seoTitle ?? null,
      seoDescription: parsed.seoDescription ?? null,
      publishedAt: parsed.status === "published" ? now : null
    },
    select: { slug: true }
  });

  revalidateTraditionPaths(existing.slug);
  revalidateTraditionPaths(tradition.slug);
  redirect(`/admin/traditions/${tradition.slug}`);
}

export async function updateTraditionOverview(formData: FormData) {
  await requireAdminSession();

  const parsed = traditionOverviewSchema.parse({
    traditionId: formData.get("traditionId"),
    name: formData.get("name"),
    alternateNames: parseList(formData.get("alternateNames")),
    parentTraditionId: emptyToUndefined(formData.get("parentTraditionId")),
    shortDescription: emptyToUndefined(formData.get("shortDescription")),
    status: formData.get("status")
  });
  const now = new Date();
  const existing = await db.tradition.findUnique({
    where: { id: parsed.traditionId },
    select: { slug: true }
  });

  if (!existing) redirect("/admin/traditions");

  const slug = await getUniqueTraditionSlug(parsed.name, parsed.traditionId);
  const tradition = await db.tradition.update({
    where: { id: parsed.traditionId },
    data: {
      name: parsed.name,
      slug,
      alternateNames: parsed.alternateNames,
      parentTraditionId: parsed.parentTraditionId === parsed.traditionId ? null : parsed.parentTraditionId ?? null,
      shortDescription: parsed.shortDescription ?? null,
      status: parsed.status,
      publishedAt: parsed.status === "published" ? now : null
    },
    select: { slug: true }
  });

  revalidateTraditionPaths(existing.slug);
  revalidateTraditionPaths(tradition.slug);
  redirect(`/admin/traditions/${tradition.slug}`);
}

export async function updateTraditionOtherPublicFields(formData: FormData) {
  await requireAdminSession();

  const parsed = traditionOtherPublicFieldsSchema.parse({
    traditionId: formData.get("traditionId"),
    founderSaintId: emptyToUndefined(formData.get("founderSaintId")),
    founderDisplayName: emptyToUndefined(formData.get("founderDisplayName")),
    origin: emptyToUndefined(formData.get("origin")),
    eraLabel: emptyToUndefined(formData.get("eraLabel")),
    focus: emptyToUndefined(formData.get("focus")),
    originPlaceId: emptyToUndefined(formData.get("originPlaceId")),
    originPlaceLabel: emptyToUndefined(formData.get("originPlaceLabel")),
    historyMarkdown: emptyToUndefined(formData.get("historyMarkdown")),
    foundingAcharyaMarkdown: emptyToUndefined(formData.get("foundingAcharyaMarkdown")),
    keyTeachingsMarkdown: emptyToUndefined(formData.get("keyTeachingsMarkdown")),
    seoTitle: emptyToUndefined(formData.get("seoTitle")),
    seoDescription: emptyToUndefined(formData.get("seoDescription"))
  });
  const tradition = await db.tradition.update({
    where: { id: parsed.traditionId },
    data: {
      founderSaintId: parsed.founderSaintId ?? null,
      founderDisplayName: parsed.founderDisplayName ?? null,
      origin: parsed.origin ?? null,
      eraLabel: parsed.eraLabel ?? null,
      focus: parsed.focus ?? null,
      originPlaceId: parsed.originPlaceId ?? null,
      originPlaceLabel: parsed.originPlaceLabel ?? null,
      historyMarkdown: parsed.historyMarkdown ?? null,
      longIntroductionMarkdown: parsed.historyMarkdown ?? null,
      foundingAcharyaMarkdown: parsed.foundingAcharyaMarkdown ?? null,
      keyTeachingsMarkdown: parsed.keyTeachingsMarkdown ?? null,
      seoTitle: parsed.seoTitle ?? null,
      seoDescription: parsed.seoDescription ?? null
    },
    select: { slug: true }
  });

  revalidateTraditionPaths(tradition.slug);
  redirect(`/admin/traditions/${tradition.slug}`);
}

export async function updateTraditionLineage(formData: FormData) {
  await requireAdminSession();

  const saintIds = formData.getAll("lineageSaintId");
  const roleLabels = formData.getAll("lineageRoleLabel");
  const parentSaintIds = formData.getAll("lineageParentSaintId");
  const sortOrders = formData.getAll("lineageSortOrder");
  const parsed = traditionLineageSchema.parse({
    traditionId: formData.get("traditionId"),
    saints: saintIds.flatMap((saintId, index) => {
      if (!isNonEmptyString(saintId)) return [];

      return [{
        saintId,
        sortOrder: parseOptionalInteger(sortOrders[index] ?? null) ?? index,
        roleLabel: emptyToUndefined(roleLabels[index] ?? null),
        parentSaintId: emptyToUndefined(parentSaintIds[index] ?? null)
      }];
    })
  });
  const tradition = await getTraditionSlug(parsed.traditionId);
  if (!tradition) redirect("/admin/traditions");

  const uniqueSaints = uniqueBy(parsed.saints, (saint) => saint.saintId)
    .map((saint) => ({
      ...saint,
      parentSaintId: saint.parentSaintId === saint.saintId ? undefined : saint.parentSaintId
    }));

  await db.$transaction(async (tx) => {
    await tx.traditionLineageSaint.deleteMany({ where: { traditionId: parsed.traditionId } });

    if (uniqueSaints.length > 0) {
      await tx.traditionLineageSaint.createMany({
        data: uniqueSaints.map((saint) => ({
          traditionId: parsed.traditionId,
          saintId: saint.saintId,
          sortOrder: saint.sortOrder,
          roleLabel: saint.roleLabel ?? null,
          parentSaintId: saint.parentSaintId ?? null
        }))
      });
    }
  });

  revalidateTraditionPaths(tradition.slug);
  redirect(`/admin/traditions/${tradition.slug}`);
}

export async function updateTraditionRelatedLinks(formData: FormData) {
  await requireAdminSession();

  const relatedTraditionIds = formData.getAll("relatedTraditionId");
  const relatedPlaceIds = formData.getAll("relatedPlaceId");
  const relatedTraditionLabels = formData.getAll("relatedTraditionLabel");
  const relatedTraditionSortOrders = formData.getAll("relatedTraditionSortOrder");
  const relatedPlaceLabels = formData.getAll("relatedPlaceLabel");
  const relatedPlaceSortOrders = formData.getAll("relatedPlaceSortOrder");
  const parsed = traditionRelatedLinksSchema.parse({
    traditionId: formData.get("traditionId"),
    relatedTraditions: relatedTraditionIds.flatMap((relatedTraditionId, index) => {
      if (!isNonEmptyString(relatedTraditionId)) return [];

      return [{
        relatedTraditionId,
        sortOrder: parseOptionalInteger(relatedTraditionSortOrders[index] ?? null) ?? index,
        label: emptyToUndefined(relatedTraditionLabels[index] ?? null)
      }];
    }),
    relatedPlaces: relatedPlaceIds.flatMap((placeId, index) => {
      if (!isNonEmptyString(placeId)) return [];

      return [{
        placeId,
        sortOrder: parseOptionalInteger(relatedPlaceSortOrders[index] ?? null) ?? index,
        label: emptyToUndefined(relatedPlaceLabels[index] ?? null)
      }];
    })
  });
  const tradition = await getTraditionSlug(parsed.traditionId);
  if (!tradition) redirect("/admin/traditions");

  const relatedTraditions = uniqueBy(
    parsed.relatedTraditions.filter((link) => link.relatedTraditionId !== parsed.traditionId),
    (link) => link.relatedTraditionId
  );
  const relatedPlaces = uniqueBy(parsed.relatedPlaces, (link) => link.placeId);

  await db.$transaction(async (tx) => {
    await tx.traditionRelatedTradition.deleteMany({ where: { traditionId: parsed.traditionId } });
    await tx.traditionRelatedPlace.deleteMany({ where: { traditionId: parsed.traditionId } });

    if (relatedTraditions.length > 0) {
      await tx.traditionRelatedTradition.createMany({
        data: relatedTraditions.map((link) => ({
          traditionId: parsed.traditionId,
          relatedTraditionId: link.relatedTraditionId,
          sortOrder: link.sortOrder,
          label: link.label ?? null
        }))
      });
    }

    if (relatedPlaces.length > 0) {
      await tx.traditionRelatedPlace.createMany({
        data: relatedPlaces.map((link) => ({
          traditionId: parsed.traditionId,
          placeId: link.placeId,
          sortOrder: link.sortOrder,
          label: link.label ?? null
        }))
      });
    }
  });

  revalidateTraditionPaths(tradition.slug);
  redirect(`/admin/traditions/${tradition.slug}`);
}

export async function updateTraditionScripturalBasis(formData: FormData) {
  await requireAdminSession();

  const sourceIds = formData.getAll("scripturalBasisSourceId");
  const titles = formData.getAll("scripturalBasisTitle");
  const urls = formData.getAll("scripturalBasisUrl");
  const notes = formData.getAll("scripturalBasisNote");
  const sortOrders = formData.getAll("scripturalBasisSortOrder");
  const parsed = traditionScripturalBasisSchema.parse({
    traditionId: formData.get("traditionId"),
    items: titles.flatMap((titleValue, index) => {
      const title = emptyToUndefined(titleValue);
      const sourceId = emptyToUndefined(sourceIds[index] ?? null);
      const url = emptyToUndefined(urls[index] ?? null);
      const note = emptyToUndefined(notes[index] ?? null);

      if (!title && !sourceId && !url && !note) return [];

      return [{
        title,
        sourceId,
        url,
        note,
        sortOrder: parseOptionalInteger(sortOrders[index] ?? null) ?? index
      }];
    })
  });
  const tradition = await getTraditionSlug(parsed.traditionId);
  if (!tradition) redirect("/admin/traditions");

  const sourceIdsToResolve = Array.from(new Set(parsed.items.map((item) => item.sourceId).filter((sourceId): sourceId is string => Boolean(sourceId))));
  const sources = sourceIdsToResolve.length > 0
    ? await db.source.findMany({
        where: { id: { in: sourceIdsToResolve } },
        select: { id: true, title: true, url: true }
      })
    : [];
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const items = parsed.items
    .flatMap((item) => {
      const source = item.sourceId ? sourceById.get(item.sourceId) : undefined;
      const title = item.title ?? source?.title;
      if (!title) return [];

      return [{
        ...item,
        title,
        url: item.url ?? source?.url ?? undefined
      }];
    });

  await db.$transaction(async (tx) => {
    await tx.traditionScripturalBasis.deleteMany({ where: { traditionId: parsed.traditionId } });

    if (items.length > 0) {
      await tx.traditionScripturalBasis.createMany({
        data: items.map((item) => ({
          traditionId: parsed.traditionId,
          title: item.title,
          sourceId: item.sourceId ?? null,
          url: item.url ?? null,
          note: item.note ?? null,
          sortOrder: item.sortOrder
        }))
      });
    }
  });

  revalidateTraditionPaths(tradition.slug);
  redirect(`/admin/traditions/${tradition.slug}`);
}

export async function updateTraditionReviewStatus(formData: FormData) {
  await requireAdminSession();

  const parsed = traditionStatusSchema.parse({
    traditionId: formData.get("traditionId"),
    status: formData.get("status")
  });
  const now = new Date();
  const tradition = await db.tradition.update({
    where: { id: parsed.traditionId },
    data: {
      status: parsed.status,
      publishedAt: parsed.status === "published" ? now : null
    },
    select: { slug: true }
  });

  revalidateTraditionPaths(tradition.slug);
  redirect(`/admin/traditions/${tradition.slug}`);
}

export async function mergeTraditions(formData: FormData) {
  await requireAdminSession();

  const parsed = mergeTraditionsSchema.parse({
    sourceTraditionId: formData.get("sourceTraditionId"),
    targetTraditionId: formData.get("targetTraditionId")
  });
  const [source, target] = await Promise.all([
    db.tradition.findUnique({
      where: { id: parsed.sourceTraditionId },
      include: { saints: true }
    }),
    db.tradition.findUnique({
      where: { id: parsed.targetTraditionId },
      include: { saints: true }
    })
  ]);

  if (!source || !target) redirect("/admin/traditions");

  await db.$transaction(async (tx) => {
    const targetLinksBySaintId = new Map(target.saints.map((link) => [link.saintId, link]));

    for (const sourceLink of source.saints) {
      const targetLink = targetLinksBySaintId.get(sourceLink.saintId);

      if (targetLink) {
        await tx.saintTradition.update({
          where: { id: targetLink.id },
          data: {
            isPrimary: targetLink.isPrimary || sourceLink.isPrimary,
            notes: combineNotes(targetLink.notes, sourceLink.notes)
          }
        });
        continue;
      }

      await tx.saintTradition.update({
        where: { id: sourceLink.id },
        data: { traditionId: target.id }
      });
    }

    await tx.contentSource.updateMany({
      where: { entityType: "Tradition", entityId: source.id },
      data: { entityId: target.id }
    });
    await tx.tradition.updateMany({
      where: { parentTraditionId: source.id },
      data: { parentTraditionId: target.id }
    });
    await tx.traditionRelatedTradition.updateMany({
      where: { relatedTraditionId: source.id },
      data: { relatedTraditionId: target.id }
    });
    await tx.traditionScripturalBasis.updateMany({
      where: { traditionId: source.id },
      data: { traditionId: target.id }
    });

    const targetLineage = await tx.traditionLineageSaint.findMany({
      where: { traditionId: target.id },
      select: { id: true, saintId: true, roleLabel: true, parentSaintId: true }
    });
    const targetLineageBySaintId = new Map(targetLineage.map((link) => [link.saintId, link]));
    const sourceLineage = await tx.traditionLineageSaint.findMany({
      where: { traditionId: source.id },
      orderBy: { sortOrder: "asc" }
    });
    const nextLineageSortOrder = await tx.traditionLineageSaint.count({
      where: { traditionId: target.id }
    });

    for (const [index, sourceLink] of sourceLineage.entries()) {
      const targetLink = targetLineageBySaintId.get(sourceLink.saintId);

      if (targetLink) {
        await tx.traditionLineageSaint.update({
          where: { id: targetLink.id },
          data: {
            roleLabel: targetLink.roleLabel ?? sourceLink.roleLabel,
            parentSaintId: targetLink.parentSaintId ?? sourceLink.parentSaintId
          }
        });
        continue;
      }

      await tx.traditionLineageSaint.update({
        where: { id: sourceLink.id },
        data: {
          traditionId: target.id,
          sortOrder: nextLineageSortOrder + index
        }
      });
    }

    await tx.tradition.delete({ where: { id: source.id } });
  });

  revalidateTraditionPaths(source.slug);
  revalidateTraditionPaths(target.slug);
  redirect(`/admin/traditions/${target.slug}`);
}

export async function attachImageToTradition(input: z.input<typeof traditionImageAttachmentSchema>) {
  await requireAdminSession();

  const parsed = traditionImageAttachmentSchema.parse(input);
  const tradition = await db.tradition.findUnique({
    where: { id: parsed.traditionId },
    select: {
      id: true,
      slug: true,
      _count: { select: { galleryImages: true } }
    }
  });
  const mediaAsset = await db.mediaAsset.findUnique({
    where: { id: parsed.mediaAssetId },
    select: { id: true }
  });

  if (!tradition || !mediaAsset) {
    throw new Error("Tradition or media asset was not found.");
  }

  await db.$transaction(async (tx) => {
    if (parsed.placement === "hero" || parsed.placement === "both") {
      await tx.tradition.update({
        where: { id: parsed.traditionId },
        data: { heroImageId: parsed.mediaAssetId }
      });
    }

    if (parsed.placement === "gallery" || parsed.placement === "both") {
      const existing = await tx.traditionGalleryImage.findFirst({
        where: {
          traditionId: parsed.traditionId,
          mediaAssetId: parsed.mediaAssetId
        },
        select: { id: true }
      });

      if (!existing) {
        await tx.traditionGalleryImage.create({
          data: {
            traditionId: parsed.traditionId,
            mediaAssetId: parsed.mediaAssetId,
            sortOrder: tradition._count.galleryImages,
            publicVisible: true
          }
        });
      } else {
        await setTraditionGalleryImageVisibility(tx, parsed.traditionId, parsed.mediaAssetId, true);
      }
    }
  });

  revalidateTraditionPaths(tradition.slug);
}

export async function updateTraditionHeroImage(formData: FormData) {
  await requireAdminSession();

  const parsed = traditionHeroImageSchema.parse({
    traditionId: formData.get("traditionId"),
    mediaAssetId: emptyToUndefined(formData.get("mediaAssetId"))
  });
  const tradition = await db.tradition.update({
    where: { id: parsed.traditionId },
    data: { heroImageId: parsed.mediaAssetId ?? null },
    select: { slug: true }
  });

  revalidateTraditionPaths(tradition.slug);
  redirect(`/admin/traditions/${tradition.slug}`);
}

export async function updateTraditionImageVisibility(input: z.input<typeof traditionImageVisibilitySchema>) {
  await requireAdminSession();

  const parsed = traditionImageVisibilitySchema.parse(input);
  const tradition = await db.tradition.findUnique({
    where: { id: parsed.traditionId },
    select: {
      id: true,
      slug: true,
      heroImageId: true,
      _count: { select: { galleryImages: true } }
    }
  });

  if (!tradition) throw new Error("Tradition was not found.");

  await db.$transaction(async (tx) => {
    if (!parsed.publicVisible && tradition.heroImageId === parsed.mediaAssetId) {
      await tx.tradition.update({
        where: { id: parsed.traditionId },
        data: { heroImageId: null }
      });
    }

    const existing = await tx.traditionGalleryImage.findFirst({
      where: {
        traditionId: parsed.traditionId,
        mediaAssetId: parsed.mediaAssetId
      },
      select: { id: true }
    });

    if (existing) {
      await setTraditionGalleryImageVisibility(tx, parsed.traditionId, parsed.mediaAssetId, parsed.publicVisible);
      return;
    }

    await tx.traditionGalleryImage.create({
      data: {
        traditionId: parsed.traditionId,
        mediaAssetId: parsed.mediaAssetId,
        sortOrder: tradition._count.galleryImages,
        publicVisible: parsed.publicVisible
      }
    });
  });

  revalidateTraditionPaths(tradition.slug);
}

export async function deleteTraditionImage(input: z.input<typeof traditionImageDeleteSchema>) {
  await requireAdminSession();

  const parsed = traditionImageDeleteSchema.parse(input);
  const tradition = await db.tradition.findUnique({
    where: { id: parsed.traditionId },
    select: { id: true, slug: true, heroImageId: true }
  });

  if (!tradition) throw new Error("Tradition was not found.");

  await db.$transaction(async (tx) => {
    if (tradition.heroImageId === parsed.mediaAssetId) {
      await tx.tradition.update({
        where: { id: parsed.traditionId },
        data: { heroImageId: null }
      });
    }

    await tx.traditionGalleryImage.deleteMany({
      where: {
        traditionId: parsed.traditionId,
        mediaAssetId: parsed.mediaAssetId
      }
    });

    const references = await tx.mediaAsset.findUnique({
      where: { id: parsed.mediaAssetId },
      select: {
        _count: {
          select: {
            primaryForSaints: true,
            heroForTraditions: true,
            saintGalleryImages: true,
            traditionGalleryImages: true
          }
        }
      }
    });

    if (
      references
      && references._count.primaryForSaints === 0
      && references._count.heroForTraditions === 0
      && references._count.saintGalleryImages === 0
      && references._count.traditionGalleryImages === 0
    ) {
      await tx.mediaAsset.delete({ where: { id: parsed.mediaAssetId } });
    }
  });

  revalidateTraditionPaths(tradition.slug);
}

async function setTraditionGalleryImageVisibility(
  tx: Prisma.TransactionClient,
  traditionId: string,
  mediaAssetId: string,
  publicVisible: boolean
) {
  await tx.traditionGalleryImage.updateMany({
    where: { traditionId, mediaAssetId },
    data: { publicVisible }
  });
}

async function requireAdminSession() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/admin");
  }
}

function emptyToUndefined(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function isNonEmptyString(value: FormDataEntryValue): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseList(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return [];
  return Array.from(new Set(value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean)));
}

function uniqueBy<T>(values: T[], getKey: (value: T) => string) {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const value of values) {
    const key = getKey(value);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }

  return result;
}

function parseOptionalInteger(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function combineNotes(first: string | null, second: string | null) {
  return [first, second].filter(Boolean).join("\n\n") || null;
}

async function getUniqueTraditionSlug(name: string, traditionId: string) {
  const baseSlug = toSlug(name) || "tradition";
  let candidate = baseSlug;
  let suffix = 2;

  while (await db.tradition.findFirst({ where: { slug: candidate, NOT: { id: traditionId } }, select: { id: true } })) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

async function getTraditionSlug(traditionId: string) {
  return db.tradition.findUnique({
    where: { id: traditionId },
    select: { slug: true }
  });
}

function revalidateTraditionPaths(slug: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/traditions");
  revalidatePath("/traditions");
  revalidatePath(`/traditions/${slug}`);
}
