"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { Prisma } from "@/lib/generated/prisma/client";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { acceptInstagramDerivedClaim, createDirectInstagramClaimsForSaint, pipeAcceptedInstagramClaimsToSaint } from "@/lib/instagram-claims";
import { extractInstagramFirstPageDraft } from "@/lib/instagram-first-page-extraction";
import { compactMetadata, parseInstagramFirstPageMetadata } from "@/lib/instagram-metadata";
import { toSlug } from "@/lib/slugs";

const itemStatusSchema = z.object({
  instagramItemId: z.string().cuid(),
  status: z.enum(["needs_review", "suggested", "matched", "ignored", "published"]),
  returnTo: z.string().optional()
});

const linkStatusSchema = z.object({
  instagramItemSaintId: z.string().cuid(),
  matchStatus: z.enum(["suggested", "needs_review", "matched", "ignored", "published"]),
  returnTo: z.string().optional()
});

const itemSaintSchema = z.object({
  instagramItemId: z.string().cuid(),
  saintId: z.string().cuid(),
  matchConfidence: z.enum(["low", "medium", "high"]).default("medium"),
  returnTo: z.string().optional()
});

const createSaintFromInstagramSchema = z.object({
  instagramItemId: z.string().cuid(),
  displayName: z.string().trim().min(1).max(200),
  canonicalName: z.string().trim().min(1).max(200),
  shortDescription: z.string().trim().max(500).optional(),
  birthDateRaw: z.string().trim().max(160).optional(),
  samadhiDateRaw: z.string().trim().max(160).optional(),
  tradition: z.string().trim().max(240).optional()
});

const firstPageMetadataSchema = z.object({
  instagramItemId: z.string().cuid(),
  returnTo: z.string().optional(),
  intent: z.enum(["save", "parse"]).default("save"),
  firstPageText: z.string().trim().max(8000).optional(),
  displayName: z.string().trim().max(200).optional(),
  subtitle: z.string().trim().max(200).optional(),
  born: z.string().trim().max(160).optional(),
  samadhi: z.string().trim().max(160).optional(),
  keyPlace: z.string().trim().max(500).optional(),
  tradition: z.string().trim().max(240).optional(),
  guru: z.string().trim().max(500).optional()
});

const firstPageImageExtractionSchema = z.object({
  instagramItemId: z.string().cuid(),
  returnTo: z.string().optional()
});

const derivedClaimSchema = z.object({
  instagramItemId: z.string().cuid(),
  claimType: z.enum(["alias", "birth_date", "guru", "place", "samadhi_date", "tradition"]),
  rawValue: z.string().trim().min(1).max(500),
  sourceField: z.string().trim().max(80).optional(),
  targetEntityType: z.enum(["Place", "Saint", "Tradition"]).optional(),
  targetEntityId: z.string().cuid().optional(),
  confidence: z.enum(["low", "medium", "high"]).default("medium"),
  returnTo: z.string().optional()
});

export async function updateInstagramItemStatus(formData: FormData) {
  await requireAdminSession();

  const parsed = itemStatusSchema.parse({
    instagramItemId: formData.get("instagramItemId"),
    status: formData.get("status"),
    returnTo: formData.get("returnTo") || undefined
  });

  const item = await db.instagramItem.update({
    where: { id: parsed.instagramItemId },
    data: { status: parsed.status },
    include: {
      saints: {
        include: { saint: { select: { slug: true } } }
      }
    }
  });

  revalidateInstagramPaths(item.saints.map((link) => link.saint.slug));
  redirect(getReturnTo(parsed.returnTo) as Route);
}

