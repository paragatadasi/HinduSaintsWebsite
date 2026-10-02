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
