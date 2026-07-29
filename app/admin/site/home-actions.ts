"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { HOME_PAGE_CONFIG_ID } from "@/lib/home-page-config";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const homePageConfigSchema = z.object({
  heroEyebrow: z.string().trim().max(24).optional(),
  heroTitle: z.string().trim().max(160).optional(),
  heroBody: z.string().trim().max(500).optional(),
  heroPrimaryLabel: z.string().trim().max(120).optional(),
  heroPrimaryHref: z.string().trim().max(500).optional(),
  heroSecondaryLabel: z.string().trim().max(120).optional(),
  heroSecondaryHref: z.string().trim().max(500).optional(),
  bannerImageId: z.string().cuid().optional(),
  bannerFocalX: z.coerce.number().min(0).max(100),
  bannerFocalY: z.coerce.number().min(0).max(100),
  bannerFocalWidth: z.coerce.number().min(10).max(100),
  bannerFocalHeight: z.coerce.number().min(10).max(100),
  featuredTraditionBannerImageId: z.string().cuid().optional(),
  featuredTraditionBannerFocalX: z.coerce.number().min(0).max(100),
  featuredTraditionBannerFocalY: z.coerce.number().min(0).max(100),
  featuredTraditionBannerFocalWidth: z.coerce.number().min(10).max(100),
  featuredTraditionBannerFocalHeight: z.coerce.number().min(10).max(100),
  featuredSaintIds: z.array(z.string().cuid()).max(12),
  featuredTraditionIds: z.array(z.string().cuid()).max(8),
  quoteEyebrow: z.string().trim().max(80).optional(),
  quoteText: z.string().trim().max(500).optional(),
  quoteSaintId: z.string().cuid()
});

export async function updateHomePageConfig(formData: FormData) {
  await requireAdminSession();

  const parsed = homePageConfigSchema.parse({
    heroEyebrow: emptyToUndefined(formData.get("heroEyebrow")),
    heroTitle: emptyToUndefined(formData.get("heroTitle")),
    heroBody: emptyToUndefined(formData.get("heroBody")),
    heroPrimaryLabel: emptyToUndefined(formData.get("heroPrimaryLabel")),
    heroPrimaryHref: emptyToUndefined(formData.get("heroPrimaryHref")),
    heroSecondaryLabel: emptyToUndefined(formData.get("heroSecondaryLabel")),
    heroSecondaryHref: emptyToUndefined(formData.get("heroSecondaryHref")),
    bannerImageId: emptyToUndefined(formData.get("bannerImageId")),
    bannerFocalX: formData.get("bannerFocalX") ?? 50,
    bannerFocalY: formData.get("bannerFocalY") ?? 50,
    bannerFocalWidth: formData.get("bannerFocalWidth") ?? 60,
    bannerFocalHeight: formData.get("bannerFocalHeight") ?? 60,
    featuredTraditionBannerImageId: emptyToUndefined(formData.get("featuredTraditionBannerImageId")),
    featuredTraditionBannerFocalX: formData.get("featuredTraditionBannerFocalX") ?? 50,
    featuredTraditionBannerFocalY: formData.get("featuredTraditionBannerFocalY") ?? 50,
    featuredTraditionBannerFocalWidth: formData.get("featuredTraditionBannerFocalWidth") ?? 60,
    featuredTraditionBannerFocalHeight: formData.get("featuredTraditionBannerFocalHeight") ?? 60,
    featuredSaintIds: uniqueFormValues(formData.getAll("featuredSaintId")),
    featuredTraditionIds: uniqueFormValues(formData.getAll("featuredTraditionId")),
    quoteEyebrow: emptyToUndefined(formData.get("quoteEyebrow")),
    quoteText: emptyToUndefined(formData.get("quoteText")),
    quoteSaintId: emptyToUndefined(formData.get("quoteSaintId"))
  });

  const quoteSaint = await db.saint.findFirst({
    where: {
      id: parsed.quoteSaintId,
      status: "published"
    },
    select: {
      displayName: true
    }
  });

  if (!quoteSaint) {
    throw new Error("Quote attribution must be a published saint.");
  }

  const data = {
    ...parsed,
    quoteAttribution: quoteSaint.displayName
  };

  await db.homePageConfig.upsert({
    where: { id: HOME_PAGE_CONFIG_ID },
    create: {
      id: HOME_PAGE_CONFIG_ID,
      ...data
    },
    update: data
  });

  revalidatePath("/");
  revalidatePath("/admin/site");
  redirect("/admin/site?homepage=saved#homepage" as Route);
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

function uniqueFormValues(values: FormDataEntryValue[]) {
  return Array.from(new Set(values.filter((value): value is string => typeof value === "string" && value.trim().length > 0)));
}
