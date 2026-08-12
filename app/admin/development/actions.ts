"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { assertCapability } from "@/lib/admin-access";
import {
  assertRegisteredDevelopmentExperience,
  DEVELOPMENT_EXPERIENCES_CACHE_TAG
} from "@/lib/development-experiences";
import { db } from "@/lib/db";

const updateSchema = z.object({
  key: z.string().trim().min(1).max(120),
  status: z.enum(["off", "admin_preview", "public"])
});

export async function updateDevelopmentExperience(formData: FormData) {
  const user = await assertCapability("manage_development_experiences");
  const parsed = updateSchema.safeParse({
    key: formData.get("key"),
    status: formData.get("status")
  });
  if (!parsed.success) throw new Error("Development experience settings are invalid.");

  assertRegisteredDevelopmentExperience(parsed.data.key);
  await db.developmentExperience.upsert({
    where: { key: parsed.data.key },
    create: {
      key: parsed.data.key,
      status: parsed.data.status,
      updatedByEmail: user.email
    },
    update: {
      status: parsed.data.status,
      updatedByEmail: user.email
    }
  });

  revalidateTag(DEVELOPMENT_EXPERIENCES_CACHE_TAG);
  revalidatePath("/admin/development");
  revalidatePath("/", "layout");
}
