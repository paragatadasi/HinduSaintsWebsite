"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const contentStatusSchema = z.enum(["draft", "needs_review", "published", "hidden", "archived"]);

const saintBasicsSchema = z.object({
  saintId: z.string().cuid(),
  displayName: z.string().trim().min(1).max(200),
  canonicalName: z.string().trim().min(1).max(200),
  shortDescription: z.string().trim().max(500).optional(),
  biographySummary: z.string().trim().max(8000).optional()
});

const saintStatusSchema = z.object({
  saintId: z.string().cuid(),
  status: contentStatusSchema
});

export async function updateSaintBasics(formData: FormData) {
  await requireAdminSession();

  const parsed = saintBasicsSchema.parse({
    saintId: formData.get("saintId"),
    displayName: formData.get("displayName"),
    canonicalName: formData.get("canonicalName"),
    shortDescription: emptyToUndefined(formData.get("shortDescription")),
    biographySummary: emptyToUndefined(formData.get("biographySummary"))
  });

  const saint = await db.saint.update({
    where: { id: parsed.saintId },
    data: {
      displayName: parsed.displayName,
      canonicalName: parsed.canonicalName,
      shortDescription: parsed.shortDescription,
      biographySummary: parsed.biographySummary
    },
    select: { slug: true }
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

function revalidateSaintPaths(slug: string) {
  revalidatePath("/");
  revalidatePath("/saints");
  revalidatePath(`/saints/${slug}`);
  revalidatePath("/admin");
  revalidatePath("/admin/saints");
  revalidatePath(`/admin/saints/${slug}`);
}
