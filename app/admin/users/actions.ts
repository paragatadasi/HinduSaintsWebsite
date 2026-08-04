"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertCapability } from "@/lib/admin-access";
import { db } from "@/lib/db";
const roles = ["site_admin", "data_admin", "editor", "contributor", "curator", "translator"] as const;
const schema = z.object({ userId: z.string().cuid(), roles: z.array(z.enum(roles)).min(1), active: z.boolean() });
export async function updateUserAccess(formData: FormData) {
  const actor = await assertCapability("manage_users");
  const input = schema.parse({ userId: formData.get("userId"), roles: formData.getAll("roles"), active: formData.get("active") === "on" });
  const target = await db.user.findUniqueOrThrow({ where: { id: input.userId }, select: { id: true, roles: true } });
  const removesSiteAdmin = target.roles.includes("site_admin") && (!input.active || !input.roles.includes("site_admin"));
  if (target.id === actor.id && removesSiteAdmin) throw new Error("You cannot remove or deactivate your own Site Admin access.");
  if (removesSiteAdmin && await db.user.count({ where: { active: true, roles: { has: "site_admin" }, id: { not: target.id } } }) === 0) throw new Error("The final active Site Admin cannot be removed or demoted.");
  await db.user.update({ where: { id: target.id }, data: { roles: input.roles, active: input.active } });
  revalidatePath("/admin/users");
}
