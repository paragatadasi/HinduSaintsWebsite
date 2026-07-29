"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/lib/generated/prisma/client";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SITE_CONFIG_ID } from "@/lib/site-config";
import { ABOUT_PAGE_SECTION_LIMIT, getFooterContent } from "@/lib/site-content";

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
    aboutSectionTitles: z.array(z.string().trim().min(1).max(160)).min(1).max(ABOUT_PAGE_SECTION_LIMIT),
    aboutSectionBodies: z.array(z.string().trim().min(1).max(5000)).min(1).max(ABOUT_PAGE_SECTION_LIMIT)
  })
  .refine(
    ({ aboutSectionBodies, aboutSectionTitles }) => aboutSectionBodies.length === aboutSectionTitles.length,
    { message: "Every About section must have a title and body." }
  );

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
  revalidatePath("/admin/site");
  redirect("/admin/site?footer=saved#footer" as Route);
}

export async function updateAboutPageConfig(formData: FormData) {
  const { email } = await requireAdminSession();
  const parsed = aboutPageConfigSchema.parse({
    aboutEyebrow: formData.get("aboutEyebrow"),
    aboutTitle: formData.get("aboutTitle"),
    aboutIntroduction: formData.get("aboutIntroduction"),
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
          aboutSectionTitles: config.aboutSectionTitles,
          aboutSectionBodies: config.aboutSectionBodies
        })
      }
    });
  });

  revalidatePath("/about");
  revalidatePath("/admin/site");
  redirect("/admin/site?about=saved#about" as Route);
}

async function requireAdminSession() {
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
