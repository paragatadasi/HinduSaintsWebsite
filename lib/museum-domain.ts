import { z } from "zod";

export const museumPlacementSchema = z
  .object({
    section: z.string().trim().min(1).max(200),
    alternatives: z.array(z.string().trim().min(1).max(200)).max(50).default([]),
    tier: z.enum(["featured", "secondary", "tertiary"]),
    confidence: z.enum(["high", "medium", "low"]),
    rationale: z.string().trim().max(10000).default(""),
    note: z.string().trim().max(10000).default(""),
    group: z.string().trim().max(200).default("")
  })
  .transform((value) => ({
    ...value,
    alternatives: [...new Set(value.alternatives)].filter((name) => name !== value.section).sort()
  }));
export type MuseumPlacementInput = z.output<typeof museumPlacementSchema>;
export function airtableIdentity(externalId: string) {
  const parts = externalId.split(":");
  if (parts.length !== 3 || !/^app[a-zA-Z0-9]+$/.test(parts[0]) || !/^rec[a-zA-Z0-9]+$/.test(parts[2]))
    return null;
  return { baseId: parts[0], table: parts[1], recordId: parts[2] };
}
export function museumFields(fields: Record<string, unknown>): MuseumPlacementInput | null {
  const text = (key: string) => (typeof fields[key] === "string" ? (fields[key] as string) : "");
  const primary = text("Primary Museum Section").trim();
  if (!primary) return null;
  const rawAlternatives = fields["Alternative Museum Sections"];
  const alternatives = Array.isArray(rawAlternatives)
    ? rawAlternatives.filter((v): v is string => typeof v === "string")
    : text("Alternative Museum Sections").split(";").filter(Boolean);
  const result = museumPlacementSchema.safeParse({
    section: primary,
    alternatives,
    tier: text("Museum Section Tier").toLowerCase() || "secondary",
    confidence: text("Museum Section Confidence").toLowerCase() || "medium",
    rationale: text("Museum Section Rationale"),
    note: text("Museum Section Internal Placement Note"),
    group: text("Curatorial Family")
  });
  return result.success ? result.data : null;
}
export function proposalSignature(value: MuseumPlacementInput | null) {
  return JSON.stringify(value);
}
export function resolveSnapshotIdentity(
  recordId: string,
  records: Array<{ id: string; externalId: string; entityId: string | null }>,
  existingSaintIds: Set<string>
) {
  const candidates = records.filter((record) => {
    const identity = airtableIdentity(record.externalId);
    return identity?.table === "Saints" && identity.recordId === recordId;
  });
  if (candidates.length !== 1)
    return { reason: candidates.length ? "Ambiguous source identity" : "No Airtable link", record: null };
  const record = candidates[0];
  if (!record.entityId || !existingSaintIds.has(record.entityId))
    return { reason: "Source has no active CMS saint", record: null };
  return { reason: "", record };
}

export function airtableSourceLink(externalId: string, payload: unknown) {
  const identity = airtableIdentity(externalId);
  if (!identity) return null;
  const raw = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const tableId = /^tbl[a-zA-Z0-9]+$/.test(identity.table)
    ? identity.table
    : typeof raw.tableId === "string" && /^tbl[a-zA-Z0-9]+$/.test(raw.tableId)
      ? raw.tableId
      : null;
  const base = "https://airtable.com/" + identity.baseId;
  return {
    url: tableId ? base + "/" + tableId + "/" + identity.recordId : base,
    recordId: identity.recordId,
    direct: Boolean(tableId)
  };
}
