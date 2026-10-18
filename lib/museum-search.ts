import type { MuseumSaintPlacement } from "@/lib/museum-proposals";
import { rankWeightedTextSearch } from "@/lib/search-text";
import { compareSaintDisplayNames } from "@/lib/saint-name-sort";

// Only adapt the private museum dataset; matching rules remain shared with saint search.
// Type-only proposal imports keep this safe for the client section workspace.
export function rankMuseumPlacementSearchResults<T extends MuseumSaintPlacement>(
  placements: T[], query: string, limit?: number
) {
  return rankWeightedTextSearch(placements, query, (row) => [
    { value: row.name, weight: 6, fuzzy: true },
    ...(row.searchNames ?? []).map((value) => ({ value, weight: 5, fuzzy: true })),
    { value: row.section, weight: 2 },
    { value: row.sampradaya, weight: 2 },
    ...row.spiritualRegions.map((value) => ({ value, weight: 2 })),
    ...row.normalizedPlaces.map((value) => ({ value, weight: 3 }))
  ], {
    limit,
    tieBreaker: (left, right) => compareSaintDisplayNames(left.name, right.name)
  }).map(({ item }) => item);
}