export async function updateInstagramItemSaintStatus(formData: FormData) {
  await requireAdminSession();

  const parsed = linkStatusSchema.parse({
    instagramItemSaintId: formData.get("instagramItemSaintId"),
    matchStatus: formData.get("matchStatus"),
    returnTo: formData.get("returnTo") || undefined
  });
  const now = new Date();

  const link = await db.$transaction(async (tx) => {
    const updatedLink = await tx.instagramItemSaint.update({
      where: { id: parsed.instagramItemSaintId },
      data: {
        matchStatus: parsed.matchStatus,
        reviewedAt: parsed.matchStatus === "matched" || parsed.matchStatus === "published" || parsed.matchStatus === "ignored" ? now : null
      },
      include: {
        saint: { select: { slug: true } }
      }
    });

    if (parsed.matchStatus === "matched" || parsed.matchStatus === "published") {
      await tx.instagramItem.update({
        where: { id: updatedLink.instagramItemId },
        data: { status: "matched" }
      });
      await promoteSaintForInstagramMatch(tx, updatedLink.saintId);
      await createDirectInstagramClaimsForSaint(tx, updatedLink.instagramItemId, updatedLink.saintId);
      await pipeAcceptedInstagramClaimsToSaint(tx, updatedLink.instagramItemId, updatedLink.saintId);
    }

    return updatedLink;
  });

  revalidateInstagramPaths([link.saint.slug]);
  redirect(getReturnTo(parsed.returnTo) as Route);
}

export async function attachSaintToInstagramItem(formData: FormData) {
  await requireAdminSession();

  const parsed = itemSaintSchema.parse({
    instagramItemId: formData.get("instagramItemId"),
    saintId: formData.get("saintId"),
    matchConfidence: formData.get("matchConfidence") || "medium",
    returnTo: formData.get("returnTo") || undefined
  });

  const existingLinks = await db.instagramItemSaint.count({
    where: {
      instagramItemId: parsed.instagramItemId,
      matchStatus: { in: ["matched", "published"] }
    }
  });

  const link = await db.$transaction(async (tx) => {
    const updatedLink = await tx.instagramItemSaint.upsert({
      where: {
        instagramItemId_saintId: {
          instagramItemId: parsed.instagramItemId,
          saintId: parsed.saintId
        }
      },
      create: {
        instagramItemId: parsed.instagramItemId,
        saintId: parsed.saintId,
        matchStatus: "matched",
        matchConfidence: parsed.matchConfidence,
        isPrimary: existingLinks === 0,
        reviewedAt: new Date(),
        notes: "Matched manually in the Instagram review workflow."
      },
      update: {
        matchStatus: "matched",
        matchConfidence: parsed.matchConfidence,
        reviewedAt: new Date(),
        notes: "Matched manually in the Instagram review workflow."
      },
      include: {
        saint: { select: { slug: true } }
      }
    });

    await tx.instagramItem.update({
      where: { id: parsed.instagramItemId },
      data: { status: "matched" }
    });
    await promoteSaintForInstagramMatch(tx, parsed.saintId);
    await createDirectInstagramClaimsForSaint(tx, parsed.instagramItemId, parsed.saintId);
    await pipeAcceptedInstagramClaimsToSaint(tx, parsed.instagramItemId, parsed.saintId);

    return updatedLink;
  });

  revalidateInstagramPaths([link.saint.slug]);
  redirect(getReturnTo(parsed.returnTo) as Route);
}

export async function createSaintFromInstagramItem(formData: FormData) {
  await requireAdminSession();

  const parsed = createSaintFromInstagramSchema.parse({
    instagramItemId: formData.get("instagramItemId"),
    displayName: formData.get("displayName"),
    canonicalName: formData.get("canonicalName"),
    shortDescription: emptyToUndefined(formData.get("shortDescription")),
    birthDateRaw: emptyToUndefined(formData.get("birthDateRaw")),
    samadhiDateRaw: emptyToUndefined(formData.get("samadhiDateRaw")),
    tradition: emptyToUndefined(formData.get("tradition"))
  });

  const slug = await uniqueSaintSlug(toSlug(parsed.displayName || parsed.canonicalName));
  const saint = await db.$transaction(async (tx) => {
    const createdSaint = await tx.saint.create({
      data: {
        slug,
        displayName: parsed.displayName,
        canonicalName: parsed.canonicalName,
        shortDescription: parsed.shortDescription,
        birthDateRaw: parsed.birthDateRaw,
        samadhiDateRaw: parsed.samadhiDateRaw,
        dateNotes: parsed.tradition ? `Instagram first-page tradition: ${parsed.tradition}` : undefined,
        status: "needs_review",
        hasInstagramContent: true
      },
      select: { id: true, slug: true }
    });

    await tx.instagramItem.update({
      where: { id: parsed.instagramItemId },
      data: { status: "matched" }
    });

    await tx.instagramItemSaint.create({
      data: {
        instagramItemId: parsed.instagramItemId,
        saintId: createdSaint.id,
        matchStatus: "matched",
        matchConfidence: "high",
        isPrimary: true,
        reviewedAt: new Date(),
        notes: "Created saint from Instagram review workflow."
      }
    });
    await createDirectInstagramClaimsForSaint(tx, parsed.instagramItemId, createdSaint.id);
    await pipeAcceptedInstagramClaimsToSaint(tx, parsed.instagramItemId, createdSaint.id);

    return createdSaint;
  });

  revalidateInstagramPaths([saint.slug]);
  redirect(`/admin/saints/${saint.slug}` as Route);
}

