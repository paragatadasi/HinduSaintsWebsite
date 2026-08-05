"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertCapability } from "@/lib/admin-access";
import { db } from "@/lib/db";

const roles = ["site_admin", "data_admin", "editor", "contributor", "curator", "translator"] as const;
const accessSchema = z.object({ userId: z.string().cuid(), roles: z.array(z.enum(roles)).min(1), active: z.boolean() });
const createSchema = z.object({
  email: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
  roles: z.array(z.enum(roles)).min(1)
});

export async function createAdminUser(formData: FormData) {
  const actor = await assertCapability("manage_users");
  const parsed = createSchema.safeParse({ email: formData.get("email"), roles: formData.getAll("roles") });
  if (!parsed.success) redirectWith("error", "Enter a valid email and select at least one role.");

  const existing = await db.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
  if (existing) redirectWith("error", "That email already has a user record. Update it below instead.");

  await db.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { email: parsed.data.email, roles: parsed.data.roles, active: true } });
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
  const parsed = accessSchema.safeParse({ userId: formData.get("userId"), roles: formData.getAll("roles"), active: formData.get("active") === "on" });
  if (!parsed.success) redirectWith("error", "Every user must retain at least one valid role.");

  const input = parsed.data;
  const target = await db.user.findUnique({ where: { id: input.userId }, select: { id: true, email: true, roles: true, active: true } });
  if (!target) redirectWith("error", "That user no longer exists.");

  const removesSiteAdmin = target.roles.includes("site_admin") && (!input.active || !input.roles.includes("site_admin"));
  if (target.id === actor.id && removesSiteAdmin) redirectWith("error", "You cannot remove or deactivate your own Site Admin access.");
  if (removesSiteAdmin && await db.user.count({ where: { active: true, roles: { has: "site_admin" }, id: { not: target.id } } }) === 0) {
    redirectWith("error", "The final active Site Admin cannot be removed or demoted.");
  }

  const changed = target.active !== input.active || !sameRoles(target.roles, input.roles);
  if (changed) {
    await db.$transaction([
      db.user.update({ where: { id: target.id }, data: { roles: input.roles, active: input.active } }),
      db.adminAccessAudit.create({
        data: {
          targetUserId: target.id,
          actorEmail: actor.email,
          action: target.active !== input.active ? (input.active ? "reactivated" : "deactivated") : "roles_updated",
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
