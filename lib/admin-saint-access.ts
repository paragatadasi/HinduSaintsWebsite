import type { Prisma, TeamVisibility, UserRole } from "@/lib/generated/prisma/client";
import { hasCapability } from "@/lib/permissions";

export type SaintCatalogScope = "full" | "public" | "published";

export function canAccessSaintCatalog(roles: readonly UserRole[]) {
  return hasCapability(roles, "view_content") || hasCapability(roles, "view_full_saint_catalog");
}

export function getAdminSaintCatalogScope(
  roles: readonly UserRole[],
  requestedScope?: string | null
): Exclude<SaintCatalogScope, "published"> {
  return hasCapability(roles, "view_full_saint_catalog") && requestedScope !== "public"
    ? "full"
    : "public";
}

export function saintCatalogWhere(scope: SaintCatalogScope): Prisma.SaintWhereInput {
  if (scope === "full") return {};
  if (scope === "published") return { publicationStatus: "published" };
  return { teamVisibility: "public" };
}

export function canViewSaintWithRoles(
  roles: readonly UserRole[],
  saint: { teamVisibility: TeamVisibility }
) {
  return hasCapability(roles, "view_full_saint_catalog") || saint.teamVisibility === "public";
}

export function canManageSaintTeamVisibility(roles: readonly UserRole[]) {
  return hasCapability(roles, "manage_team_visibility")
    || hasCapability(roles, "manage_saint_team_visibility");
}