export async function updateInstagramFirstPageMetadata(formData: FormData) {
  await requireAdminSession();

  const parsed = firstPageMetadataSchema.parse({
    instagramItemId: formData.get("instagramItemId"),
    returnTo: formData.get("returnTo") || undefined,
    intent: formData.get("intent") || "save",
    firstPageText: emptyToUndefined(formData.get("firstPageText")),
    displayName: emptyToUndefined(formData.get("displayName")),
    subtitle: emptyToUndefined(formData.get("subtitle")),
    born: emptyToUndefined(formData.get("born")),
    samadhi: emptyToUndefined(formData.get("samadhi")),
    keyPlace: emptyToUndefined(formData.get("keyPlace")),
    tradition: emptyToUndefined(formData.get("tradition")),
    guru: emptyToUndefined(formData.get("guru"))
  });

  const metadata = parsed.intent === "parse"
    ? parseInstagramFirstPageMetadata(parsed.firstPageText)
    : compactMetadata({
        displayName: parsed.displayName,
        subtitle: parsed.subtitle,
        born: parsed.born,
        samadhi: parsed.samadhi,
        keyPlace: parsed.keyPlace,
        tradition: parsed.tradition,
        guru: parsed.guru
      });

  await db.$transaction(async (tx) => {
    await tx.instagramItem.update({
      where: { id: parsed.instagramItemId },
      data: {
        firstPageText: parsed.firstPageText,
        firstPageMetadata: Object.keys(metadata).length > 0 ? metadata as Prisma.InputJsonValue : Prisma.JsonNull
      }
    });

    const links = await tx.instagramItemSaint.findMany({
      where: {
        instagramItemId: parsed.instagramItemId,
        matchStatus: { in: ["matched", "published"] }
      },
      select: { saintId: true }
    });
    for (const link of links) {
      await createDirectInstagramClaimsForSaint(tx, parsed.instagramItemId, link.saintId);
    }
  });

  revalidatePath("/admin/instagram");
  revalidatePath(`/admin/instagram/${parsed.instagramItemId}`);
  redirect(getReturnTo(parsed.returnTo) as Route);
}

