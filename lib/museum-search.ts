import type { MuseumSaintPlacement } from "@/lib/museum-proposals";
import { rankWeightedTextSearch } from "@/lib/search-text";
import { compareSaintDisplayNames } from "@/lib/saint-name-sort";

// Museum-only field selection; normalization, fuzzy matching and ranking stay shared.
// Keep this module browser-safe for the section workspace.
export function rankMuseumPlacementSearchResults<T extends MuseumSaintPlacement>(
  placements: T[], query: string, limit?: number
) {
  return rankWeightedTextSearch(placements, query, (row) => [
    { value: row.name, weight: 6, fuzzy: true },
    { value: row.section, weight: 2 },
    ...row.spiritualRegions.map((value) => ({ value, weight: 2 })),
    ...row.normalizedPlaces.map((value) => ({ value, weight: 3 }))
  ], {
    limit,
    tieBreaker: (left, right) => compareSaintDisplayNames(left.name, right.name)
  }).map(({ item }) => item);
}
