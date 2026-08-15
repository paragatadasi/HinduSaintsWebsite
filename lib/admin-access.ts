import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasCapability, type Capability } from "@/lib/permissions";
import { canAccessSaintCatalog, canViewSaintWithRoles } from "@/lib/admin-saint-access";
import { userDisplayNameSelect } from "@/lib/user-display-name";

export async function getAdminUser() {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return null;
  return db.user.findUnique({
    where: { email },
    select: { id: true, ...userDisplayNameSelect, roles: true, active: true }
  });
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

export async function requireSaintCatalogUser() {
  const user = await requireAdminUser();
  if (!canAccessSaintCatalog(user.roles)) redirect("/admin?access=denied");
  return user;
}

export async function assertSaintsVisibleToUser(
  user: NonNullable<Awaited<ReturnType<typeof getAdminUser>>>,
  saintIds: readonly string[]
) {
  const uniqueIds = Array.from(new Set(saintIds.filter(Boolean)));
  if (uniqueIds.length === 0 || hasCapability(user.roles, "view_full_saint_catalog")) return;

  const saints = await db.saint.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true, teamVisibility: true }
  });
  if (saints.length !== uniqueIds.length || saints.some((saint) => !canViewSaintWithRoles(user.roles, saint))) {
    throw new Error("You do not have permission to access one or more selected saints.");
  }
}
