import type { DevelopmentExperienceStatus, UserRole } from "@/lib/generated/prisma/client";
import { hasCapability } from "@/lib/permissions";

export function canViewDevelopmentExperienceWithRoles(
  status: DevelopmentExperienceStatus,
  roles: readonly UserRole[] | null
) {
  if (status === "public") return true;
  if (status === "off" || !roles) return false;
  return hasCapability(roles, "view_development_experiences");
}
