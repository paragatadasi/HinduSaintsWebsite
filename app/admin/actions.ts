"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/lib/generated/prisma/client";
import { z } from "zod";
import { setBulkDeletePassword } from "@/lib/admin-secrets";
import { auth } from "@/lib/auth";
import { assertCapability } from "@/lib/admin-access";
import { db } from "@/lib/db";

const bulkDeletePasswordSchema = z.object({
  password: z.string().min(10, "Use at least 10 characters.").max(200),
  confirmPassword: z.string().min(1)
}).refine((value) => value.password === value.confirmPassword, {
  message: "Passwords must match.",
  path: ["confirmPassword"]
});

export async function setBulkDeletePasswordAction(formData: FormData) {
  await assertCapability("manage_sensitive_actions");
  const { email } = await requireAdminSession();

  const parsed = bulkDeletePasswordSchema.parse({
    password: formData.get("bulkDeletePassword"),
    confirmPassword: formData.get("confirmBulkDeletePassword")
  });

  await setBulkDeletePassword(parsed.password, email);
  await db.auditEvent.create({
    data: {
      userId: email,
      action: "set_bulk_delete_password",
      entityType: "AdminSecret",
      entityId: "saints_bulk_delete_password",
      beforeJson: Prisma.JsonNull,
      afterJson: toInputJson({ configured: true })
    }
  });

  revalidatePath("/admin/users");
  redirect("/admin/users?sensitiveActionPassword=updated");
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
