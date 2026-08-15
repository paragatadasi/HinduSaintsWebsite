"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertCapability } from "@/lib/admin-access";
import { db } from "@/lib/db";

const roles = ["site_admin", "data_admin", "editor", "fact_checker", "writer", "curator", "translator"] as const;
const optionalProfileField = z.preprocess(
  (value) => typeof value === "string" && value.trim() ? value : undefined,
  z.string().trim().max(200).optional()
);
const profileFields = {
  name: optionalProfileField,
  spiritualName: optionalProfileField,
  telegramId: optionalProfileField,
  instagramId: optionalProfileField
};
const accessSchema = z.object({
  userId: z.string().cuid(),
  ...profileFields,
  roles: z.array(z.enum(roles)).min(1),
  active: z.boolean()
});
const createSchema = z.object({
  email: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
  ...profileFields,
  roles: z.array(z.enum(roles)).min(1)
});

export async function createAdminUser(formData: FormData) {
  const actor = await assertCapability("manage_users");
  const parsed = createSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    spiritualName: formData.get("spiritualName"),
    telegramId: formData.get("telegramId"),
    instagramId: formData.get("instagramId"),
    roles: formData.getAll("roles")
  });
  if (!parsed.success) redirectWith("error", "Check the profile fields, enter a valid email, and select at least one role.");

  const existing = await db.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
  if (existing) redirectWith("error", "That email already has a user record. Update it below instead.");

  await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name,
        spiritualName: parsed.data.spiritualName,
        telegramId: parsed.data.telegramId,
        instagramId: parsed.data.instagramId,
        roles: parsed.data.roles,
        active: true
      }
    });
    await tx.adminAccessAudit.create({
      data: {
        targetUserId: user.id,
        actorEmail: actor.email,
        action: "created",
        beforeRoles: [],
        afterRoles: parsed.data.roles,
        beforeActive: false,
        afterActive: true
      }
    });
  });
  revalidatePath("/admin/users");
  redirectWith("created", parsed.data.email);
}

export async function updateUserAccess(formData: FormData) {
  const actor = await assertCapability("manage_users");
  const parsed = accessSchema.safeParse({
    userId: formData.get("userId"),
    name: formData.get("name"),
    spiritualName: formData.get("spiritualName"),
    telegramId: formData.get("telegramId"),
    instagramId: formData.get("instagramId"),
    roles: formData.getAll("roles"),
    active: formData.get("active") === "on"
  });
  if (!parsed.success) redirectWith("error", "Check the profile fields. Every user must also retain at least one valid role.");

  const input = parsed.data;
  const target = await db.user.findUnique({
    where: { id: input.userId },
    select: {
      id: true,
      email: true,
      name: true,
      spiritualName: true,
      telegramId: true,
      instagramId: true,
      roles: true,
      active: true
    }
  });
  if (!target) redirectWith("error", "That user no longer exists.");

  const removesSiteAdmin = target.roles.includes("site_admin") && (!input.active || !input.roles.includes("site_admin"));
  if (target.id === actor.id && removesSiteAdmin) redirectWith("error", "You cannot remove or deactivate your own Site Admin access.");
  if (removesSiteAdmin && await db.user.count({ where: { active: true, roles: { has: "site_admin" }, id: { not: target.id } } }) === 0) {
    redirectWith("error", "The final active Site Admin cannot be removed or demoted.");
  }

  const profileChanged = target.name !== (input.name ?? null)
    || target.spiritualName !== (input.spiritualName ?? null)
    || target.telegramId !== (input.telegramId ?? null)
    || target.instagramId !== (input.instagramId ?? null);
  const accessChanged = target.active !== input.active || !sameRoles(target.roles, input.roles);
  const changed = profileChanged || accessChanged;
  if (changed) {
    await db.$transaction([
      db.user.update({
        where: { id: target.id },
        data: {
          name: input.name ?? null,
          spiritualName: input.spiritualName ?? null,
          telegramId: input.telegramId ?? null,
          instagramId: input.instagramId ?? null,
          roles: input.roles,
          active: input.active
        }
      }),
      db.adminAccessAudit.create({
        data: {
          targetUserId: target.id,
          actorEmail: actor.email,
          action: target.active !== input.active
            ? (input.active ? "reactivated" : "deactivated")
            : accessChanged
              ? "roles_updated"
              : "profile_updated",
          beforeRoles: target.roles,
          afterRoles: input.roles,
          beforeActive: target.active,
          afterActive: input.active
        }
      })
    ]);
  }
  revalidatePath("/admin/users");
  redirectWith("updated", target.email);
}

function sameRoles(left: readonly string[], right: readonly string[]) {
  return left.length === right.length && [...left].sort().every((role, index) => role === [...right].sort()[index]);
}

function redirectWith(key: "created" | "updated" | "error", value: string): never {
  redirect(`/admin/users?${key}=${encodeURIComponent(value)}` as Route);
}
