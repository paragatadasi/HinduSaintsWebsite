import { fingerprint, sourceKey, type SourceLink, type SourceRow } from "./museum-update-domain";
import type { CollectionObservation } from "./museum-collection-domain";

// Current museum records are the baseline. Use only the saint rows linked to this relic.
export function proposeRelic(row: SourceRow, saints: SourceRow[], links: SourceLink[], active: Set<string>) {
  const rawLinks = row.fields.Saint;
  const ids = Array.isArray(rawLinks) && rawLinks.every(id => typeof id === "string" && /^rec[a-zA-Z0-9]+$/.test(id)) ? [...new Set(rawLinks as string[])].sort() : [];
  const evidence = ids.map(id => {
    const source = saints.find(s => s.id === id);
    const link = links.find(l => l.externalId === sourceKey("Saints", id));
    return { recordId: id, name: source?.fields.Name ?? null, vitrine: source?.fields["Vitrine #"] ?? null, shelf: source?.fields.Shelf ?? null,
      saintId: source && link?.entityType === "Saint" && link.entityId && active.has(link.entityId) ? link.entityId : null };
  });
  const name = typeof row.fields["Item Name"] === "string" ? row.fields["Item Name"].trim() : "";
  const blockers = [...(!name ? ["Source item has no name"] : []), ...(!ids.length || evidence.some(e => !e.saintId) ? ["Resolve all source saint identities first"] : [])];
  const raw = { recordId: row.id, itemName: name, itemType: row.fields["Item type"] ?? null, sourceSaintLinks: rawLinks ?? null, evidence };
  const locations = evidence.map(e => {
    const v = typeof e.vitrine === "number" ? String(e.vitrine) : typeof e.vitrine === "string" ? e.vitrine.trim() : "";
    const shelf = typeof e.shelf === "string" ? e.shelf.trim().toUpperCase() : e.shelf == null ? "" : "?";
    return /^[1-9][0-9]{0,5}$/.test(v) && /^[A-Z0-9]{0,8}$/.test(shelf) ? { code:v+(shelf?"/"+shelf:""), label:"Vitrine "+v+(shelf?" / Shelf "+shelf:""), kind:shelf?"shelf" as const:"vitrine" as const, room:null } : null;
  });
  const location = locations.length && locations.every(l => l && l.code === locations[0]?.code) ? locations[0] : null;
  const locationIssue = !location ? "Location missing or inconsistent across linked source rows" : null;
  const normalized: CollectionObservation = { mappingVersion: "spn-relic-review-v1", label: name || "Unnamed relic source", inventoryCode: null,
    saintIds: [...new Set(evidence.flatMap(e => e.saintId ? [e.saintId] : []))].sort(), location };
  return { raw, normalized, blockers, locationIssue, hash: fingerprint({ raw, normalized }) };
}
