export const reconciliationDecisions = ["keep_current", "accept_source", "merge", "ignore", "defer"] as const;

export type ReconciliationDecision = (typeof reconciliationDecisions)[number];

export function reconciliationDecisionUpdate(decision: ReconciliationDecision) {
  const finalized = decision === "keep_current" || decision === "ignore";
  return {
    status: decision === "ignore" ? "ignored" : decision === "keep_current" ? "resolved" : "open",
    finalized
  } as const;
}
