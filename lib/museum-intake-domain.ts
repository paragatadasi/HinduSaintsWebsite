import { z } from "zod";

// Keep reported dates and places as evidence; review does not parse or geocode them.
export const museumIntakeFields = z.object({
  saintName: z.string().max(300),
  relicDescription: z.string().max(8000).optional(),
  saintPlaceRaw: z.string().max(2000).optional(),
  birthDateRaw: z.string().max(300).optional(),
  samadhiDateRaw: z.string().max(300).optional(),
  broughtByRaw: z.string().max(500).optional()
}).strict();

export const intakeRelicId = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
export const museumIntakeRelicInput = z.object({
  id: intakeRelicId,
  additionalSaintsRaw: z.string().max(2000).optional(),
  relicPlaceRaw: z.string().max(2000).optional(),
  relicDescription: z.string().max(8000),
  broughtByRaw: z.string().max(500).optional()
}).strict();
const relicList = z.array(museumIntakeRelicInput).min(1).max(50).refine(
  relics => new Set(relics.map(relic => relic.id)).size === relics.length,
  "Each relic needs its own identifier."
);
export const createMuseumIntakeInput = z.object({
  museumId: z.string().min(1).max(100),
  clientRequestId: z.string().uuid(),
  fields: museumIntakeFields,
  relics: relicList.optional()
}).strict();
export const editMuseumIntakeInput = z.object({
  expectedVersion: z.number().int().positive(), fields: museumIntakeFields,
  relics: relicList.optional()
}).strict();
export const submitMuseumIntakeInput = z.object({ expectedVersion: z.number().int().positive() }).strict();
export const museumIntakeSaintDecision = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("existing"), saintId: z.string().cuid() }).strict(),
  z.object({ kind: z.literal("new_draft") }).strict()
]);
export const reviewMuseumIntakeInput = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve"), expectedVersion: z.number().int().positive(), saintDecision: museumIntakeSaintDecision, note: z.string().max(4000).optional() }).strict(),
  z.object({ action: z.literal("request_changes"), expectedVersion: z.number().int().positive(), note: z.string().trim().min(1).max(4000) }).strict()
]);
export type IntakeFields = z.infer<typeof museumIntakeFields>;
export type IntakeSaintDecision = z.infer<typeof museumIntakeSaintDecision>;
export const intakeMediaKind = z.enum(["relic", "saint_portrait", "bio_document", "relic_document"]);
export type IntakeMediaKind = z.infer<typeof intakeMediaKind>;

export class MuseumIntakeError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

export function intakeWriteOriginAllowed(requestUrl: string, origin: string | null, host: string | null, canonicalUrl?: string) {
  if (!origin || origin === "null") return false;
  try {
    const source = new URL(origin), target = new URL(requestUrl);
    if (source.origin !== origin) return false;
    if (canonicalUrl) return source.origin === new URL(canonicalUrl).origin;
    // Next may construct request.url with its internal bind host. Browsers still send the public Host.
    return source.origin === target.origin || (source.host === host && source.protocol === target.protocol);
  } catch { return false; }
}

export function assertIntakeEditable(status: string) {
  if (!["draft", "needs_changes", "submitted", "approved"].includes(status)) throw new MuseumIntakeError(409, "This entry cannot be edited.");
}

export type IntakeRelicInput = z.infer<typeof museumIntakeRelicInput>;
export function assertIntakeSubmission(fields: IntakeFields, media: readonly { kind: string; relicId?: string | null }[], relics?: readonly IntakeRelicInput[]) {
  if (!fields.saintName.trim()) throw new MuseumIntakeError(400, "Enter the saint's name.");
  const children = relics ?? [{ id: "legacy", relicDescription: fields.relicDescription ?? "" }];
  if (!children.length) throw new MuseumIntakeError(400, "Add at least one relic.");
  for (const [index, relic] of children.entries()) {
    if (!relic.relicDescription.trim()) throw new MuseumIntakeError(400, `Describe relic ${index + 1}.`);
    if (!media.some(photo => photo.kind === "relic" && (relics ? photo.relicId === relic.id : true))) throw new MuseumIntakeError(400, `Add a photo of relic ${index + 1} before sending it for review.`);
  }
}

export type IntakeDeliveryStatus = "blocked_configuration" | "queued" | "sending" | "succeeded" | "failed" | "unknown";
export function intakeDeliverySummary(deliveries: readonly { status: string }[]) {
  if (!deliveries.length) return "not_approved";
  if (deliveries.every(d => d.status === "succeeded")) return "complete";
  if (deliveries.some(d => d.status === "succeeded")) return "partial_success";
  if (deliveries.some(d => d.status === "unknown")) return "needs_delivery_check";
  if (deliveries.some(d => d.status === "sending")) return "sending";
  if (deliveries.some(d => d.status === "failed")) return "needs_retry";
  if (deliveries.some(d => d.status === "blocked_configuration")) return "configuration_required";
  return "queued";
}

export function intakeRetryTargets(deliveries: readonly { target: string; status: string }[]) {
  // An unknown result needs reconciliation with the remote marker, not a blind create retry.
  return deliveries.filter(d => d.status === "failed" || d.status === "blocked_configuration").map(d => d.target);
}

export function preserveAdditionalSaints(next: IntakeRelicInput, previous?: IntakeRelicInput): IntakeRelicInput {
  return next.additionalSaintsRaw === undefined && previous?.additionalSaintsRaw !== undefined
    ? { ...next, additionalSaintsRaw: previous.additionalSaintsRaw } : next;
}
