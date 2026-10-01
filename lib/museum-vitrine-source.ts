// Private SPN source projection, not a reviewed relic placement. Keep the base
// explicit: another museum's mirror must never silently become SPN data.
export const SPN_WEBSITE_AIRTABLE_BASE_ID = "appMapiXrtNwnS9oZ";
export type MuseumSourceVitrine = { museum: "SPN"; vitrine: string; shelf: string | null };
type Link = { externalId: string; entityId: string | null };
type Mirror = { baseId: string; tableIdOrName: string; recordId: string; rawFieldsJson: unknown };

function location(raw: unknown): MuseumSourceVitrine | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const fields = raw as Record<string, unknown>;
  const value = fields["Vitrine #"];
  const vitrine = typeof value === "number" && Number.isSafeInteger(value) && value > 0
    ? String(value) : typeof value === "string" && /^[1-9][0-9]*$/.test(value.trim()) ? value.trim() : null;
  const shelf = fields.Shelf;
  if (!vitrine || (shelf != null && typeof shelf !== "string")) return null;
  const normalizedShelf = typeof shelf === "string" ? shelf.trim().toUpperCase() : "";
  if (normalizedShelf && !/^[A-Z0-9]{1,8}$/.test(normalizedShelf)) return null;
  return { museum: "SPN", vitrine, shelf: normalizedShelf || null };
}

export function projectSourceVitrines(rows: Mirror[], links: Link[], activeSaintIds: Set<string>) {
  const prefix = SPN_WEBSITE_AIRTABLE_BASE_ID + ":Saints:";
  const mirrors = new Map<string, Mirror[]>();
  for (const row of rows) {
    if (row.baseId !== SPN_WEBSITE_AIRTABLE_BASE_ID || row.tableIdOrName !== "Saints") continue;
    const key = prefix + row.recordId;
    mirrors.set(key, [...(mirrors.get(key) || []), row]);
  }
  const bySaint = new Map<string, Link[]>();
  const sourceCounts = new Map<string, number>();
  for (const link of links) {
    sourceCounts.set(link.externalId, (sourceCounts.get(link.externalId) || 0) + 1);
    if (!link.externalId.startsWith(prefix) || !/^rec[a-zA-Z0-9]+$/.test(link.externalId.slice(prefix.length)) ||
      !link.entityId || !activeSaintIds.has(link.entityId)) continue;
    bySaint.set(link.entityId, [...(bySaint.get(link.entityId) || []), link]);
  }
  const result = new Map<string, MuseumSourceVitrine>();
  for (const [saintId, sources] of bySaint) {
    const locations = sources.map(source => {
      const matches = mirrors.get(source.externalId) || [];
      return matches.length === 1 && sourceCounts.get(source.externalId) === 1 ? location(matches[0].rawFieldsJson) : null;
    });
    // Missing rows/values and differing shelves are intentionally unresolved.
    if (locations.some(value => !value)) continue;
    const first = locations[0]!;
    if (locations.every(value => value!.vitrine === first.vitrine && value!.shelf === first.shelf)) result.set(saintId, first);
  }
  return result;
}
