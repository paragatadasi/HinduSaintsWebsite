import { cache } from "react";
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/admin-access";
import { buildMuseumView, museumSectionSlug, type MuseumSaintPlacement } from "@/lib/museum-proposals";

// Deliberately private: do not reuse this contract from public routes.
export const getMuseumData = cache(async () => {
  await requireCapability("access_museum");
  const [assignments, definitions] = await Promise.all([
    db.saintMuseumSection.findMany({
      where: {
        assignmentType: "primary",
        status: { not: "archived" },
        saint: { status: { not: "archived" } },
        museumSection: { status: { not: "archived" } }
      },
      include: {
        museumSection: true,
        exhibitGroup: true,
        saint: {
          include: {
            places: { include: { place: true } },
            traditions: { include: { tradition: true } },
            familyMemberships: { include: { family: true } },
            museumSectionAssignments: {
              where: { assignmentType: "alternative", status: { not: "archived" } },
              include: { museumSection: true }
            }
          }
        }
      },
      orderBy: [{ saintId: "asc" }, { updatedAt: "desc" }]
    }),
    db.museumSection.findMany({
      where: { status: { not: "archived" } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    })
  ]);
  const primaryCounts = new Map<string, number>();
  for (const a of assignments) primaryCounts.set(a.saintId, (primaryCounts.get(a.saintId) || 0) + 1);
  const labels = new Map<string, string>();
  const members = new Map<string, Record<string, string>>();
  const placements: MuseumSaintPlacement[] = assignments
    .filter((a) => primaryCounts.get(a.saintId) === 1)
    .map((a) => {
      const s = a.saint;
      const family = s.familyMemberships.find((m) => m.family.status !== "archived");
      const key = a.exhibitGroupId || family?.familyId || "";
      if (key) labels.set(key, a.exhibitGroup?.label || family?.family.displayName || key);
      members.set(s.id, {
        BirthYear: String(s.birthYear || ""),
      BirthDate: s.birthDateRaw || String(s.birthYear || ""),
        SamadhiDate: s.samadhiDateRaw || String(s.samadhiYear || "")
      });
      return {
        id: s.id,
        name: s.displayName,
        section: a.museumSection.name,
        alternatives: s.museumSectionAssignments.map((p) => p.museumSection.name),
        tier: ({ featured: "Featured", secondary: "Secondary", tertiary: "Tertiary" } as const)[a.tier],
        confidence: a.confidence[0].toUpperCase() + a.confidence.slice(1),
        rationale: a.rationale || "",
        note: a.internalPlacementNote || "",
        familyId: key,
        curatorialFamily: "",
        familySize: 0,
        spiritualRegions: [],
        sampradaya: s.traditions.map((t) => t.tradition.name).join("; "),
        normalizedPlaces: s.places.map((p) => [p.place.name, p.place.country].filter(Boolean).join(", ")),
        needsResearch: a.status !== "published" || a.confidence === "low"
      };
    });
  const view = buildMuseumView(
    placements,
    members,
    labels,
    new Map(),
    new Set(placements.filter((p) => p.needsResearch).map((p) => p.id))
  );
  for (const definition of definitions) {
    const section = view.sections.find((s) => s.name === definition.name);
    if (section) {
      section.slug = definition.slug;
      if (definition.descriptionMarkdown) section.idea = definition.descriptionMarkdown;
    } else
      view.sections.push({
        slug: definition.slug,
        name: definition.name,
        idea: definition.descriptionMarkdown || "No saints placed yet.",
        total: 0,
        featured: 0,
        secondary: 0,
        tertiary: 0,
        confidence: { high: 0, medium: 0, low: 0 },
        rows: [],
        families: [],
        primaryGroups: [],
        secondaryOnlyGroups: [],
        secondaryUngrouped: [],
        tertiaryGroups: [],
        tertiaryUngrouped: [],
        geography: [],
        health: []
      });
  }
  return {
    ...view,
    sectionBySlug: new Map(view.sections.flatMap((s) => [[museumSectionSlug(s.name), s] as const, [s.slug, s] as const])),
    conflictingSaintIds: [...primaryCounts].filter(([, count]) => count > 1).map(([id]) => id)
  };
});
