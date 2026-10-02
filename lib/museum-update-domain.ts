import { createHash } from "node:crypto";
import { projectSourceVitrines, SPN_WEBSITE_AIRTABLE_BASE_ID as base } from "./museum-vitrine-source";
export type SourceRow = { id: string; createdTime?: string; fields: Record<string, unknown> };
export type SourceLink = { externalId: string; entityType: string; entityId: string | null };
export const sourceKey = (table: string, id: string) => `${base}:${table}:${id}`;
export function stable(value: unknown): string {
  if (Array.isArray(value)) return JSON.stringify(value.map(v => JSON.parse(stable(v))));
  if (value && typeof value === "object") return JSON.stringify(Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k,v]) => [k, JSON.parse(stable(v))])));
  return JSON.stringify(value ?? null);
}
export const fingerprint = (value: unknown) => createHash("sha256").update(stable(value)).digest("hex");
export function reviewMuseumSources(rows: SourceRow[], links: SourceLink[], activeIds: Set<string>) {
  const mirrors = rows.map(r => ({ baseId: base, tableIdOrName: "Saints", recordId: r.id, rawFieldsJson: r.fields }));
  const saintLinks = links.filter(l => l.entityType === "Saint");
  const locations = projectSourceVitrines(mirrors, saintLinks, activeIds);
  const byKey = new Map(links.map(l => [l.externalId, l]));
  const reviews = rows.flatMap(row => {
    const link = byKey.get(sourceKey("Saints", row.id));
    const hasSaint = link?.entityType === "Saint" && !!link.entityId && activeIds.has(link.entityId);
    const raw = row.fields["Vitrine #"];
    const reason = !hasSaint ? "Saint identity needs review" : locations.has(link!.entityId!) ? null
      : raw == null || raw === "" ? "Source has no vitrine" : "Location is inconsistent or needs review";
    if (!reason) return [];
    const snapshot = { name: typeof row.fields.Name === "string" ? row.fields.Name : "Unnamed source record",
      vitrine: raw ?? null, shelf: row.fields.Shelf ?? null, saintId: hasSaint ? link!.entityId : null,
      linkedEntityType: link?.entityType ?? "airtable:Saints", linkedEntityId: link?.entityId ?? null };
    return [{ sourceKey: sourceKey("Saints",row.id), recordId: row.id, name: snapshot.name, reason,
      sourceHash: fingerprint({ snapshot, reason, related: hasSaint ? saintLinks.filter(l => l.entityId === link!.entityId).map(l => ({ key: l.externalId, location: (() => { const f = rows.find(r => sourceKey("Saints",r.id) === l.externalId)?.fields; return f ? { vitrine: f["Vitrine #"] ?? null, shelf: f.Shelf ?? null } : null; })() })).sort((a,b) => a.key.localeCompare(b.key)) : null }), snapshot }];
  });
  return { locations, reviews };
}
