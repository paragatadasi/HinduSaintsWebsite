"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { Prisma } from "@/lib/generated/prisma/client";
import { z } from "zod";
import { verifyBulkDeletePassword } from "@/lib/admin-secrets";
import { auth } from "@/lib/auth";
import { assertCapability, requireCapability } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { PUBLIC_CACHE_TAGS } from "@/lib/public-cache";
import { parseImportedDate } from "@/lib/import-dates";
import { acceptSaintInstagramClaim } from "@/lib/instagram-claims";
import { extractInstagramBiographySlidesDraft } from "@/lib/instagram-first-page-extraction";
import { toSlug } from "@/lib/slugs";
import { getReciprocalRelationshipType } from "@/lib/saint-relationships";
import { expectedVersion, guardedSaintTransaction, guardedSaintUpdate } from "@/lib/admin-conflicts";

const contentStatusSchema = z.enum(["draft", "needs_review", "published", "archived"]);
const placeTypeSchema = z.enum(["primary", "birth", "samadhi", "sadhana", "associated", "other"]);
const sourceTypeSchema = z.enum(["book", "article", "website", "scripture", "oral_tradition", "other"]);
const relationshipTypeSchema = z.enum([
  "guru", "disciple", "parent", "child", "father", "mother", "son", "daughter", "husband", "wife",
  "partner", "incarnation", "family", "influence", "initiator", "patron", "successor",
  "debate_opponent", "contemporary", "associated", "lineage", "related", "untyped"
]);
const relationshipEvidenceStatusSchema = z.enum(["certain", "probable", "traditional", "disputed", "imported", "uncategorized"]);
const confidenceSchema = z.enum(["low", "medium", "high"]);

const saintBasicsSchema = z.object({
  saintId: z.string().cuid(),
  displayName: z.string().trim().min(1).max(200),
  canonicalName: z.string().trim().min(1).max(200),
  shortDescription: z.string().trim().optional(),
  eraLabel: z.string().trim().max(120).optional(),
  birthDateRaw: z.string().trim().max(120).optional(),
  samadhiDateRaw: z.string().trim().max(120).optional(),
  dateNotes: z.string().trim().max(1000).optional(),
  seoTitle: z.string().trim().max(120).optional(),
  seoDescription: z.string().trim().max(300).optional()
});

const saintOverviewSchema = saintBasicsSchema.pick({
  saintId: true,
  displayName: true,
  canonicalName: true,
  shortDescription: true
});

