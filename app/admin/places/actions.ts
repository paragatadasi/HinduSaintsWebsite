"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import {
  Prisma,
  type Confidence,
  type PlaceKind,
  type PlaceRelationshipType,
  type PlaceType
} from "@/lib/generated/prisma/client";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { assertCapability, requireCapability } from "@/lib/admin-access";
import { db } from "@/lib/db";
import type { Capability } from "@/lib/permissions";
import { PUBLIC_CACHE_TAGS } from "@/lib/public-cache";
import { getKnownPlaceScope } from "@/lib/place-taxonomy";
import { toSlug } from "@/lib/slugs";
import { expectedVersion, guardedPlaceTransaction } from "@/lib/admin-conflicts";
import {
  editorialSnapshotsMatch,
  EditorialRevisionConflictError,
  getEditorialRevisionActiveKey,
  placeNarrativeRevisionSchema,
  type PlaceNarrativeRevision
} from "@/lib/editorial-revisions";

const placeScopeSchema = z.enum(["locality", "state", "country"]);
const LEGACY_PARENT_STATE_RELATIONSHIP_NOTE = "Mirrored from legacy parentStateId.";
const saintPlaceTypeRank = new Map<PlaceType, number>([
  ["birth", 0],
  ["samadhi", 1],
  ["primary", 2],
  ["sadhana", 3],
  ["associated", 4],
  ["other", 5]
]);

const placeEditorSchema = z.object({
  placeId: z.string().cuid(),
  name: z.string().trim().min(1).max(200),
  alternateNames: z.array(z.string().trim().min(1).max(200)).max(100),
  placeScope: placeScopeSchema,
  parentStateId: z.string().cuid().optional(),
  localityIds: z.array(z.string().cuid()).max(500),
  country: z.string().trim().max(120).optional(),
  overviewMarkdown: z.string().trim().max(20000).optional(),
  notes: z.string().trim().max(1000).optional()
});

const placeOverviewSchema = placeEditorSchema.pick({
  placeId: true,
  name: true,
  alternateNames: true,
  placeScope: true,
  parentStateId: true,
  localityIds: true,
  country: true
});

const placeOtherPublicFieldsSchema = placeEditorSchema.pick({
  placeId: true,
  overviewMarkdown: true,
  notes: true
});

const placeNarrativeRevisionActionSchema = z.object({
  placeId: z.string().cuid(),
  overviewMarkdown: z.string().trim().max(20_000).optional(),
  intent: z.enum(["save_draft", "submit_review"])
});

const placeRevisionIdSchema = z.object({
  revisionId: z.string().cuid(),
  placeId: z.string().cuid()
});

const mergePlacesSchema = z.object({
  sourcePlaceId: z.string().cuid(),
  targetPlaceId: z.string().cuid()
}).refine((value) => value.sourcePlaceId !== value.targetPlaceId, {
  message: "Choose two different places."
});

export async function updatePlace(formData: FormData) {
  await requireAdminSession("edit_long_form_content");

  const parsed = placeEditorSchema.parse({
    placeId: formData.get("placeId"),
    name: formData.get("name"),
    alternateNames: parseList(formData.get("alternateNames")),
    placeScope: formData.get("placeScope"),
    parentStateId: emptyToUndefined(formData.get("parentStateId")),
    localityIds: parseStringList(formData.getAll("localityIds")),
    country: emptyToUndefined(formData.get("country")),
    overviewMarkdown: emptyToUndefined(formData.get("overviewMarkdown")),
    notes: emptyToUndefined(formData.get("notes"))
  });
  const existing = await db.place.findUnique({
    where: { id: parsed.placeId },
    select: { slug: true }
  });

  if (!existing) redirect("/admin/places");

  const slug = await getUniquePlaceSlug(parsed.name, parsed.placeId);
  const placeScope = getKnownPlaceScope(slug) === "state" ? "state" : parsed.placeScope;
  const parentStateId = placeScope === "locality" && parsed.parentStateId !== parsed.placeId
    ? parsed.parentStateId
    : null;
  const attempted = {
    name: parsed.name,
    slug,
    alternateNames: parsed.alternateNames,
    placeKind: getPlaceKindForScope(placeScope),
    placeScope,
    parentStateId,
    country: placeScope === "country" ? parsed.name : parsed.country ?? null,
    overviewMarkdown: parsed.overviewMarkdown ?? null,
    notes: parsed.notes ?? null
  };
  const place = await guardedPlaceTransaction(parsed.placeId, expectedVersion(formData), attempted, `/admin/places/${existing.slug}`, async (tx) => {
    const updatedPlace = await tx.place.update({
      where: { id: parsed.placeId },
      data: {
        name: parsed.name,
        slug,
        alternateNames: parsed.alternateNames,
        placeKind: getPlaceKindForScope(placeScope),
        placeScope,
        parentStateId,
        country: placeScope === "country" ? parsed.name : parsed.country ?? null,
        overviewMarkdown: parsed.overviewMarkdown ?? null,
        notes: parsed.notes ?? null
      },
      select: { slug: true }
    });

    await syncParentStateRelationship(tx, parsed.placeId, parentStateId);

    return updatedPlace;
  });

  revalidatePlacePaths(existing.slug);
  revalidatePlacePaths(place.slug);
  redirect(`/admin/places/${place.slug}`);
}

