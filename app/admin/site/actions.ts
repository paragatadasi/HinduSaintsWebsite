"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/lib/generated/prisma/client";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SITE_CONFIG_ID } from "@/lib/site-config";

const httpsUrl = z
  .string()
  .trim()
  .url("Enter a valid URL.")
  .max(1000)
  .refine(isHttpsUrl, "Use an HTTPS URL.");

const siteConfigSchema = z.object({
  imprintUrl: httpsUrl,
  privacyPolicyUrl: httpsUrl
});

export async function updateSiteConfig(formData: FormData) {
  const { email } = await requireAdminSession();
  const parsed = siteConfigSchema.parse({
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
  redirect("/admin/site?saved=true" as Route);
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