export async function extractInstagramFirstPageFromImage(formData: FormData) {
  await requireAdminSession();

  const parsed = firstPageImageExtractionSchema.parse({
    instagramItemId: formData.get("instagramItemId"),
    returnTo: formData.get("returnTo") || undefined
  });

  const item = await db.instagramItem.findUnique({
    where: { id: parsed.instagramItemId },
    select: {
      id: true,
      captionText: true,
      thumbnailUrl: true
    }
  });
  if (!item) redirect(getExtractionReturnTo(parsed.returnTo, "error", "Instagram item was not found.") as Route);

  const externalRecord = await db.externalRecord.findFirst({
    where: { sourceType: "instagram", entityType: "InstagramItem", entityId: item.id },
    orderBy: { lastSeenAt: "desc" },
    select: { rawPayloadJson: true }
  });
  const draft = await extractInstagramFirstPageDraft({
    rawPayloadJson: externalRecord?.rawPayloadJson,
    captionText: item.captionText,
    thumbnailUrl: item.thumbnailUrl
  });
  const hasMetadata = Object.keys(draft.metadata).length > 0;

  if (draft.firstPageText || hasMetadata) {
    await db.$transaction(async (tx) => {
      await tx.instagramItem.update({
        where: { id: parsed.instagramItemId },
        data: {
          firstPageText: draft.firstPageText,
          firstPageMetadata: hasMetadata ? draft.metadata as Prisma.InputJsonValue : Prisma.JsonNull
        }
      });

      const links = await tx.instagramItemSaint.findMany({
        where: {
          instagramItemId: parsed.instagramItemId,
          matchStatus: { in: ["matched", "published"] }
        },
        select: { saintId: true }
      });
      for (const link of links) {
        await createDirectInstagramClaimsForSaint(tx, parsed.instagramItemId, link.saintId);
      }
    });
  }

  revalidatePath("/admin/instagram");
  revalidatePath(`/admin/instagram/${parsed.instagramItemId}`);
  const status = draft.firstPageText || hasMetadata ? "success" : "error";
  const message = draft.firstPageText || hasMetadata
    ? `Extracted first-page biodata from ${formatExtractionSource(draft.source)}.`
    : draft.error ?? "No first-page biodata could be extracted.";
  redirect(getExtractionReturnTo(parsed.returnTo, status, message) as Route);
}

export async function acceptInstagramClaim(formData: FormData) {
  await requireAdminSession();

  const parsed = derivedClaimSchema.parse({
    instagramItemId: formData.get("instagramItemId"),
    claimType: formData.get("claimType"),
    rawValue: formData.get("rawValue"),
    sourceField: emptyToUndefined(formData.get("sourceField")),
    targetEntityType: emptyToUndefined(formData.get("targetEntityType")),
    targetEntityId: emptyToUndefined(formData.get("targetEntityId")),
    confidence: formData.get("confidence") || "medium",
    returnTo: formData.get("returnTo") || undefined
  });

  const affectedSaintSlugs = await db.$transaction(async (tx) => {
    await acceptInstagramDerivedClaim(tx, parsed);
    const links = await tx.instagramItemSaint.findMany({
      where: {
        instagramItemId: parsed.instagramItemId,
        matchStatus: { in: ["matched", "published"] }
      },
      select: { saint: { select: { slug: true } } }
    });

    return links.map((link) => link.saint.slug);
  });

  revalidateInstagramPaths(affectedSaintSlugs);
  redirect(getReturnTo(parsed.returnTo) as Route);
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

async function promoteSaintForInstagramMatch(tx: Prisma.TransactionClient, saintId: string) {
  await tx.saint.updateMany({
    where: { id: saintId, status: "draft" },
    data: {
      status: "needs_review",
      hasInstagramContent: true,
      reviewedAt: null,
      publishedAt: null
    }
  });

  await tx.saint.updateMany({
    where: { id: saintId, status: { not: "draft" } },
    data: { hasInstagramContent: true }
  });
}

function revalidateInstagramPaths(saintSlugs: string[]) {
  revalidatePath("/");
  revalidatePath("/saints");
  revalidatePath("/admin");
  revalidatePath("/admin/instagram");
  for (const slug of saintSlugs) {
    revalidatePath(`/saints/${slug}`);
    revalidatePath(`/admin/saints/${slug}`);
  }
}

function getReturnTo(value: string | undefined) {
  if (value?.startsWith("/admin/instagram")) return value;
  return "/admin/instagram";
}

function getExtractionReturnTo(value: string | undefined, status: "success" | "error", message: string) {
  const returnTo = getReturnTo(value);
  const [path, query = ""] = returnTo.split("?");
  const params = new URLSearchParams(query);
  params.set("firstPageExtraction", status);
  params.set("firstPageExtractionMessage", message);
  return `${path}?${params.toString()}`;
}

function formatExtractionSource(source: string) {
  if (source === "openai_vision") return "image AI";
  if (source === "stored_text") return "imported text";
  if (source === "caption") return "caption text";
  return "import data";
}

async function uniqueSaintSlug(baseSlug: string) {
  const root = baseSlug || "saint";
  let candidate = root;
  let counter = 2;

  while (await db.saint.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${root}-${counter}`;
    counter += 1;
  }

  return candidate;
}
