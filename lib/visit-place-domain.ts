import { z } from "zod";

const text = (max: number) => z.string().trim().max(max);
const coordinate = (limit: number) => z.preprocess(value => value === "" || value == null ? null : Number(value), z.number().finite().min(-limit).max(limit).nullable());
export const visitPlaceSchema = z.object({
  name: text(500).min(1), slug: text(300).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  visit_place_name: text(500).min(1), visit_place_kind: z.enum(["ashram", "temple", "samadhi", "locality", "house", "other"]),
  locality: text(500), state_or_region: text(500), country: text(200).min(1),
  latitude: coordinate(90), longitude: coordinate(180),
  location_confidence: z.enum(["high", "medium", "low"]), research_notes: text(10000), sources: text(15000), catalog_places: text(10000),
  coordinatePrecision: z.enum(["unverified", "site", "locality", "region", "unknown"]).default("unverified")
}).superRefine((row, ctx) => {
  if ((row.latitude == null) !== (row.longitude == null)) ctx.addIssue({code: "custom", path: ["latitude"], message: "Provide both coordinates or leave both empty."});
});
export type VisitPlaceData = z.infer<typeof visitPlaceSchema>;
export function normalizeVisitPlace(row: Record<string, unknown>): VisitPlaceData {
  return visitPlaceSchema.parse(Object.fromEntries([...Object.entries(row).map(([key,value]) => [key,value ?? ""]), ["latitude",row.latitude ?? null], ["longitude",row.longitude ?? null]]));
}
export function externalResearchUrls(sources: string) {
  return (sources.match(/https?:\/\/[^;\s]+/g) ?? []).filter(value => {
    try { const url = new URL(value); return !["hindusaints.org", "www.hindusaints.org"].includes(url.hostname.toLowerCase()); } catch {return false;}
  });
}
export function visitPlaceWarnings(row: VisitPlaceData) {
  const warnings: string[] = [];
  if (!externalResearchUrls(row.sources).length) warnings.push("No independent source URL supplied. Check the claim and record specific evidence, including book references or team research where appropriate.");
  if (row.location_confidence !== "high") warnings.push(`Researcher confidence: ${row.location_confidence}.`);
  if (row.latitude == null) warnings.push("No coordinates supplied.");
  else if (row.coordinatePrecision === "unverified") warnings.push("Coordinate precision has not been verified. A town coordinate must not become directions to a shrine.");
  if (row.visit_place_kind === "locality" || row.visit_place_kind === "other") warnings.push("May describe a broad pilgrimage context rather than a confirmed destination.");
  if (/pushpa/i.test(row.visit_place_name) && /burial/i.test(row.research_notes)) warnings.push("Check memorial versus burial wording for this Pushpa Samadhi.");
  return warnings;
}
export const visitPlaceDecisionSchema = z.object({
  id: z.string().cuid(), version: z.coerce.number().int().min(1),
  action: z.enum(["approve", "defer", "reject", "reopen"]),
  evidence: text(15000).default(""), note: text(5000).default(""), confirm: z.literal("on").optional(),
  catalogDecision: z.enum(["unreviewed", "keep", "review_needed"]), catalogNote: text(5000).default("")
}).superRefine((input,ctx) => {
  const error=(path:string,message:string) => ctx.addIssue({code:"custom",path:[path],message});
  if (input.action === "approve" && (!input.evidence || input.confirm !== "on")) error("evidence","Confirm the destination and provide specific research evidence before marking it ready.");
  if (["defer","reject","reopen"].includes(input.action) && !input.note) error("note","Explain the follow-up or reason for this decision.");
  if (input.catalogDecision === "review_needed" && !input.catalogNote) error("catalogNote","Explain which existing saint-place association needs review and why.");
});

export const researchBundleSchema=z.object({
  sourceName:z.string().trim().min(1).max(300),sourceSheet:z.string().trim().min(1).max(100),
  sha256:z.string().regex(/^[a-f0-9]{64}$/),rows:z.array(z.record(z.unknown())).min(1).max(2000)
});
