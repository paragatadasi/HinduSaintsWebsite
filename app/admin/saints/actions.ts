"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseImportedDate } from "@/lib/import-dates";
import { acceptSaintInstagramClaim } from "@/lib/instagram-claims";
import { toSlug } from "@/lib/slugs";

const contentStatusSchema = z.enum(["draft", "needs_review", "published", "hidden", "archived"]);
const placeTypeSchema = z.enum(["primary", "birth", "samadhi", "sadhana", "associated", "other"]);
const sourceTypeSchema = z.enum(["book", "article", "website", "scripture", "oral_tradition", "other"]);

const saintBasicsSchema = z.object({
  saintId: z.string().cuid(),
  displayName: z.string().trim().min(1).max(200),
  canonicalName: z.string().trim().min(1).max(200),
  shortDescription: z.string().trim().max(500).optional(),
  biographySummary: z.string().trim().max(8000).optional(),
  eraLabel: z.string().trim().max(120).optional(),
  birthDateRaw: z.string().trim().max(120).optional(),
  samadhiDateRaw: z.string().trim().max(120).optional(),
  dateNotes: z.string().trim().max(1000).optional(),
  seoTitle: z.string().trim().max(120).optional(),
  seoDescription: z.string().trim().max(300).optional()
});

const saintStatusSchema = z.object({
  saintId: z.string().cuid(),
  status: contentStatusSchema
});

const bulkSaintStatusSchema = z.object({
  saintIds: z.array(z.string().cuid()).min(1).max(500),
  status: contentStatusSchema,
  returnTo: z.string().startsWith("/admin/saints").optional()
});

const instagramClaimReviewSchema = z.object({
  claimId: z.string().cuid(),
  saintId: z.string().cuid(),
  intent: z.enum(["accept", "ignore"])
});

const saintImageAttachmentSchema = z.object({
  saintId: z.string().cuid(),
  mediaAssetId: z.string().cuid(),
  placement: z.enum(["gallery", "primary", "both"])
});

const saintAliasesSchema = z.object({
  saintId: z.string().cuid(),
  aliases: z.array(z.string().trim().min(1).max(200)).max(100)
});

const saintTraditionsSchema = z.object({
  saintId: z.string().cuid(),
  traditionIds: z.array(z.string().cuid()).max(100),
  primaryTraditionId: z.string().cuid().optional()
});

const saintPlacesSchema = z.object({
  saintId: z.string().cuid(),
  places: z.array(z.object({
    placeId: z.string().cuid(),
    placeType: placeTypeSchema,
    routeOrder: z.number().int().optional(),
    routeLabel: z.string().trim().max(120).optional()
  })).max(100)
});

const saintBiographySchema = z.object({
  biographyId: z.string().cuid().optional(),
  saintId: z.string().cuid(),
  title: z.string().trim().min(1).max(200),
  bodyMarkdown: z.string().trim().min(1).max(20000),
  status: contentStatusSchema
});

const saintSourceSchema = z.object({
  contentSourceId: z.string().cuid().optional(),
  saintId: z.string().cuid(),
  sourceId: z.string().cuid().optional(),
  title: z.string().trim().min(1).max(300),
  sourceType: sourceTypeSchema,
  author: z.string().trim().max(200).optional(),
  publisher: z.string().trim().max(200).optional(),
  publicationYear: z.number().int().min(0).max(3000).optional(),
  url: z.string().trim().url().max(1000).optional(),
  note: z.string().trim().max(1000).optional(),
  sortOrder: z.number().int().min(0).max(1000).optional()
});

const saintSourceRemovalSchema = z.object({
  contentSourceId: z.string().cuid(),
  saintId: z.string().cuid()
});

