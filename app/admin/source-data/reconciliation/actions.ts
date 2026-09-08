"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertCapability } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { reconciliationDecisions, reconciliationDecisionUpdate } from "@/lib/reconciliation-decisions";
import { decisionError, parseQueue, reconciliationHref, sourceQueueFor } from "@/lib/reconciliation-workflow";

const schema = z.object({
  issueId: z.string().cuid(),
  decision: z.enum(reconciliationDecisions),
  expectedUpdatedAt: z.string().datetime(),
  note: z.string().trim().max(2000).optional()
});

export async function resolveReconciliationIssue(formData: FormData) {
  const actor = await assertCapability("resolve_reconciliation");
  const queue = parseQueue("source", String(formData.get("queue") || ""));
  const type = String(formData.get("type") || "all");
  function fail(error: string): never {
    redirect(reconciliationHref("source", queue, { type, error }) as Route);
  }
  const parsed = schema.safeParse({
    issueId: formData.get("issueId"), decision: formData.get("decision"),
    expectedUpdatedAt: formData.get("expectedUpdatedAt"), note: formData.get("note") || undefined
  });
  if (!parsed.success) fail("Invalid reconciliation decision. Reload the review and try again.");
  const { decision, issueId, note, expectedUpdatedAt } = parsed.data;
  const outcome = reconciliationDecisionUpdate(decision);
  let error: string | null;
  try {
    error = await db.$transaction(async (tx) => {
      const issue = await tx.reconciliationIssue.findUnique({ where: { id: issueId } });
      if (!issue) return "This issue is no longer available.";
      const invalid = decisionError(issue.status, decision, note);
      if (invalid) return invalid;
      const data = {
        status: outcome.status,
        resolutionAction: decision,
        resolutionNote: decision === "reopen" ? null : note ?? null,
        resolvedByEmail: actor.email,
        resolvedById: actor.id,
        resolvedAt: outcome.finalized ? new Date() : null
      };
      const updated = await tx.reconciliationIssue.updateMany({
        where: { id: issueId, updatedAt: new Date(expectedUpdatedAt) }, data
      });
      if (updated.count !== 1) return "This issue changed since you opened it. Reload and review the latest decision.";
      await tx.auditEvent.create({ data: {
        userId: actor.id, action: "review_reconciliation", entityType: "ReconciliationIssue", entityId: issueId,
        beforeJson: { status: issue.status, action: issue.resolutionAction, note: issue.resolutionNote },
        afterJson: { status: data.status, action: decision, note: data.resolutionNote }
      } });
      return null;
    });
  } catch {
    fail("The decision could not be saved. Reload the review and try again.");
  }
  if (error) fail(error);
  revalidatePath("/admin/source-data/reconciliation");
  revalidatePath("/admin");
  redirect(reconciliationHref("source", sourceQueueFor({ status: outcome.status, resolutionAction: decision }), {
    type, updated: decision, anchor: `reconciliation-${issueId}`
  }) as Route);
}
