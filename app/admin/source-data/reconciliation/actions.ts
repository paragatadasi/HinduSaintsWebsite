"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertCapability } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { reconciliationDecisions, reconciliationDecisionUpdate } from "@/lib/reconciliation-decisions";

const schema = z.object({
  issueId: z.string().cuid(),
  decision: z.enum(reconciliationDecisions),
  note: z.string().trim().max(2000).optional()
});

export async function resolveReconciliationIssue(formData: FormData) {
  const actor = await assertCapability("resolve_reconciliation");
  const parsed = schema.safeParse({ issueId: formData.get("issueId"), decision: formData.get("decision"), note: formData.get("note") || undefined });
  if (!parsed.success) redirect("/admin/source-data/reconciliation?error=Invalid+reconciliation+decision");
  const { decision, issueId, note } = parsed.data;
  const outcome = reconciliationDecisionUpdate(decision);
  await db.reconciliationIssue.update({
    where: { id: issueId },
    data: {
      status: outcome.status,
      resolutionAction: decision,
      resolutionNote: note,
      resolvedByEmail: outcome.finalized ? actor.email : null,
      resolvedById: outcome.finalized ? actor.id : null,
      resolvedAt: outcome.finalized ? new Date() : null
    }
  });
  revalidatePath("/admin/source-data/reconciliation");
  redirect(`/admin/source-data/reconciliation?updated=${decision}`);
}
