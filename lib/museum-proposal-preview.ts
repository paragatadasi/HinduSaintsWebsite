import type { MuseumSection, MuseumTier } from "@/lib/museum-proposals";

export type MuseumAnchorOption = { id: string; label: string };

export function getMuseumAnchorOptions(
  section: MuseumSection,
  tierById: Record<string, MuseumTier> = {},
  anchorById: Record<string, string> = {}
): MuseumAnchorOption[] {
  const groupedPrimaryIds = new Set(section.primaryGroups.flatMap((family) => family.featured.map((row) => row.id)));
  const familyOptions = section.primaryGroups.map((family) => ({
    id: family.key, label: family.featured[0]?.name || family.label
  }));
  const standaloneOptions = section.rows
    .filter((row) => (tierById[row.id] || row.tier) === "Featured"
      && (!groupedPrimaryIds.has(row.id) || anchorById[row.id] === ("saint:" + row.id)))
    .map((row) => ({ id: ("saint:" + row.id), label: row.name }));
  return [...familyOptions, ...standaloneOptions]
    .filter((option, index, options) => options.findIndex((candidate) => candidate.id === option.id) === index)
    .sort((a, b) => a.label.localeCompare(b.label));
}