export async function updatePlaceOverview(formData: FormData) {
  await requireAdminSession();

  const parsed = placeOverviewSchema.parse({
    placeId: formData.get("placeId"),
    name: formData.get("name"),
    alternateNames: parseList(formData.get("alternateNames")),
    placeScope: formData.get("placeScope"),
    parentStateId: emptyToUndefined(formData.get("parentStateId")),
    localityIds: parseStringList(formData.getAll("localityIds")),
    country: emptyToUndefined(formData.get("country"))
  });
  const existing = await db.place.findUnique({
    where: { id: parsed.placeId },
    select: { slug: true }
  });

  if (!existing) redirect("/admin/places");

  const slug = await getUniquePlaceSlug(parsed.name, parsed.placeId);
  const placeScope = getKnownPlaceScope(slug) === "state" ? "state" : parsed.placeScope;
  const parentStateId = placeScope === "locality" && parsed.parentStateId !== parsed.placeId
    ? parsed.parentStateId
    : null;
  const attempted = {
    name: parsed.name,
    slug,
    alternateNames: parsed.alternateNames,
    placeKind: getPlaceKindForScope(placeScope),
    placeScope,
    parentStateId,
    country: placeScope === "country" ? parsed.name : parsed.country ?? null,
    localityIds: parsed.localityIds
  };
  const place = await guardedPlaceTransaction(parsed.placeId, expectedVersion(formData), attempted, `/admin/places/${existing.slug}`, async (tx) => {
    const updatedPlace = await tx.place.update({
      where: { id: parsed.placeId },
      data: {
        name: parsed.name,
        slug,
        alternateNames: parsed.alternateNames,
        placeKind: getPlaceKindForScope(placeScope),
        placeScope,
        parentStateId,
        country: placeScope === "country" ? parsed.name : parsed.country ?? null
      },
      select: { slug: true }
    });

    await tx.place.updateMany({
      where: { parentStateId: parsed.placeId },
      data: { parentStateId: null }
    });
    await tx.placeRelationship.deleteMany({
      where: {
        toPlaceId: parsed.placeId,
        relationshipType: "contained_in",
        notes: LEGACY_PARENT_STATE_RELATIONSHIP_NOTE
      }
    });

    if (placeScope === "state") {
      const localityIds = Array.from(new Set(parsed.localityIds.filter((localityId) => localityId !== parsed.placeId)));
      if (localityIds.length > 0) {
        await tx.place.updateMany({
          where: {
            id: { in: localityIds },
            placeScope: "locality"
          },
          data: { parentStateId: parsed.placeId }
        });
        await Promise.all(localityIds.map((localityId) => syncParentStateRelationship(tx, localityId, parsed.placeId)));
      }
    }

    await syncParentStateRelationship(tx, parsed.placeId, parentStateId);

    await tx.adminEditorialDraft.deleteMany({ where: { entityType: "place", entityId: parsed.placeId, section: "overview" } });

    return updatedPlace;
  });

  revalidatePlacePaths(existing.slug);
  revalidatePlacePaths(place.slug);
  redirect(`/admin/places/${place.slug}`);
}