export async function updateSaintBasics(formData: FormData) {
  await requireAdminSession();

  const parsed = saintBasicsSchema.parse({
    saintId: formData.get("saintId"),
    displayName: formData.get("displayName"),
    canonicalName: formData.get("canonicalName"),
    shortDescription: emptyToUndefined(formData.get("shortDescription")),
    biographySummary: emptyToUndefined(formData.get("biographySummary")),
    eraLabel: emptyToUndefined(formData.get("eraLabel")),
    birthDateRaw: emptyToUndefined(formData.get("birthDateRaw")),
    samadhiDateRaw: emptyToUndefined(formData.get("samadhiDateRaw")),
    dateNotes: emptyToUndefined(formData.get("dateNotes")),
    seoTitle: emptyToUndefined(formData.get("seoTitle")),
    seoDescription: emptyToUndefined(formData.get("seoDescription"))
  });
  const birthDate = parsed.birthDateRaw ? parseImportedDate(parsed.birthDateRaw) : null;
  const samadhiDate = parsed.samadhiDateRaw ? parseImportedDate(parsed.samadhiDateRaw) : null;

  const saint = await db.saint.update({
    where: { id: parsed.saintId },
    data: {
      displayName: parsed.displayName,
      canonicalName: parsed.canonicalName,
      shortDescription: parsed.shortDescription ?? null,
      biographySummary: parsed.biographySummary ?? null,
      eraLabel: parsed.eraLabel ?? null,
      birthDateRaw: parsed.birthDateRaw ?? null,
      birthYear: birthDate?.year ?? null,
      birthMonth: birthDate?.month ?? null,
      birthDay: birthDate?.day ?? null,
      birthDatePrecision: birthDate?.precision ?? null,
      samadhiDateRaw: parsed.samadhiDateRaw ?? null,
      samadhiYear: samadhiDate?.year ?? null,
      samadhiMonth: samadhiDate?.month ?? null,
      samadhiDay: samadhiDate?.day ?? null,
      samadhiDatePrecision: samadhiDate?.precision ?? null,
      dateNotes: parsed.dateNotes ?? null,
      seoTitle: parsed.seoTitle ?? null,
      seoDescription: parsed.seoDescription ?? null
    },
    select: { slug: true }
  });

  revalidateSaintPaths(saint.slug);
  redirect(`/admin/saints/${saint.slug}`);
}

export async function updateSaintAliases(formData: FormData) {
  await requireAdminSession();

  const parsed = saintAliasesSchema.parse({
    saintId: formData.get("saintId"),
    aliases: parseList(formData.get("aliases"))
  });
  const saint = await db.saint.findUnique({
    where: { id: parsed.saintId },
    select: {
      slug: true,
      aliases: { select: { alias: true, aliasType: true, source: true } }
    }
  });

  if (!saint) redirect("/admin/saints");

  const existingAliasMeta = new Map(saint.aliases.map((alias) => [normalizeListValue(alias.alias), alias]));
  const aliases = uniqueList(parsed.aliases);

  await db.$transaction(async (tx) => {
    await tx.saintAlias.deleteMany({ where: { saintId: parsed.saintId } });

    if (aliases.length > 0) {
      await tx.saintAlias.createMany({
        data: aliases.map((alias) => {
          const existing = existingAliasMeta.get(normalizeListValue(alias));
          return {
            saintId: parsed.saintId,
            alias,
            aliasType: existing?.aliasType ?? "other",
            source: existing?.source
          };
        })
      });
    }
  });

  revalidateSaintPaths(saint.slug);
  redirect(`/admin/saints/${saint.slug}`);
}

export async function updateSaintTraditions(formData: FormData) {
  await requireAdminSession();

  const parsed = saintTraditionsSchema.parse({
    saintId: formData.get("saintId"),
    traditionIds: uniqueList(formData.getAll("traditionIds").filter(isString)),
    primaryTraditionId: emptyToUndefined(formData.get("primaryTraditionId"))
  });
  const saint = await db.saint.findUnique({
    where: { id: parsed.saintId },
    select: { slug: true }
  });

  if (!saint) redirect("/admin/saints");

  const primaryTraditionId = parsed.primaryTraditionId && parsed.traditionIds.includes(parsed.primaryTraditionId)
    ? parsed.primaryTraditionId
    : parsed.traditionIds[0];

  await db.$transaction(async (tx) => {
    await tx.saintTradition.deleteMany({ where: { saintId: parsed.saintId } });

    if (parsed.traditionIds.length > 0) {
      await tx.saintTradition.createMany({
        data: parsed.traditionIds.map((traditionId) => ({
          saintId: parsed.saintId,
          traditionId,
          isPrimary: traditionId === primaryTraditionId
        }))
      });
    }
  });

  revalidateSaintPaths(saint.slug);
  redirect(`/admin/saints/${saint.slug}`);
}

export async function updateSaintPlaces(formData: FormData) {
  await requireAdminSession();

  const placeIds = uniqueList(formData.getAll("placeIds").filter(isString));
  const parsed = saintPlacesSchema.parse({
    saintId: formData.get("saintId"),
    places: placeIds.map((placeId) => ({
      placeId,
      placeType: formData.get(`placeType:${placeId}`) ?? "associated",
      routeOrder: parseOptionalInteger(formData.get(`routeOrder:${placeId}`)),
      routeLabel: emptyToUndefined(formData.get(`routeLabel:${placeId}`))
    }))
  });
  const saint = await db.saint.findUnique({
    where: { id: parsed.saintId },
    select: { slug: true }
  });

  if (!saint) redirect("/admin/saints");

  await db.$transaction(async (tx) => {
    await tx.saintPlace.deleteMany({ where: { saintId: parsed.saintId } });

    if (parsed.places.length > 0) {
      await tx.saintPlace.createMany({
        data: parsed.places.map((place) => ({
          saintId: parsed.saintId,
          placeId: place.placeId,
          placeType: place.placeType,
          routeOrder: place.routeOrder,
          routeLabel: place.routeLabel
        }))
      });
    }
  });

  revalidateSaintPaths(saint.slug);
  redirect(`/admin/saints/${saint.slug}`);
}

