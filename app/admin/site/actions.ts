"use server";

import type { Route } from "next";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/lib/generated/prisma/client";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { assertCapability } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { PUBLIC_CACHE_TAGS } from "@/lib/public-cache";
import { SITE_CONFIG_ID } from "@/lib/site-config";
import { ABOUT_DISCOVERY_ITEM_LIMIT, ABOUT_PAGE_SECTION_LIMIT, getFooterContent } from "@/lib/site-content";

const httpsUrl = z
  .string()
  .trim()
  .url("Enter a valid URL.")
  .max(1000)
  .refine(isHttpsUrl, "Use an HTTPS URL.");

const footerConfigSchema = z.object({
  imprintUrl: httpsUrl,
  privacyPolicyUrl: httpsUrl
});

const aboutPageConfigSchema = z
  .object({
    aboutEyebrow: z.string().trim().min(1).max(80),
    aboutTitle: z.string().trim().min(1).max(160),
    aboutIntroduction: z.string().trim().min(1).max(1000),
    aboutHeroImageId: z.string().cuid().optional(),
    aboutVisionImageId: z.string().cuid().optional(),
    aboutStoryImageId: z.string().cuid().optional(),
    aboutGuruImageId: z.string().cuid().optional(),
    aboutDiscoveryTitle: z.string().trim().min(1).max(160),
    aboutDiscoveryItemTitles: z.array(z.string().trim().min(1).max(80)).min(1).max(ABOUT_DISCOVERY_ITEM_LIMIT),
    aboutDiscoveryItemBodies: z.array(z.string().trim().min(1).max(300)).min(1).max(ABOUT_DISCOVERY_ITEM_LIMIT),
    aboutDiscoveryItemHrefs: z.array(z.string().trim().min(1).max(500)).min(1).max(ABOUT_DISCOVERY_ITEM_LIMIT),
    aboutDiscoveryItemIcons: z.array(z.enum(["sparkles", "book", "map", "flame"])).min(1).max(ABOUT_DISCOVERY_ITEM_LIMIT),
    aboutSectionTitles: z.array(z.string().trim().min(1).max(160)).min(1).max(ABOUT_PAGE_SECTION_LIMIT),
    aboutSectionBodies: z.array(z.string().trim().min(1).max(5000)).min(1).max(ABOUT_PAGE_SECTION_LIMIT)
  })
  .refine(
    ({ aboutSectionBodies, aboutSectionTitles }) => aboutSectionBodies.length === aboutSectionTitles.length,
    { message: "Every About section must have a title and body." }
  )
  .refine(
    ({ aboutDiscoveryItemBodies, aboutDiscoveryItemHrefs, aboutDiscoveryItemIcons, aboutDiscoveryItemTitles }) =>
      new Set([aboutDiscoveryItemBodies.length, aboutDiscoveryItemHrefs.length, aboutDiscoveryItemIcons.length, aboutDiscoveryItemTitles.length]).size === 1,
    { message: "Every discovery card must have a title, body, destination, and icon." }
  );

const indexHeroConfigSchema = z.object({ saintsHeroImageId: z.string().cuid().optional(), traditionsHeroImageId: z.string().cuid().optional(), mapHeroImageId: z.string().cuid().optional(), saintsHeroFocalX: z.coerce.number().min(0).max(100), saintsHeroFocalY: z.coerce.number().min(0).max(100), traditionsHeroFocalX: z.coerce.number().min(0).max(100), traditionsHeroFocalY: z.coerce.number().min(0).max(100), mapHeroFocalX: z.coerce.number().min(0).max(100), mapHeroFocalY: z.coerce.number().min(0).max(100) });

export async function updateIndexHeroConfig(formData: FormData) {
  const { email } = await requireAdminSession();
  const parsed = indexHeroConfigSchema.parse({ saintsHeroImageId: emptyToUndefined(formData.get("saintsHeroImageId")), traditionsHeroImageId: emptyToUndefined(formData.get("traditionsHeroImageId")), mapHeroImageId: emptyToUndefined(formData.get("mapHeroImageId")), saintsHeroFocalX: formData.get("saintsHeroFocalX") ?? 50, saintsHeroFocalY: formData.get("saintsHeroFocalY") ?? 30, traditionsHeroFocalX: formData.get("traditionsHeroFocalX") ?? 50, traditionsHeroFocalY: formData.get("traditionsHeroFocalY") ?? 30, mapHeroFocalX: formData.get("mapHeroFocalX") ?? 50, mapHeroFocalY: formData.get("mapHeroFocalY") ?? 30 });
  const footerDefaults = getFooterContent();
  await db.siteConfig.upsert({ where: { id: SITE_CONFIG_ID }, create: { id: SITE_CONFIG_ID, imprintUrl: footerDefaults.imprint.href, privacyPolicyUrl: footerDefaults.privacyPolicy.href, ...parsed, updatedByEmail: email }, update: { ...parsed, updatedByEmail: email } });
  revalidateTag(PUBLIC_CACHE_TAGS.site);
  revalidatePath("/saints"); revalidatePath("/traditions"); revalidatePath("/map"); revalidatePath("/admin/site/directory-headers");
  redirect("/admin/site/directory-headers?heroes=saved" as Route);
}