export async function updatePlaceOtherPublicFields(formData: FormData) {
  await requireAdminSession("edit_structured_content");

  const parsed = placeOtherPublicFieldsSchema.parse({
    placeId: formData.get("placeId"),
    notes: emptyToUndefined(formData.get("notes"))
  });
  const attempted = {
      notes: parsed.notes ?? null
  };
  const current = await db.place.findUnique({ where: { id: parsed.placeId }, select: { slug: true } });
  if (!current) redirect("/admin/places");
  const place = await guardedPlaceTransaction(parsed.placeId, expectedVersion(formData), attempted, `/admin/places/${current.slug}`, async (tx) => {
    const updated = await tx.place.update({ where: { id: parsed.placeId }, data: attempted, select: { slug: true } });
    return updated;
  });

  revalidatePlacePaths(place.slug);
  redirect(`/admin/places/${place.slug}`);
}

export async function savePlaceNarrativeRevision(formData: FormData) {
  const user = await requireAdminSession("edit_long_form_content");
  const fields = placeNarrativeRevisionActionSchema.parse({
    placeId: formData.get("placeId"),
    overviewMarkdown: emptyToUndefined(formData.get("overviewMarkdown")),
    intent: formData.get("intent")
  });
  const payload = placeNarrativeRevisionSchema.parse(fields);
  const current = await getPlaceNarrativeSnapshot(db, fields.placeId);
  if (!current) redirect("/admin/places");
  const activeKey = getEditorialRevisionActiveKey("place", fields.placeId);
  await db.$transaction(async (tx) => {
    const active = await tx.editorialRevision.findUnique({ where: { activeKey } });
    if (active?.status === "needs_review") throw new Error("This revision is awaiting review and cannot be edited.");
    const status = fields.intent === "submit_review" ? "needs_review" : "draft";
    const workflowData = { payload, status, updatedById: user.id, submittedAt: status === "needs_review" ? new Date() : null, reviewedAt: null, reviewedById: null } as const;
    if (active) await tx.editorialRevision.update({ where: { id: active.id }, data: workflowData });
    else await tx.editorialRevision.create({
      data: {
        activeKey, entityType: "place", entityId: fields.placeId, section: "narrative", payload, basePayload: current.payload,
        baseVersion: current.version, status, submittedAt: status === "needs_review" ? new Date() : null, createdById: user.id, updatedById: user.id
      }
    });
    await tx.adminEditorialDraft.deleteMany({ where: { entityType: "place", entityId: fields.placeId, section: "public_fields" } });
  });
  revalidatePlacePaths(current.slug);
  redirect(`/admin/places/${current.slug}?revisionUpdated=${fields.intent === "submit_review" ? "submitted" : "saved"}`);
}

export async function returnPlaceNarrativeRevisionToDraft(formData: FormData) {
  const user = await requireAdminSession("publish_content");
  const parsed = placeRevisionIdSchema.parse({ revisionId: formData.get("revisionId"), placeId: formData.get("placeId") });
  const revision = await db.editorialRevision.findFirst({ where: { id: parsed.revisionId, entityType: "place", entityId: parsed.placeId, section: "narrative", status: "needs_review" } });
  if (!revision) throw new Error("The submitted place revision was not found.");
  await db.editorialRevision.update({ where: { id: revision.id }, data: { status: "draft", submittedAt: null, reviewedAt: new Date(), reviewedById: user.id, updatedById: user.id } });
  const place = await db.place.findUnique({ where: { id: parsed.placeId }, select: { slug: true } });
  if (!place) redirect("/admin/places");
  revalidatePlacePaths(place.slug);
  redirect(`/admin/places/${place.slug}?revisionUpdated=returned`);
}