export async function upsertSaintBiography(formData: FormData) {
  await requireAdminSession();

  const parsed = saintBiographySchema.parse({
    biographyId: emptyToUndefined(formData.get("biographyId")),
    saintId: formData.get("saintId"),
    title: formData.get("title"),
    bodyMarkdown: formData.get("bodyMarkdown"),
    status: formData.get("status")
  });
  const saint = await db.saint.findUnique({
    where: { id: parsed.saintId },
    select: { slug: true }
  });
  const now = new Date();

  if (!saint) redirect("/admin/saints");

  if (parsed.biographyId) {
    await db.biography.update({
      where: { id: parsed.biographyId },
      data: {
        title: parsed.title,
        bodyMarkdown: parsed.bodyMarkdown,
        status: parsed.status,
        publishedAt: parsed.status === "published" ? now : null,
        lastReviewedAt: parsed.status === "published" ? now : null
      }
    });
  } else {
    await db.biography.create({
      data: {
        saintId: parsed.saintId,
        title: parsed.title,
        slug: await getUniqueBiographySlug(parsed.saintId, parsed.title),
        bodyMarkdown: parsed.bodyMarkdown,
        status: parsed.status,
        publishedAt: parsed.status === "published" ? now : null,
        lastReviewedAt: parsed.status === "published" ? now : null
      }
    });
  }

  revalidateSaintPaths(saint.slug);
  redirect(`/admin/saints/${saint.slug}`);
}

export async function upsertSaintSource(formData: FormData) {
  await requireAdminSession();

  const parsed = saintSourceSchema.parse({
    contentSourceId: emptyToUndefined(formData.get("contentSourceId")),
    saintId: formData.get("saintId"),
    sourceId: emptyToUndefined(formData.get("sourceId")),
    title: formData.get("title"),
    sourceType: formData.get("sourceType"),
    author: emptyToUndefined(formData.get("author")),
    publisher: emptyToUndefined(formData.get("publisher")),
    publicationYear: parseOptionalInteger(formData.get("publicationYear")),
    url: emptyToUndefined(formData.get("url")),
    note: emptyToUndefined(formData.get("note")),
    sortOrder: parseOptionalInteger(formData.get("sortOrder"))
  });
  const saint = await db.saint.findUnique({
    where: { id: parsed.saintId },
    select: { slug: true }
  });

  if (!saint) redirect("/admin/saints");

  await db.$transaction(async (tx) => {
    const source = parsed.sourceId
      ? await tx.source.update({
          where: { id: parsed.sourceId },
          data: {
            title: parsed.title,
            sourceType: parsed.sourceType,
            author: parsed.author ?? null,
            publisher: parsed.publisher ?? null,
            publicationYear: parsed.publicationYear ?? null,
            url: parsed.url ?? null,
            notes: parsed.note ?? null
          },
          select: { id: true }
        })
      : await tx.source.create({
          data: {
            title: parsed.title,
            sourceType: parsed.sourceType,
            author: parsed.author ?? null,
            publisher: parsed.publisher ?? null,
            publicationYear: parsed.publicationYear ?? null,
            url: parsed.url ?? null,
            notes: parsed.note ?? null
          },
          select: { id: true }
        });

    if (parsed.contentSourceId) {
      await tx.contentSource.update({
        where: { id: parsed.contentSourceId },
        data: {
          sourceId: source.id,
          notes: parsed.note ?? null,
          sortOrder: parsed.sortOrder ?? 0
        }
      });
    } else {
      await tx.contentSource.create({
        data: {
          entityType: "Saint",
          entityId: parsed.saintId,
          sourceId: source.id,
          notes: parsed.note ?? null,
          sortOrder: parsed.sortOrder ?? 0
        }
      });
    }
  });

  revalidateSaintPaths(saint.slug);
  redirect(`/admin/saints/${saint.slug}`);
}

export async function removeSaintSource(formData: FormData) {
  await requireAdminSession();

  const parsed = saintSourceRemovalSchema.parse({
    contentSourceId: formData.get("contentSourceId"),
    saintId: formData.get("saintId")
  });
  const saint = await db.saint.findUnique({
    where: { id: parsed.saintId },
    select: { slug: true }
  });

  if (!saint) redirect("/admin/saints");

  await db.contentSource.deleteMany({
    where: {
      id: parsed.contentSourceId,
      entityType: "Saint",
      entityId: parsed.saintId
    }
  });

  revalidateSaintPaths(saint.slug);
  redirect(`/admin/saints/${saint.slug}`);
}