export async function updateFooterConfig(formData: FormData) {
  const { email } = await requireAdminSession();
  const parsed = footerConfigSchema.parse({
    imprintUrl: formData.get("imprintUrl"),
    privacyPolicyUrl: formData.get("privacyPolicyUrl")
  });

  await db.$transaction(async (tx) => {
    const before = await tx.siteConfig.findUnique({
      where: { id: SITE_CONFIG_ID },
      select: {
        imprintUrl: true,
        privacyPolicyUrl: true
      }
    });
    const config = await tx.siteConfig.upsert({
      where: { id: SITE_CONFIG_ID },
      create: {
        id: SITE_CONFIG_ID,
        ...parsed,
        updatedByEmail: email
      },
      update: {
        ...parsed,
        updatedByEmail: email
      }
    });

    await tx.auditEvent.create({
      data: {
        userId: email,
        action: "update_site_config",
        entityType: "SiteConfig",
        entityId: SITE_CONFIG_ID,
        beforeJson: before ? toInputJson(before) : Prisma.JsonNull,
        afterJson: toInputJson({
          imprintUrl: config.imprintUrl,
          privacyPolicyUrl: config.privacyPolicyUrl
        })
      }
    });
  });

  revalidatePath("/", "layout");
  revalidateTag(PUBLIC_CACHE_TAGS.site);
  revalidatePath("/admin/site/footer");
  redirect("/admin/site/footer?footer=saved" as Route);
}

export async function updateAboutPageConfig(formData: FormData) {
  const { email } = await requireAdminSession();
  const parsed = aboutPageConfigSchema.parse({
    aboutEyebrow: formData.get("aboutEyebrow"),
    aboutTitle: formData.get("aboutTitle"),
    aboutIntroduction: formData.get("aboutIntroduction"),
    aboutHeroImageId: emptyToUndefined(formData.get("aboutHeroImageId")),
    aboutVisionImageId: emptyToUndefined(formData.get("aboutVisionImageId")),
    aboutStoryImageId: emptyToUndefined(formData.get("aboutStoryImageId")),
    aboutGuruImageId: emptyToUndefined(formData.get("aboutGuruImageId")),
    aboutDiscoveryTitle: formData.get("aboutDiscoveryTitle"),
    aboutDiscoveryItemTitles: formValues(formData, "aboutDiscoveryItemTitle"),
    aboutDiscoveryItemBodies: formValues(formData, "aboutDiscoveryItemBody"),
    aboutDiscoveryItemHrefs: formValues(formData, "aboutDiscoveryItemHref"),
    aboutDiscoveryItemIcons: formValues(formData, "aboutDiscoveryItemIcon"),
    aboutSectionTitles: formValues(formData, "aboutSectionTitle"),
    aboutSectionBodies: formValues(formData, "aboutSectionBody")
  });
  const footerDefaults = getFooterContent();

  await db.$transaction(async (tx) => {
    const before = await tx.siteConfig.findUnique({
      where: { id: SITE_CONFIG_ID },
      select: {
        aboutEyebrow: true,
        aboutTitle: true,
        aboutIntroduction: true,
        aboutHeroImageId: true,
        aboutVisionImageId: true,
        aboutStoryImageId: true,
        aboutGuruImageId: true,
        aboutDiscoveryTitle: true,
        aboutDiscoveryItemTitles: true,
        aboutDiscoveryItemBodies: true,
        aboutDiscoveryItemHrefs: true,
        aboutDiscoveryItemIcons: true,
        aboutSectionTitles: true,
        aboutSectionBodies: true
      }
    });
    const config = await tx.siteConfig.upsert({
      where: { id: SITE_CONFIG_ID },
      create: {
        id: SITE_CONFIG_ID,
        imprintUrl: footerDefaults.imprint.href,
        privacyPolicyUrl: footerDefaults.privacyPolicy.href,
        ...parsed,
        updatedByEmail: email
      },
      update: {
        ...parsed,
        updatedByEmail: email
      }
    });

    await tx.auditEvent.create({
      data: {
        userId: email,
        action: "update_about_page_config",
        entityType: "SiteConfig",
        entityId: SITE_CONFIG_ID,
        beforeJson: before ? toInputJson(before) : Prisma.JsonNull,
        afterJson: toInputJson({
          aboutEyebrow: config.aboutEyebrow,
          aboutTitle: config.aboutTitle,
          aboutIntroduction: config.aboutIntroduction,
          aboutHeroImageId: config.aboutHeroImageId,
          aboutVisionImageId: config.aboutVisionImageId,
          aboutStoryImageId: config.aboutStoryImageId,
          aboutGuruImageId: config.aboutGuruImageId,
          aboutDiscoveryTitle: config.aboutDiscoveryTitle,
          aboutDiscoveryItemTitles: config.aboutDiscoveryItemTitles,
          aboutDiscoveryItemBodies: config.aboutDiscoveryItemBodies,
          aboutDiscoveryItemHrefs: config.aboutDiscoveryItemHrefs,
          aboutDiscoveryItemIcons: config.aboutDiscoveryItemIcons,
          aboutSectionTitles: config.aboutSectionTitles,
          aboutSectionBodies: config.aboutSectionBodies
        })
      }
    });
  });

  revalidatePath("/about");
  revalidateTag(PUBLIC_CACHE_TAGS.site);
  revalidatePath("/admin/site/about");
  redirect("/admin/site/about?about=saved" as Route);
}

async function requireAdminSession() {
  await assertCapability("manage_site");
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    redirect("/admin");
  }
  return { email };
}

function toInputJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function formValues(formData: FormData, name: string) {
  return formData.getAll(name).filter((value): value is string => typeof value === "string");
}

function emptyToUndefined(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return undefined;
  return value.trim() || undefined;
}