export async function publishPlaceNarrativeRevision(formData: FormData) {
  const user = await requireAdminSession("publish_content");
  const parsed = placeRevisionIdSchema.parse({ revisionId: formData.get("revisionId"), placeId: formData.get("placeId") });
  const revision = await db.editorialRevision.findFirst({ where: { id: parsed.revisionId, entityType: "place", entityId: parsed.placeId, section: "narrative", status: "needs_review" } });
  if (!revision) throw new Error("The submitted place revision was not found.");
  const payload = placeNarrativeRevisionSchema.parse(revision.payload);
  const current = await getPlaceNarrativeSnapshot(db, parsed.placeId);
  if (!current) redirect("/admin/places");
  if (!editorialSnapshotsMatch(revision.basePayload, current.payload)) redirect(`/admin/places/${current.slug}?revisionError=published-content-changed`);
  try {
    await db.$transaction(async (tx) => {
      const latestSnapshot = await getPlaceNarrativeSnapshot(tx, parsed.placeId);
      if (!latestSnapshot || !editorialSnapshotsMatch(revision.basePayload, latestSnapshot.payload)) {
        throw new EditorialRevisionConflictError();
      }
      await tx.place.update({ where: { id: parsed.placeId }, data: { overviewMarkdown: payload.overviewMarkdown ?? null, version: { increment: 1 } } });
      await tx.editorialRevision.update({
        where: { id: revision.id },
        data: { activeKey: null, status: "published", reviewedAt: new Date(), reviewedById: user.id, publishedAt: new Date(), publishedById: user.id, updatedById: user.id }
      });
    });
  } catch (error) {
    if (error instanceof EditorialRevisionConflictError) redirect(`/admin/places/${current.slug}?revisionError=published-content-changed`);
    throw error;
  }
  revalidatePlacePaths(current.slug);
  redirect(`/admin/places/${current.slug}?revisionUpdated=published`);
}

export async function mergePlaces(formData: FormData) {
  await assertCapability("manage_sensitive_actions");
  await requireAdminSession();

  const parsed = mergePlacesSchema.parse({
    sourcePlaceId: formData.get("sourcePlaceId"),
    targetPlaceId: formData.get("targetPlaceId")
  });
  const [source, target] = await Promise.all([
    db.place.findUnique({
      where: { id: parsed.sourcePlaceId },
      include: {
        relationshipsFrom: true,
        relationshipsTo: true,
        saints: true
      }
    }),
    db.place.findUnique({
      where: { id: parsed.targetPlaceId },
      include: { saints: true }
    })
  ]);

  if (!source || !target) redirect("/admin/places");

  await db.$transaction(async (tx) => {
    const targetLinksBySaintId = new Map(target.saints.map((link) => [link.saintId, link]));

    for (const sourceLink of source.saints) {
      const targetLink = targetLinksBySaintId.get(sourceLink.saintId);

      if (targetLink) {
        await tx.saintPlace.update({
          where: { id: targetLink.id },
          data: {
            placeType: getPreferredPlaceType(targetLink.placeType, sourceLink.placeType),
            notes: combineNotes(targetLink.notes, sourceLink.notes),
            routeOrder: targetLink.routeOrder ?? sourceLink.routeOrder,
            routeLabel: targetLink.routeLabel ?? sourceLink.routeLabel,
            routeConfidence: targetLink.routeConfidence ?? sourceLink.routeConfidence
          }
        });
        await tx.saintPlace.delete({ where: { id: sourceLink.id } });
        continue;
      }

      await tx.saintPlace.update({
        where: { id: sourceLink.id },
        data: { placeId: target.id }
      });
    }

    await tx.place.updateMany({
      where: { parentStateId: source.id },
      data: { parentStateId: target.id }
    });
    await movePlaceRelationships(tx, source, target.id);
    await tx.editorialRevision.updateMany({
      where: { entityType: "place", entityId: source.id, status: { in: ["draft", "needs_review"] } },
      data: { activeKey: null, status: "archived" }
    });
    await tx.place.delete({ where: { id: source.id } });
  });

  revalidatePlacePaths(source.slug);
  revalidatePlacePaths(target.slug);
  redirect(`/admin/places/${target.slug}`);
}

async function requireAdminSession(capability: Capability = "edit_structured_content") {
  const user = await requireCapability(capability);
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/admin");
  }
  return user;
}

async function getPlaceNarrativeSnapshot(client: Prisma.TransactionClient | typeof db, placeId: string) {
  const place = await client.place.findUnique({ where: { id: placeId }, select: { slug: true, version: true, overviewMarkdown: true } });
  if (!place) return null;
  const payload: PlaceNarrativeRevision = { overviewMarkdown: place.overviewMarkdown ?? undefined };
  return { slug: place.slug, version: place.version, payload };
}

function emptyToUndefined(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function parseList(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return [];
  return Array.from(new Set(value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean)));
}

function parseStringList(values: FormDataEntryValue[]) {
  return Array.from(new Set(values.flatMap((value) => {
    if (typeof value !== "string") return [];
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  })));
}