export async function updateSaintReviewStatus(formData: FormData) {
  await requireAdminSession();

  const parsed = saintStatusSchema.parse({
    saintId: formData.get("saintId"),
    status: formData.get("status")
  });
  const now = new Date();
  const saint = await db.saint.update({
    where: { id: parsed.saintId },
    data: {
      status: parsed.status,
      reviewedAt: parsed.status === "needs_review" ? null : now,
      publishedAt: parsed.status === "published" ? now : null
    },
    select: { slug: true }
  });

  revalidateSaintPaths(saint.slug);
  redirect(`/admin/saints/${saint.slug}`);
}

export async function bulkUpdateSaintReviewStatus(formData: FormData) {
  await requireAdminSession();

  const parsed = bulkSaintStatusSchema.parse({
    saintIds: formData.getAll("saintIds"),
    status: formData.get("status"),
    returnTo: emptyToUndefined(formData.get("returnTo"))
  });
  const now = new Date();
  const saints = await db.saint.findMany({
    where: { id: { in: parsed.saintIds } },
    select: { id: true, slug: true }
  });

  await db.saint.updateMany({
    where: { id: { in: saints.map((saint) => saint.id) } },
    data: {
      status: parsed.status,
      reviewedAt: parsed.status === "needs_review" ? null : now,
      publishedAt: parsed.status === "published" ? now : null
    }
  });

  const destination = (parsed.returnTo ?? "/admin/saints") as Route;
  saints.forEach((saint) => revalidateSaintPaths(saint.slug));
  revalidatePath(destination);
  redirect(destination);
}

export async function reviewSaintInstagramClaim(formData: FormData) {
  await requireAdminSession();

  const parsed = instagramClaimReviewSchema.parse({
    claimId: formData.get("claimId"),
    saintId: formData.get("saintId"),
    intent: formData.get("intent")
  });

  const saint = await db.$transaction(async (tx) => {
    if (parsed.intent === "accept") {
      await acceptSaintInstagramClaim(tx, parsed.claimId, parsed.saintId);
    } else {
      await tx.instagramDerivedClaim.update({
        where: { id: parsed.claimId },
        data: { status: "ignored" }
      });
    }

    return tx.saint.findUnique({
      where: { id: parsed.saintId },
      select: { slug: true }
    });
  });

  if (!saint) redirect("/admin/saints");

  revalidateSaintPaths(saint.slug);
  redirect(`/admin/saints/${saint.slug}` as Route);
}

export async function attachImageToSaint(input: z.input<typeof saintImageAttachmentSchema>) {
  await requireAdminSession();

  const parsed = saintImageAttachmentSchema.parse(input);
  const saint = await db.saint.findUnique({
    where: { id: parsed.saintId },
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

  if (!saint || !mediaAsset) {
    throw new Error("Saint or media asset was not found.");
  }

  await db.$transaction(async (tx) => {
    if (parsed.placement === "primary" || parsed.placement === "both") {
      await tx.saint.update({
        where: { id: parsed.saintId },
        data: { primaryImageId: parsed.mediaAssetId }
      });
    }

    if (parsed.placement === "gallery" || parsed.placement === "both") {
      const existing = await tx.saintGalleryImage.findFirst({
        where: {
          saintId: parsed.saintId,
          mediaAssetId: parsed.mediaAssetId
        },
        select: { id: true }
      });

      if (!existing) {
        await tx.saintGalleryImage.create({
          data: {
            saintId: parsed.saintId,
            mediaAssetId: parsed.mediaAssetId,
            sortOrder: saint._count.galleryImages
          }
        });
      }
    }
  });

  revalidateSaintPaths(saint.slug);
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

function isString(value: FormDataEntryValue): value is string {
  return typeof value === "string";
}

function parseList(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return [];
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueList(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = normalizeListValue(value);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(value);
  }

  return result;
}

function normalizeListValue(value: string) {
  return value.trim().toLowerCase();
}

function parseOptionalInteger(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

async function getUniqueBiographySlug(saintId: string, title: string) {
  const baseSlug = toSlug(title) || "biography";
  let candidate = baseSlug;
  let suffix = 2;

  while (await db.biography.findUnique({ where: { saintId_slug: { saintId, slug: candidate } }, select: { id: true } })) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function revalidateSaintPaths(slug: string) {
  revalidatePath("/");
  revalidatePath("/saints");
  revalidatePath(`/saints/${slug}`);
  revalidatePath("/admin");
  revalidatePath("/admin/saints");
  revalidatePath(`/admin/saints/${slug}`);
}
