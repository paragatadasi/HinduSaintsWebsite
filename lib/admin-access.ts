import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasCapability, type Capability } from "@/lib/permissions";

export async function getAdminUser() {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return null;
  return db.user.findUnique({ where: { email }, select: { id: true, email: true, name: true, roles: true, active: true } });
}

export async function requireAdminUser() {
  const user = await getAdminUser();
  if (!user?.active) redirect("/admin?access=denied");
  return user;
}

export async function requireCapability(capability: Capability) {
  const user = await requireAdminUser();
  if (!hasCapability(user.roles, capability)) redirect("/admin?access=denied");
  return user;
}

export async function assertCapability(capability: Capability) {
  const user = await getAdminUser();
  if (!user?.active || !hasCapability(user.roles, capability)) throw new Error("You do not have permission to perform this action.");
  return user;
}
