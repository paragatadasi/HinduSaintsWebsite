import { unstable_cache, unstable_noStore } from "next/cache";
import { notFound } from "next/navigation";
import { getAdminUser } from "@/lib/admin-access";
import { canViewDevelopmentExperienceWithRoles } from "@/lib/development-experience-access";
import {
  DEVELOPMENT_EXPERIENCES,
  getDevelopmentExperienceDefinition,
  type DevelopmentExperienceKey
} from "@/lib/development-experience-registry";
import { db } from "@/lib/db";
import type { DevelopmentExperienceStatus } from "@/lib/generated/prisma/client";
import { hasCapability } from "@/lib/permissions";

export const DEVELOPMENT_EXPERIENCES_CACHE_TAG = "development-experiences";

const getDevelopmentExperienceStatusCached = unstable_cache(
  async (key: DevelopmentExperienceKey): Promise<DevelopmentExperienceStatus> => {
    const experience = await db.developmentExperience.findUnique({
      where: { key },
      select: { status: true }
    });
    return experience?.status ?? "off";
  },
  ["development-experience-status"],
  { revalidate: 60, tags: [DEVELOPMENT_EXPERIENCES_CACHE_TAG] }
);

export async function getDevelopmentExperienceStatus(key: DevelopmentExperienceKey) {
  return getDevelopmentExperienceStatusCached(key);
}

export async function canViewDevelopmentExperience(key: DevelopmentExperienceKey) {
  const status = await getDevelopmentExperienceStatus(key);
  if (status === "public") return true;
  if (status === "off") return false;

  unstable_noStore();
  const user = await getAdminUser();
  return canViewDevelopmentExperienceWithRoles(status, user?.active ? user.roles : null);
}

export async function requireDevelopmentExperience(key: DevelopmentExperienceKey) {
  const status = await getDevelopmentExperienceStatus(key);
  if (status === "public") return { status, user: null };

  unstable_noStore();
  const user = await getAdminUser();
  if (!user?.active || !canViewDevelopmentExperienceWithRoles(status, user.roles)) notFound();
  return { status, user };
}

export async function requireDevelopmentExperienceViewer() {
  unstable_noStore();
  const user = await getAdminUser();
  if (!user?.active || !hasCapability(user.roles, "view_development_experiences")) notFound();
  return user;
}

export async function getDevelopmentExperiencesForAdmin() {
  const rows = await db.developmentExperience.findMany({
    where: { key: { in: DEVELOPMENT_EXPERIENCES.map(({ key }) => key) } },
    select: { key: true, status: true, updatedAt: true, updatedByEmail: true }
  });
  const rowByKey = new Map(rows.map((row) => [row.key, row]));

  return DEVELOPMENT_EXPERIENCES.map((definition) => ({
    definition,
    status: rowByKey.get(definition.key)?.status ?? "off",
    updatedAt: rowByKey.get(definition.key)?.updatedAt ?? null,
    updatedByEmail: rowByKey.get(definition.key)?.updatedByEmail ?? null
  }));
}

export function assertRegisteredDevelopmentExperience(key: string): asserts key is DevelopmentExperienceKey {
  if (!getDevelopmentExperienceDefinition(key)) {
    throw new Error("Unknown development experience.");
  }
}
