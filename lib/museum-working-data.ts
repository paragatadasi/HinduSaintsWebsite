import { readSaintCollectionItems } from "@/lib/museum-collections";
import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { getMuseumProposalData, type MuseumSaintPlacement } from "@/lib/museum-proposals";
import { getEditableMuseumProposalData } from "@/lib/museum-family-moves";
import { resolveSnapshotIdentity } from "@/lib/museum-domain";
import { buildWorkingMuseumView, museumRelationshipDetails, type CurrentMuseumSaint } from "@/lib/museum-working-view";

// Private data reader; route entry points must enforce access_museum before calling.
export async function readMuseumData(client: Prisma.TransactionClient = db) {
  const [collections, saints, links, definitions] = await Promise.all([
    readSaintCollectionItems(client),
    client.saint.findMany({
      where: { status: { not: "archived" } },
      select: {
        id: true, displayName: true, canonicalName: true, birthYear: true, birthDateRaw: true,
        samadhiYear: true, samadhiDateRaw: true,
        aliases: { select: { alias: true } },
        places: { include: { place: true } },
        traditions: { where: { tradition: { status: { not: "archived" } } }, include: { tradition: true } },
        familyMemberships: {
          where: { family: { status: { not: "archived" } } },
          include: { family: true }
        },
        relationshipsFrom: {
          where: { status: { not: "archived" }, toSaint: { status: { not: "archived" } } },
          include: { toSaint: { select: { id: true, displayName: true, status: true } } }
        },
        relationshipsTo: {
          where: { status: { not: "archived" }, fromSaint: { status: { not: "archived" } } },
          include: { fromSaint: { select: { id: true, displayName: true, status: true } } }
        },
        museumSectionAssignments: {
          where: { status: "published", museumSection: { status: { not: "archived" } } },
          include: { museumSection: true, exhibitGroup: true }
        }
      },
      orderBy: { id: "asc" }
    }),
    client.externalRecord.findMany({
      where: { sourceType: "airtable", entityType: "Saint" },
      select: { id: true, externalId: true, entityId: true }
    }),
    client.museumSection.findMany({
      where: { status: { not: "archived" } },
      select: { name: true, slug: true, descriptionMarkdown: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    })
  ]);
  const current: CurrentMuseumSaint[] = saints.map(s => ({
    collectionItems: collections.get(s.id) || [],
    id: s.id, name: s.displayName, aliases: [s.canonicalName, ...s.aliases.map(a => a.alias)],
    sampradaya: s.traditions.map(t => t.tradition.name).join("; "),
    normalizedPlaces: s.places.filter(p => p.place.placeKind !== "spiritual_region")
      .map(p => [p.place.name, p.place.region, p.place.country].filter(Boolean).join(", ")),
    spiritualRegions: s.places.filter(p => p.place.placeKind === "spiritual_region").map(p => p.place.name),
    member: {
      BirthYear: s.birthYear === null ? "" : String(s.birthYear),
      BirthDate: s.birthDateRaw || (s.birthYear === null ? "" : String(s.birthYear)),
      SamadhiDate: s.samadhiDateRaw || (s.samadhiYear === null ? "" : String(s.samadhiYear)),
      Families: s.familyMemberships.map(m => `${m.family.displayName} (${m.role.replaceAll("_", " ")})`).join("; "),
      ...museumRelationshipDetails([
        ...s.relationshipsFrom.map(r => ({ ...r, other: r.toSaint, incoming: false })),
        ...s.relationshipsTo.map(r => ({ ...r, other: r.fromSaint, incoming: true }))
      ])
    },
    confirmed: s.museumSectionAssignments.filter(a => a.assignmentType === "primary").map((a): MuseumSaintPlacement => ({
      id: a.id, saintId: s.id, name: s.displayName, section: a.museumSection.name,
      alternatives: s.museumSectionAssignments.filter(p => p.assignmentType === "alternative").map(p => p.museumSection.name),
      tier: ({ featured: "Featured", secondary: "Secondary", tertiary: "Tertiary" } as const)[a.tier],
      confidence: a.confidence[0].toUpperCase() + a.confidence.slice(1),
      rationale: a.rationale || "", note: a.internalPlacementNote || "",
      familyId: a.exhibitGroupId ? "exhibit:" + a.exhibitGroupId : "", curatorialFamily: "",
      isExhibitAnchor: a.exhibitGroup?.anchorSaintId === s.id,
      groupLabel: a.exhibitGroup?.label || "", familySize: 0, spiritualRegions: [],
      sampradaya: "", normalizedPlaces: [], needsResearch: a.confidence === "low"
    }))
  }));
  const original = getMuseumProposalData();
  const editable = await getEditableMuseumProposalData(client);
  const view = buildWorkingMuseumView(editable, current, links, definitions);
  const activeIds = new Set(current.map(s => s.id));
  for (const row of original.placements) {
    row.saintId = resolveSnapshotIdentity(row.id, links, activeIds).record?.entityId || undefined;
  }
  return { ...view, original, familyMoveOptions: editable.familyMoveOptions };
}