function combineNotes(first: string | null, second: string | null) {
  return [first, second].filter(Boolean).join("\n\n") || null;
}

function getPreferredPlaceType(first: PlaceType, second: PlaceType): PlaceType {
  const firstRank = saintPlaceTypeRank.get(first) ?? 99;
  const secondRank = saintPlaceTypeRank.get(second) ?? 99;
  return secondRank < firstRank ? second : first;
}

function getPlaceKindForScope(placeScope: "locality" | "state" | "country"): PlaceKind {
  return placeScope;
}

async function syncParentStateRelationship(
  tx: Prisma.TransactionClient,
  placeId: string,
  parentStateId: string | null | undefined
) {
  await tx.placeRelationship.deleteMany({
    where: {
      fromPlaceId: placeId,
      relationshipType: "contained_in",
      notes: LEGACY_PARENT_STATE_RELATIONSHIP_NOTE
    }
  });

  if (!parentStateId) return;

  await tx.placeRelationship.upsert({
    where: {
      fromPlaceId_toPlaceId_relationshipType: {
        fromPlaceId: placeId,
        toPlaceId: parentStateId,
        relationshipType: "contained_in"
      }
    },
    create: {
      fromPlaceId: placeId,
      toPlaceId: parentStateId,
      relationshipType: "contained_in",
      confidence: "high",
      notes: LEGACY_PARENT_STATE_RELATIONSHIP_NOTE
    },
    update: {
      confidence: "high",
      notes: LEGACY_PARENT_STATE_RELATIONSHIP_NOTE
    }
  });
}

async function movePlaceRelationships(
  tx: Prisma.TransactionClient,
  source: {
    id: string;
    relationshipsFrom: Array<{
      toPlaceId: string;
      relationshipType: PlaceRelationshipType;
      confidence: Confidence;
      notes: string | null;
    }>;
    relationshipsTo: Array<{
      fromPlaceId: string;
      relationshipType: PlaceRelationshipType;
      confidence: Confidence;
      notes: string | null;
    }>;
  },
  targetPlaceId: string
) {
  for (const relationship of source.relationshipsFrom) {
    if (relationship.toPlaceId === targetPlaceId) continue;
    await upsertPlaceRelationship(tx, {
      fromPlaceId: targetPlaceId,
      toPlaceId: relationship.toPlaceId,
      relationshipType: relationship.relationshipType,
      confidence: relationship.confidence,
      notes: relationship.notes
    });
  }

  for (const relationship of source.relationshipsTo) {
    if (relationship.fromPlaceId === targetPlaceId) continue;
    await upsertPlaceRelationship(tx, {
      fromPlaceId: relationship.fromPlaceId,
      toPlaceId: targetPlaceId,
      relationshipType: relationship.relationshipType,
      confidence: relationship.confidence,
      notes: relationship.notes
    });
  }

  await tx.placeRelationship.deleteMany({
    where: {
      OR: [
        { fromPlaceId: source.id },
        { toPlaceId: source.id }
      ]
    }
  });
}

async function upsertPlaceRelationship(
  tx: Prisma.TransactionClient,
  relationship: {
    fromPlaceId: string;
    toPlaceId: string;
    relationshipType: PlaceRelationshipType;
    confidence: Confidence;
    notes: string | null;
  }
) {
  if (relationship.fromPlaceId === relationship.toPlaceId) return;

  await tx.placeRelationship.upsert({
    where: {
      fromPlaceId_toPlaceId_relationshipType: {
        fromPlaceId: relationship.fromPlaceId,
        toPlaceId: relationship.toPlaceId,
        relationshipType: relationship.relationshipType
      }
    },
    create: relationship,
    update: {
      confidence: relationship.confidence,
      notes: relationship.notes
    }
  });
}

async function getUniquePlaceSlug(name: string, placeId: string) {
  const baseSlug = toSlug(name) || "place";
  let candidate = baseSlug;
  let suffix = 2;

  while (await db.place.findFirst({ where: { slug: candidate, NOT: { id: placeId } }, select: { id: true } })) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function revalidatePlacePaths(slug: string) {
  revalidateTag(PUBLIC_CACHE_TAGS.places);
  revalidateTag(PUBLIC_CACHE_TAGS.saints);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/places");
  revalidatePath("/places");
  revalidatePath(`/places/${slug}`);
  revalidatePath("/map");
}
