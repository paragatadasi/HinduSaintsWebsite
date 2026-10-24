import {z} from "zod";

export const answerLabels = {
  recognized: "I can identify this saint or item",
  onsite: "I can check the label or collection records",
  unknown: "I don’t know",
  referral: "Someone else may know",
  unlabelled: "There is an item, but I don’t know who it belongs to",
  unused: "It appears to be an unused row",
  reopen: "Reopen for a new answer"
} as const;
export const statusLabels = {
  awaiting_curator: "Awaiting curator", verification: "Awaiting verification",
  onsite: "Awaiting on-site check", research: "Awaiting research", referral: "Awaiting referral",
  blocked: "Needs data-team review"
} as const;
export type QuestionStatus = keyof typeof statusLabels;
export const answerInput = z.object({
  museumId: z.literal("museum-spn"), caseId: z.string().min(1).max(100), revision: z.string().length(64),
  decision: z.enum(["recognized", "onsite", "unknown", "referral", "unlabelled", "unused", "reopen"]),
  note: z.string().trim().max(3000).default(""), identification: z.string().trim().max(500).default(""),
  referral: z.string().trim().max(500).default("")
}).strict().superRefine((value, ctx) => {
  if (value.decision === "recognized" && !value.identification) ctx.addIssue({code: "custom", path: ["identification"], message: "Add the name or identifying details you recognize."});
});
export type QuestionAnswer = z.infer<typeof answerInput>;
export type QuestionHistory = Pick<QuestionAnswer, "decision" | "note" | "identification" | "referral"> & {id: string; at: string; evidenceVersion: string};
export type CuratorQuestion = {
  reviewGroup: "inventory" | "conflict" | "optional"; recognitionLabel: string; identificationPrompt: string; suggestedNames: string[];
  caseId: string; revision: string; title: string; question: string; context: string;
  sourceName: string | null; sourceLocation: string; relicDescription: string | null;
  sourceCapturedAt: string; mirrorCapturedAt: string | null; sourceFields: Record<string, unknown>;
  blankEntry: boolean; status: QuestionStatus; blockedReason?: string;
  candidates: {id: string; name: string}[]; history: QuestionHistory[];
};
export function answerStatus(decision: QuestionAnswer["decision"]): QuestionStatus {
  if (decision === "reopen") return "awaiting_curator";
  if (decision === "unknown" || decision === "unlabelled") return "research";
  if (decision === "onsite" || decision === "referral") return decision;
  return "verification";
}
export function questionStatus(history: QuestionHistory[], evidenceVersion: string): QuestionStatus {
  const latest = history[0];
  return !latest || latest.evidenceVersion !== evidenceVersion ? "awaiting_curator" : answerStatus(latest.decision);
}
export function allowedDecisions(blank: boolean): QuestionAnswer["decision"][] {
  return blank ? ["recognized", "unlabelled", "unused", "onsite", "unknown", "referral", "reopen"] : ["recognized", "onsite", "unknown", "referral", "reopen"];
}
export function answerEffect(decision: QuestionAnswer["decision"]) {
  switch (decision) {
    case "recognized": return "We'll review these details before updating the record. Your answer does not change the move plan.";
    case "onsite": return "Save for an on-site check. You can return with the label or collection record later.";
    case "referral": return "Save this referral for follow-up. No message will be sent automatically.";
    case "unknown": case "unlabelled": return "Move this question to Awaiting research. No explanation is required; your answer stays in its history.";
    case "unused": return "Save this classification for verification. The source row will not be deleted and no object will be created.";
    case "reopen": return "Return this question to the curator checklist. Previous answers stay in its history.";
  }
}

// Only these source fields distinguish the question's evidence. Import timestamps,
// proposal fields and expiring attachment URLs are deliberately excluded.
export const questionEvidenceFields = ["Name", "Vitrine #", "Shelf", "Normalized places", "Place", "Relics Description (move to other table)", "Bio/Info", "Birth (YYYY-MM-DD)", "Samadhi (YYYY-MM-DD)"];
export function questionEvidence(value: unknown): Record<string, unknown> {
  const fields = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return Object.fromEntries(questionEvidenceFields.map(key => {
    let field = fields[key];
    if (typeof field === "string") field = field.replace(/\r\n?/g, "\n").trim();
    if (key === "Vitrine #" && ((typeof field === "string" && /^[0-9]+$/.test(field)) || typeof field === "number")) field = String(field);
    if (key === "Shelf" && typeof field === "string") field = field.toUpperCase();
    if (key === "Place" && Array.isArray(field) && field.every(v => typeof v === "string")) field = [...field].sort();
    return [key, field === undefined || field === null || field === "" ? null : field];
  }));
}
