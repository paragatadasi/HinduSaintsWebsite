import { z } from "zod";
export const museumSourceDecisionSchema = z.object({
  id: z.string().cuid(),
  version: z.string().datetime(),
  action: z.enum(["link", "defer", "reopen"]),
  saintId: z.string().optional(),
  note: z.string().trim().max(2000).default("")
}).superRefine((input, ctx) => {
  if (input.action !== "link" && !input.note) {
    ctx.addIssue({ code: "custom", path: ["note"], message: "Add a note explaining the deferral or reopened review." });
  }
});
export type MuseumReviewDecision = z.infer<typeof museumSourceDecisionSchema>;

const sourceReviewErrors = {
  invalid_input: "Check the selected saint and decision note, then try again.",
  invalid_scope: "This source is outside the SPN review scope. Ask an administrator to check its source record.",
  stale_review: "This review changed since you opened it. Reload the page and review the latest decision.",
  review_closed: "This row is no longer awaiting an identity link. Reload the page to see its current review status.",
  choose_saint: "Select an existing website saint before linking this source.",
  invalid_saint: "The selected saint is no longer available. Reload and choose a current website record.",
  existing_link: "This source already has a website link that this action cannot replace. Review the existing link through duplicate or merge review.",
  stale_source: "The source evidence changed since this review was prepared. Run Check for museum updates, then review this row again.",
  missing_source: "This row is missing from the source mirror. Run Check for museum updates before reviewing it again.",
  conflict: "Another update interrupted this decision. Reload and check whether it saved before trying again.",
  timeout: "The decision could not finish in time. Reload and check its current status before trying again.",
  review: "The decision could not be saved. Ask an administrator to investigate before retrying this row."
} as const;

export type MuseumSourceReviewErrorCode = keyof typeof sourceReviewErrors;
export class MuseumSourceReviewError extends Error {
  constructor(readonly code: MuseumSourceReviewErrorCode) {
    super(code);
    this.name = "MuseumSourceReviewError";
  }
}
export function museumSourceReviewErrorMessage(code: string) {
  return Object.hasOwn(sourceReviewErrors, code)
    ? sourceReviewErrors[code as MuseumSourceReviewErrorCode]
    : sourceReviewErrors.review;
}