const saintOtherPublicFieldsSchema = saintBasicsSchema.pick({
  saintId: true,
  eraLabel: true,
  birthDateRaw: true,
  samadhiDateRaw: true,
  dateNotes: true,
  seoTitle: true,
  seoDescription: true
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

const bulkSaintDeleteSchema = z.object({
  saintIds: z.array(z.string().cuid()).min(1).max(500),
  password: z.string().min(1),
  returnTo: z.string().startsWith("/admin/saints").optional()
});

const instagramClaimReviewSchema = z.object({
  claimId: z.string().cuid(),
  saintId: z.string().cuid(),
  intent: z.enum(["accept", "ignore"])
});

const instagramBiographyImportSchema = z.object({
  saintId: z.string().cuid(),
  instagramItemId: z.string().cuid()
});

const saintImageAttachmentSchema = z.object({
  saintId: z.string().cuid(),
  mediaAssetId: z.string().cuid(),
  placement: z.enum(["gallery", "primary", "both"])
});

const saintImageVisibilitySchema = z.object({
  saintId: z.string().cuid(),
  mediaAssetId: z.string().cuid(),
  publicVisible: z.boolean()
});

const saintImagePlacementSchema = saintImageAttachmentSchema;

const saintImageDeleteSchema = z.object({
  saintId: z.string().cuid(),
  mediaAssetId: z.string().cuid()
});

const saintImageMetadataSchema = z.object({
  saintId: z.string().cuid(),
  mediaAssetId: z.string().cuid(),
  altText: z.string().trim().max(240),
  caption: z.string().trim().max(500),
  credit: z.string().trim().max(160),
  focalX: z.number().min(0).max(100),
  focalY: z.number().min(0).max(100)
});

const instagramSlideDeleteSchema = z.object({
  saintId: z.string().cuid(),
  instagramMediaAssetId: z.string().cuid(),
  password: z.string().min(1)
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

const saintTraditionCreationSchema = z.object({
  saintId: z.string().cuid(),
  name: z.string().trim().min(1).max(200),
  alternateNames: z.array(z.string().trim().min(1).max(200)).max(100),
  shortDescription: z.string().trim().max(500).optional()
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

const saintPlaceCreationSchema = z.object({
  saintId: z.string().cuid(),
  name: z.string().trim().min(1).max(200),
  placeScope: z.enum(["locality", "state", "country"]),
  placeType: placeTypeSchema,
  region: z.string().trim().max(120).optional(),
  country: z.string().trim().max(120).optional(),
  routeLabel: z.string().trim().max(120).optional()
});

const saintRelationshipFieldsSchema = z.object({
  saintId: z.string().cuid(),
  relatedSaintId: z.string().cuid(),
  relationshipType: relationshipTypeSchema,
  status: contentStatusSchema,
  evidenceStatus: relationshipEvidenceStatusSchema,
  confidence: confidenceSchema,
  publicVisible: z.boolean(),
  publicNote: z.string().trim().max(500).optional()
});
const saintRelationshipSchema = saintRelationshipFieldsSchema.refine((value) => value.saintId !== value.relatedSaintId, {
  message: "A saint cannot be related to themselves."
});

const saintRelationshipUpdateSchema = saintRelationshipFieldsSchema.omit({ relatedSaintId: true }).extend({
  relationshipId: z.string().cuid()
});

const saintRelationshipDeleteSchema = z.object({
  saintId: z.string().cuid(),
  relationshipId: z.string().cuid()
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
      eraLabel: parsed.eraLabel ?? null,
      birthDateRaw: birthDate?.raw ?? null,
      birthYear: birthDate?.year ?? null,
      birthYearEnd: birthDate?.endYear ?? null,
      birthMonth: birthDate?.month ?? null,
      birthDay: birthDate?.day ?? null,
      birthDatePrecision: birthDate?.precision ?? null,
      samadhiDateRaw: samadhiDate?.raw ?? null,
      samadhiYear: samadhiDate?.year ?? null,
      samadhiYearEnd: samadhiDate?.endYear ?? null,
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
}

export async function updateSaintOverview(formData: FormData) {
  await requireAdminSession();

  const parsed = saintOverviewSchema.parse({
    saintId: formData.get("saintId"),
    displayName: formData.get("displayName"),
    canonicalName: formData.get("canonicalName"),
    shortDescription: emptyToUndefined(formData.get("shortDescription"))
  });
  const attempted = {
      displayName: parsed.displayName,
      canonicalName: parsed.canonicalName,
      shortDescription: parsed.shortDescription ?? null
  };
  const saint = await guardedSaintTransaction(parsed.saintId, expectedVersion(formData), attempted, `/admin/saints/${parsed.saintId}/summary`, async (tx) => {
    const updated = await tx.saint.update({ where: { id: parsed.saintId }, data: attempted, select: { slug: true } });
    await tx.adminEditorialDraft.deleteMany({ where: { entityType: "saint", entityId: parsed.saintId, section: "overview" } });
    return updated;
  });

  revalidateSaintPaths(saint.slug);
  redirect(`/admin/saints/${saint.slug}/summary`);
}

export async function updateSaintOtherPublicFields(formData: FormData) {
  await requireAdminSession();

  const parsed = saintOtherPublicFieldsSchema.parse({
    saintId: formData.get("saintId"),
    eraLabel: emptyToUndefined(formData.get("eraLabel")),
    birthDateRaw: emptyToUndefined(formData.get("birthDateRaw")),
    samadhiDateRaw: emptyToUndefined(formData.get("samadhiDateRaw")),
    dateNotes: emptyToUndefined(formData.get("dateNotes")),
    seoTitle: emptyToUndefined(formData.get("seoTitle")),
    seoDescription: emptyToUndefined(formData.get("seoDescription"))
  });
  const birthDate = parsed.birthDateRaw ? parseImportedDate(parsed.birthDateRaw) : null;
  const samadhiDate = parsed.samadhiDateRaw ? parseImportedDate(parsed.samadhiDateRaw) : null;

  const attempted = {
      eraLabel: parsed.eraLabel ?? null,
      birthDateRaw: birthDate?.raw ?? null,
      birthYear: birthDate?.year ?? null,
      birthYearEnd: birthDate?.endYear ?? null,
      birthMonth: birthDate?.month ?? null,
      birthDay: birthDate?.day ?? null,
      birthDatePrecision: birthDate?.precision ?? null,
      samadhiDateRaw: samadhiDate?.raw ?? null,
      samadhiYear: samadhiDate?.year ?? null,
      samadhiYearEnd: samadhiDate?.endYear ?? null,
      samadhiMonth: samadhiDate?.month ?? null,
      samadhiDay: samadhiDate?.day ?? null,
      samadhiDatePrecision: samadhiDate?.precision ?? null,
      dateNotes: parsed.dateNotes ?? null,
      seoTitle: parsed.seoTitle ?? null,
      seoDescription: parsed.seoDescription ?? null
  };
  const saint = await guardedSaintTransaction(parsed.saintId, expectedVersion(formData), attempted, `/admin/saints/${parsed.saintId}/summary`, async (tx) => {
    const updated = await tx.saint.update({ where: { id: parsed.saintId }, data: attempted, select: { slug: true } });
    await tx.adminEditorialDraft.deleteMany({ where: { entityType: "saint", entityId: parsed.saintId, section: "public_fields" } });
    return updated;
  });

  revalidateSaintPaths(saint.slug);
  redirect(`/admin/saints/${saint.slug}/summary`);
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

  await guardedSaintTransaction(parsed.saintId, expectedVersion(formData), { aliases }, `/admin/saints/${parsed.saintId}/summary`, async (tx) => {
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
    await tx.adminEditorialDraft.deleteMany({ where: { entityType: "saint", entityId: parsed.saintId, section: "aliases" } });
  });

  revalidateSaintPaths(saint.slug);
  redirect(`/admin/saints/${saint.slug}/summary`);
}

export async function createSaintRelationship(formData: FormData) {
  await requireAdminSession();

  const parsed = saintRelationshipSchema.parse({
    saintId: formData.get("saintId"),
    relatedSaintId: formData.get("relatedSaintId"),
    relationshipType: formData.get("relationshipType"),
    status: formData.get("status") ?? "needs_review",
    evidenceStatus: formData.get("evidenceStatus") ?? "uncategorized",
    confidence: formData.get("confidence") ?? "medium",
    publicVisible: formData.has("publicVisible"),
    publicNote: emptyToUndefined(formData.get("publicNote"))
  });
  const saints = await db.saint.findMany({
    where: { id: { in: [parsed.saintId, parsed.relatedSaintId] } },
    select: { id: true, slug: true }
  });
  if (saints.length !== 2) throw new Error("One of the selected saints was not found.");

  const duplicate = await db.saintRelationship.findFirst({
    where: {
      OR: [
        { fromSaintId: parsed.saintId, toSaintId: parsed.relatedSaintId, relationshipType: parsed.relationshipType },
        {
          fromSaintId: parsed.relatedSaintId,
          toSaintId: parsed.saintId,
          relationshipType: getReciprocalRelationshipType(parsed.relationshipType)
        }
      ]
    },
    select: { id: true }
  });
  if (duplicate) throw new Error("This relationship already exists.");

  await db.saintRelationship.create({
    data: {
      fromSaintId: parsed.saintId,
      toSaintId: parsed.relatedSaintId,
      relationshipType: parsed.relationshipType,
      status: parsed.status,
      evidenceStatus: parsed.evidenceStatus,
      confidence: parsed.confidence,
      publicVisible: parsed.publicVisible,
      publicNote: parsed.publicNote
    }
  });
  saints.forEach((saint) => revalidateSaintPaths(saint.slug));
}

export async function updateSaintRelationship(formData: FormData) {
  await requireAdminSession();

  const parsed = saintRelationshipUpdateSchema.parse({
    relationshipId: formData.get("relationshipId"),
    saintId: formData.get("saintId"),
    relationshipType: formData.get("relationshipType"),
    status: formData.get("status"),
    evidenceStatus: formData.get("evidenceStatus"),
    confidence: formData.get("confidence"),
    publicVisible: formData.has("publicVisible"),
    publicNote: emptyToUndefined(formData.get("publicNote"))
  });
  const relationship = await db.saintRelationship.findFirst({
    where: {
      id: parsed.relationshipId,
      OR: [{ fromSaintId: parsed.saintId }, { toSaintId: parsed.saintId }]
    },
    include: {
      fromSaint: { select: { slug: true } },
      toSaint: { select: { slug: true } }
    }
  });
  if (!relationship) throw new Error("Relationship was not found.");

  await db.saintRelationship.update({
    where: { id: relationship.id },
    data: {
      relationshipType: relationship.fromSaintId === parsed.saintId
        ? parsed.relationshipType
        : getReciprocalRelationshipType(parsed.relationshipType),
      status: parsed.status,
      evidenceStatus: parsed.evidenceStatus,
      confidence: parsed.confidence,
      publicVisible: parsed.publicVisible,
      publicNote: parsed.publicNote
    }
  });
  [relationship.fromSaint.slug, relationship.toSaint.slug].forEach(revalidateSaintPaths);
}

export async function deleteSaintRelationship(formData: FormData) {
  await requireAdminSession();

  const parsed = saintRelationshipDeleteSchema.parse({
    relationshipId: formData.get("relationshipId"),
    saintId: formData.get("saintId")
  });
  const relationship = await db.saintRelationship.findFirst({
    where: {
      id: parsed.relationshipId,
      OR: [{ fromSaintId: parsed.saintId }, { toSaintId: parsed.saintId }]
    },
    include: {
      fromSaint: { select: { slug: true } },
      toSaint: { select: { slug: true } }
    }
  });
  if (!relationship) throw new Error("Relationship was not found.");

  await db.saintRelationship.delete({ where: { id: relationship.id } });
  [relationship.fromSaint.slug, relationship.toSaint.slug].forEach(revalidateSaintPaths);
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
}

export async function createAndAttachSaintTradition(formData: FormData) {
  await requireAdminSession();

  const parsed = saintTraditionCreationSchema.parse({
    saintId: formData.get("saintId"),
    name: formData.get("name"),
    alternateNames: uniqueList(parseList(formData.get("alternateNames"))),
    shortDescription: emptyToUndefined(formData.get("shortDescription"))
  });
  const saint = await db.saint.findUnique({
    where: { id: parsed.saintId },
    select: {
      slug: true,
      traditions: {
        select: { id: true },
        take: 1
      }
    }
  });

  if (!saint) redirect("/admin/saints");

  const traditionSlug = await getUniqueTraditionSlug(parsed.name);
  await db.$transaction(async (tx) => {
    const tradition = await tx.tradition.create({
      data: {
        name: parsed.name,
        slug: traditionSlug,
        alternateNames: parsed.alternateNames,
        shortDescription: parsed.shortDescription ?? null,
        status: "draft"
      },
      select: { id: true }
    });

    await tx.saintTradition.create({
      data: {
        saintId: parsed.saintId,
        traditionId: tradition.id,
        isPrimary: saint.traditions.length === 0
      }
    });
  });

  revalidateSaintPaths(saint.slug);
  revalidatePath("/admin/traditions");
  revalidatePath(`/admin/traditions/${traditionSlug}`);
  revalidatePath("/traditions");
}

export async function createAndAttachSaintPlace(formData: FormData) {
  await requireAdminSession();

  const parsed = saintPlaceCreationSchema.parse({
    saintId: formData.get("saintId"),
    name: formData.get("name"),
    placeScope: formData.get("placeScope"),
    placeType: formData.get("placeType"),
    region: emptyToUndefined(formData.get("region")),
    country: emptyToUndefined(formData.get("country")),
    routeLabel: emptyToUndefined(formData.get("routeLabel"))
  });
  const [saint, routeOrder] = await Promise.all([
    db.saint.findUnique({
      where: { id: parsed.saintId },
      select: { slug: true }
    }),
    db.saintPlace.aggregate({
      where: { saintId: parsed.saintId },
      _max: { routeOrder: true }
    })
  ]);

  if (!saint) redirect("/admin/saints");

  const placeSlug = await getUniquePlaceSlug(parsed.name);
  await db.$transaction(async (tx) => {
    const place = await tx.place.create({
      data: {
        name: parsed.name,
        slug: placeSlug,
        alternateNames: [],
        placeKind: parsed.placeScope,
        placeScope: parsed.placeScope,
        region: parsed.region ?? null,
        country: parsed.placeScope === "country" ? parsed.name : parsed.country ?? null
      },
      select: { id: true }
    });

    await tx.saintPlace.create({
      data: {
        saintId: parsed.saintId,
        placeId: place.id,
        placeType: parsed.placeType,
        routeOrder: (routeOrder._max.routeOrder ?? -1) + 1,
        routeLabel: parsed.routeLabel ?? null
      }
    });
  });

  revalidateSaintPaths(saint.slug);
  revalidatePath("/admin/places");
  revalidatePath("/map");
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

  const biographySlug = parsed.biographyId
    ? undefined
    : await getUniqueBiographySlug(parsed.saintId, parsed.title);

  await guardedSaintTransaction(parsed.saintId, expectedVersion(formData), {
    biographyId: parsed.biographyId ?? null,
    title: parsed.title,
    bodyMarkdown: parsed.bodyMarkdown,
    status: parsed.status
  }, `/admin/saints/${parsed.saintId}/biography`, async (tx) => {
    if (parsed.biographyId) {
      await tx.biography.update({
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
      await tx.biography.create({
        data: {
          saintId: parsed.saintId,
          title: parsed.title,
          slug: biographySlug!,
          bodyMarkdown: parsed.bodyMarkdown,
          status: parsed.status,
          publishedAt: parsed.status === "published" ? now : null,
          lastReviewedAt: parsed.status === "published" ? now : null
        }
      });
    }

    if (parsed.status === "needs_review") {
      await tx.saint.update({
        where: { id: parsed.saintId },
        data: {
          status: "needs_review",
          reviewedAt: null,
          publishedAt: null
        }
      });
    }
    await tx.adminEditorialDraft.deleteMany({ where: { entityType: "saint", entityId: parsed.saintId, section: "biography" } });
  });

  revalidateSaintPaths(saint.slug);
  redirect(`/admin/saints/${saint.slug}/biography`);
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
}

export async function updateSaintReviewStatus(formData: FormData) {
  await requireAdminSession();

  const parsed = saintStatusSchema.parse({
    saintId: formData.get("saintId"),
    status: formData.get("status")
  });
  if (parsed.status === "published" || parsed.status === "archived") await assertCapability("publish_content");
  const now = new Date();
  const attempted = {
      status: parsed.status,
      reviewedAt: parsed.status === "needs_review" ? null : now,
      publishedAt: parsed.status === "published" ? now : null
  };
  const saint = await guardedSaintUpdate(parsed.saintId, expectedVersion(formData), attempted, attempted, `/admin/saints/${parsed.saintId}`);

  revalidateSaintPaths(saint.slug);
}

export async function bulkUpdateSaintReviewStatus(formData: FormData) {
  await requireAdminSession();

  const parsed = bulkSaintStatusSchema.parse({
    saintIds: formData.getAll("saintIds"),
    status: formData.get("status"),
    returnTo: emptyToUndefined(formData.get("returnTo"))
  });
  if (parsed.status === "published" || parsed.status === "archived") await assertCapability("publish_content");
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

export async function bulkDeleteSaints(formData: FormData) {
  await assertCapability("manage_sensitive_actions");
  const session = await requireAdminSession();

  const parsed = bulkSaintDeleteSchema.parse({
    saintIds: formData.getAll("saintIds"),
    password: formData.get("bulkDeletePassword"),
    returnTo: emptyToUndefined(formData.get("returnTo"))
  });

  if (!(await verifyBulkDeletePassword(parsed.password))) {
    throw new Error("The sensitive-action password was incorrect.");
  }

  const saints = await db.saint.findMany({
    where: { id: { in: parsed.saintIds } },
    select: { id: true, slug: true, displayName: true }
  });
  const saintIds = saints.map((saint) => saint.id);

  if (saintIds.length === 0) {
    const destination = (parsed.returnTo ?? "/admin/saints") as Route;
    redirect(destination);
  }

  await db.$transaction(async (tx) => {
    await tx.contentSource.deleteMany({
      where: {
        entityType: "Saint",
        entityId: { in: saintIds }
      }
    });

    await tx.reconciliationIssue.deleteMany({
      where: {
        entityType: "Saint",
        entityId: { in: saintIds }
      }
    });

    await tx.externalRecord.updateMany({
      where: {
        entityType: "Saint",
        entityId: { in: saintIds }
      },
      data: {
        entityId: null
      }
    });

    await tx.tradition.updateMany({
      where: { founderSaintId: { in: saintIds } },
      data: { founderSaintId: null }
    });

    await tx.saint.deleteMany({
      where: { id: { in: saintIds } }
    });

    await tx.auditEvent.create({
      data: {
        userId: session.user?.email ?? null,
        action: "bulk_delete_saints",
        entityType: "Saint",
        entityId: saintIds.join(","),
        beforeJson: toInputJson({
          deletedSaints: saints.map((saint) => ({
            id: saint.id,
            slug: saint.slug,
            displayName: saint.displayName
          }))
        }),
        afterJson: Prisma.JsonNull
      }
    });
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
}

export async function importBiographyTextFromInstagramPost(input: z.input<typeof instagramBiographyImportSchema>) {
  await requireAdminSession();

  const parsed = instagramBiographyImportSchema.parse(input);
  const link = await db.instagramItemSaint.findFirst({
    where: {
      saintId: parsed.saintId,
      instagramItemId: parsed.instagramItemId,
      matchStatus: { in: ["matched", "published"] }
    },
    include: {
      instagramItem: {
        select: {
          id: true,
          instagramShortcode: true,
          instagramUrl: true,
          thumbnailUrl: true,
          mediaAssets: {
            orderBy: { sortOrder: "asc" },
            select: {
              cachedUrl: true,
              isCover: true,
              sortOrder: true,
              sourceUrl: true,
              storageKey: true
            }
          }
        }
      },
      saint: {
        select: { slug: true }
      }
    }
  });

  if (!link) {
    return {
      ok: false as const,
      error: "Select a matched Instagram post attached to this saint."
    };
  }

  const externalRecord = await db.externalRecord.findFirst({
    where: {
      sourceType: "instagram",
      entityType: "InstagramItem",
      entityId: parsed.instagramItemId
    },
    orderBy: { lastSeenAt: "desc" },
    select: { rawPayloadJson: true }
  });
  const draft = await extractInstagramBiographySlidesDraft({
    cachedMediaAssets: link.instagramItem.mediaAssets,
    rawPayloadJson: externalRecord?.rawPayloadJson,
    thumbnailUrl: link.instagramItem.thumbnailUrl
  });

  if (!draft.markdown) {
    return {
      ok: false as const,
      error: draft.error ?? "No biography text could be extracted from slides after the cover image."
    };
  }

  revalidatePath(`/admin/saints/${link.saint.slug}`);

  return {
    ok: true as const,
    markdown: [
      `## Imported from Instagram ${link.instagramItem.instagramShortcode ?? "post"}`,
      "",
      draft.markdown,
      "",
      `[Source Instagram post](${link.instagramItem.instagramUrl})`
    ].join("\n"),
    slideCount: draft.slideCount
  };
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
            sortOrder: saint._count.galleryImages,
            publicVisible: true
          }
        });
      } else {
        await setSaintGalleryImageVisibility(tx, parsed.saintId, parsed.mediaAssetId, true);
      }
    }
  });

  revalidateSaintPaths(saint.slug);
}

export async function updateSaintImagePlacement(input: z.input<typeof saintImagePlacementSchema>) {
  await requireAdminSession();

  const parsed = saintImagePlacementSchema.parse(input);
  const saint = await db.saint.findUnique({
    where: { id: parsed.saintId },
    select: {
      id: true,
      slug: true,
      primaryImageId: true,
      _count: { select: { galleryImages: true } }
    }
  });

  if (!saint) throw new Error("Saint was not found.");

  const mediaAsset = await db.mediaAsset.findUnique({
    where: { id: parsed.mediaAssetId },
    select: { id: true }
  });

  if (!mediaAsset) throw new Error("Media asset was not found.");

  await db.$transaction(async (tx) => {
    const shouldBePrimary = parsed.placement === "primary" || parsed.placement === "both";
    const shouldBeInGallery = parsed.placement === "gallery" || parsed.placement === "both";

    if (shouldBePrimary) {
      if (saint.primaryImageId && saint.primaryImageId !== parsed.mediaAssetId) {
        const previousPrimaryGalleryImage = await tx.saintGalleryImage.findFirst({
          where: {
            saintId: parsed.saintId,
            mediaAssetId: saint.primaryImageId
          },
          select: { id: true }
        });

        if (previousPrimaryGalleryImage) {
          await setSaintGalleryImageVisibility(tx, parsed.saintId, saint.primaryImageId, true);
        } else {
          await tx.saintGalleryImage.create({
            data: {
              saintId: parsed.saintId,
              mediaAssetId: saint.primaryImageId,
              sortOrder: saint._count.galleryImages,
              publicVisible: true
            }
          });
        }
      }

      await tx.saint.update({
        where: { id: parsed.saintId },
        data: { primaryImageId: parsed.mediaAssetId }
      });
    } else if (saint.primaryImageId === parsed.mediaAssetId) {
      await tx.saint.update({
        where: { id: parsed.saintId },
        data: { primaryImageId: null }
      });
    }

    const existing = await tx.saintGalleryImage.findFirst({
      where: {
        saintId: parsed.saintId,
        mediaAssetId: parsed.mediaAssetId
      },
      select: { id: true }
    });

    if (shouldBeInGallery) {
      if (existing) {
        await setSaintGalleryImageVisibility(tx, parsed.saintId, parsed.mediaAssetId, true);
      } else {
        await tx.saintGalleryImage.create({
          data: {
            saintId: parsed.saintId,
            mediaAssetId: parsed.mediaAssetId,
            sortOrder: saint._count.galleryImages,
            publicVisible: true
          }
        });
      }
    } else if (existing) {
      await tx.saintGalleryImage.delete({ where: { id: existing.id } });
    }
  });

  revalidateSaintPaths(saint.slug);
}

export async function updateSaintImageMetadata(input: z.input<typeof saintImageMetadataSchema>) {
  await requireAdminSession();
  const parsed = saintImageMetadataSchema.parse(input);

  const saint = await db.saint.findUnique({
    where: { id: parsed.saintId },
    select: {
      slug: true,
      primaryImageId: true,
      galleryImages: {
        where: { mediaAssetId: parsed.mediaAssetId },
        select: { id: true },
        take: 1
      }
    }
  });

  if (!saint) throw new Error("Saint was not found.");

  const isAttached = saint.primaryImageId === parsed.mediaAssetId || saint.galleryImages.length > 0;
  if (!isAttached) throw new Error("The image is no longer attached to this saint.");

  await db.mediaAsset.update({
    where: { id: parsed.mediaAssetId },
    data: {
      altText: parsed.altText || null,
      caption: parsed.caption || null,
      credit: parsed.credit || null,
      focalX: parsed.focalX,
      focalY: parsed.focalY
    }
  });

  revalidateSaintPaths(saint.slug);
}

export async function deleteAttachedInstagramSlide(input: z.input<typeof instagramSlideDeleteSchema>) {
  const session = await requireAdminSession();
  const parsed = instagramSlideDeleteSchema.parse(input);

  if (!(await verifyBulkDeletePassword(parsed.password))) {
    throw new Error("The sensitive-action password was incorrect.");
  }

  const slide = await db.instagramMediaAsset.findFirst({
    where: {
      id: parsed.instagramMediaAssetId,
      instagramItem: {
        saints: { some: { saintId: parsed.saintId } }
      }
    },
    select: {
      id: true,
      cachedUrl: true,
      isCover: true,
      sortOrder: true,
      sourceUrl: true,
      instagramItem: {
        select: {
          id: true,
          saints: { select: { saint: { select: { slug: true } } } }
        }
      }
    }
  });

  if (!slide) throw new Error("The Instagram slide is no longer attached to this saint.");

  await db.$transaction(async (tx) => {
    await tx.instagramMediaAsset.delete({ where: { id: slide.id } });
    await tx.auditEvent.create({
      data: {
        userId: session.user?.email ?? null,
        action: "delete_attached_instagram_slide",
        entityType: "InstagramMediaAsset",
        entityId: slide.id,
        beforeJson: toInputJson({
          instagramItemId: slide.instagramItem.id,
          cachedUrl: slide.cachedUrl,
          sourceUrl: slide.sourceUrl,
          sortOrder: slide.sortOrder,
          isCover: slide.isCover
        }),
        afterJson: Prisma.JsonNull
      }
    });
  });

  for (const link of slide.instagramItem.saints) {
    revalidateSaintPaths(link.saint.slug);
  }
  revalidatePath(`/admin/instagram/${slide.instagramItem.id}`);
}

export async function updateSaintImageVisibility(input: z.input<typeof saintImageVisibilitySchema>) {
  await requireAdminSession();

  const parsed = saintImageVisibilitySchema.parse(input);
  const saint = await db.saint.findUnique({
    where: { id: parsed.saintId },
    select: {
      id: true,
      slug: true,
      primaryImageId: true,
      _count: { select: { galleryImages: true } }
    }
  });

  if (!saint) throw new Error("Saint was not found.");

  await db.$transaction(async (tx) => {
    if (!parsed.publicVisible && saint.primaryImageId === parsed.mediaAssetId) {
      await tx.saint.update({
        where: { id: parsed.saintId },
        data: { primaryImageId: null }
      });
    }

    const existing = await tx.saintGalleryImage.findFirst({
      where: {
        saintId: parsed.saintId,
        mediaAssetId: parsed.mediaAssetId
      },
      select: { id: true }
    });

    if (existing) {
      await setSaintGalleryImageVisibility(tx, parsed.saintId, parsed.mediaAssetId, parsed.publicVisible);
      return;
    }

    await tx.saintGalleryImage.create({
      data: {
        saintId: parsed.saintId,
        mediaAssetId: parsed.mediaAssetId,
        sortOrder: saint._count.galleryImages,
        publicVisible: parsed.publicVisible
      }
    });
  });

  revalidateSaintPaths(saint.slug);
}

export async function deleteSaintImage(input: z.input<typeof saintImageDeleteSchema>) {
  await requireAdminSession();

  const parsed = saintImageDeleteSchema.parse(input);
  const saint = await db.saint.findUnique({
    where: { id: parsed.saintId },
    select: { id: true, slug: true, primaryImageId: true }
  });

  if (!saint) throw new Error("Saint was not found.");

  await db.$transaction(async (tx) => {
    if (saint.primaryImageId === parsed.mediaAssetId) {
      await tx.saint.update({
        where: { id: parsed.saintId },
        data: { primaryImageId: null }
      });
    }

    await tx.saintGalleryImage.deleteMany({
      where: {
        saintId: parsed.saintId,
        mediaAssetId: parsed.mediaAssetId
      }
    });

    const references = await tx.mediaAsset.findUnique({
      where: { id: parsed.mediaAssetId },
      select: {
        _count: {
          select: {
            primaryForSaints: true,
            saintGalleryImages: true
          }
        }
      }
    });

    if (references && references._count.primaryForSaints === 0 && references._count.saintGalleryImages === 0) {
      await tx.mediaAsset.delete({ where: { id: parsed.mediaAssetId } });
    }
  });

  revalidateSaintPaths(saint.slug);
}

async function setSaintGalleryImageVisibility(
  tx: Prisma.TransactionClient,
  saintId: string,
  mediaAssetId: string,
  publicVisible: boolean
) {
  await tx.saintGalleryImage.updateMany({
    where: { saintId, mediaAssetId },
    data: { publicVisible }
  });
}

async function requireAdminSession() {
  await requireCapability("edit_content");
  const session = await auth();
  if (!session?.user?.email) redirect("/admin");
  return session;
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

async function getUniquePlaceSlug(name: string) {
  const baseSlug = toSlug(name) || "place";
  let candidate = baseSlug;
  let suffix = 2;

  while (await db.place.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

async function getUniqueTraditionSlug(name: string) {
  const baseSlug = toSlug(name) || "tradition";
  let candidate = baseSlug;
  let suffix = 2;

  while (await db.tradition.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function revalidateSaintPaths(slug: string) {
  revalidateTag(PUBLIC_CACHE_TAGS.home);
  revalidateTag(PUBLIC_CACHE_TAGS.places);
  revalidateTag(PUBLIC_CACHE_TAGS.saints);
  revalidateTag(PUBLIC_CACHE_TAGS.traditions);
  revalidatePath("/");
  revalidatePath("/saints");
  revalidatePath(`/saints/${slug}`);
  revalidatePath("/admin");
  revalidatePath("/admin/saints");
  revalidatePath(`/admin/saints/${slug}`);
}

function toInputJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
