"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PlaceType } from "@/lib/generated/prisma/client";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getKnownPlaceScope } from "@/lib/place-taxonomy";
import { toSlug } from "@/lib/slugs";

const placeScopeSchema = z.enum(["locality", "state"]);
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

const mergePlacesSchema = z.object({
  sourcePlaceId: z.string().cuid(),
  targetPlaceId: z.string().cuid()
}).refine((value) => value.sourcePlaceId !== value.targetPlaceId, {
  message: "Choose two different places."
});

export async function updatePlace(formData: FormData) {
  await requireAdminSession();

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
  const place = await db.place.update({
    where: { id: parsed.placeId },
    data: {
      name: parsed.name,
      slug,
      alternateNames: parsed.alternateNames,
      placeScope,
      parentStateId,
      country: parsed.country ?? null,
      overviewMarkdown: parsed.overviewMarkdown ?? null,
      notes: parsed.notes ?? null
    },
    select: { slug: true }
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
  const place = await db.$transaction(async (tx) => {
    const updatedPlace = await tx.place.update({
      where: { id: parsed.placeId },
      data: {
        name: parsed.name,
        slug,
        alternateNames: parsed.alternateNames,
        placeScope,
        parentStateId,
        country: parsed.country ?? null
      },
      select: { slug: true }
    });

    await tx.place.updateMany({
      where: { parentStateId: parsed.placeId },
      data: { parentStateId: null }
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
      }
    }

    return updatedPlace;
  });

  revalidatePlacePaths(existing.slug);
  revalidatePlacePaths(place.slug);
  redirect(`/admin/places/${place.slug}`);
}

export async function updatePlaceOtherPublicFields(formData: FormData) {
  await requireAdminSession();

  const parsed = placeOtherPublicFieldsSchema.parse({
    placeId: formData.get("placeId"),
    overviewMarkdown: emptyToUndefined(formData.get("overviewMarkdown")),
    notes: emptyToUndefined(formData.get("notes"))
  });
  const place = await db.place.update({
    where: { id: parsed.placeId },
    data: {
      overviewMarkdown: parsed.overviewMarkdown ?? null,
      notes: parsed.notes ?? null
    },
    select: { slug: true }
  });

  revalidatePlacePaths(place.slug);
  redirect(`/admin/places/${place.slug}`);
}

export async function mergePlaces(formData: FormData) {
  await requireAdminSession();

  const parsed = mergePlacesSchema.parse({
    sourcePlaceId: formData.get("sourcePlaceId"),
    targetPlaceId: formData.get("targetPlaceId")
  });
  const [source, target] = await Promise.all([
    db.place.findUnique({
      where: { id: parsed.sourcePlaceId },
      include: { saints: true }
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
    await tx.place.delete({ where: { id: source.id } });
  });

  revalidatePlacePaths(source.slug);
  revalidatePlacePaths(target.slug);
  redirect(`/admin/places/${target.slug}`);
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
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/places");
  revalidatePath("/places");
  revalidatePath(`/places/${slug}`);
  revalidatePath("/map");
}
