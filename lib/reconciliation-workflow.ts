import type { Prisma } from "./generated/prisma/client";

export type ReconciliationView = "duplicates" | "source";
export type ReconciliationQueue = "open" | "follow_up" | "deferred" | "resolved" | "merged" | "ignored";

export const duplicateQueues = ["open", "resolved", "deferred", "merged", "ignored"] as const;
export const sourceQueues = ["open", "follow_up", "deferred", "resolved", "ignored"] as const;
const mergeActions = ["merged", "closed_by_merge"];
const followUpActions = ["accept_source", "merge"];

// Query each bucket before applying the overall queue limit. Sorting a limited
// set afterward would still hide urgent issues outside the first page.
export const sourceSeverityFilters: Prisma.ReconciliationIssueWhereInput[] = [
  { severity: "high" }, { severity: "medium" }, { severity: "low" },
  { severity: { notIn: ["high", "medium", "low"] } }
];

export function queueLabel(view: ReconciliationView, queue: ReconciliationQueue) {
  if (queue === "open") return "Needs review";
  if (queue === "deferred") return "Deferred";
  if (queue === "follow_up") return "Follow-up needed";
  if (queue === "merged") return "Merge history";
  if (queue === "resolved") return view === "duplicates" ? "Awaiting merge" : "Resolved";
  return view === "duplicates" ? "Not a duplicate" : "Ignored";
}

export function parseQueue(view: ReconciliationView, value?: string): ReconciliationQueue {
  const queues: readonly string[] = view === "duplicates" ? duplicateQueues : sourceQueues;
  return queues.includes(value || "") ? value as ReconciliationQueue : "open";
}

export function duplicateQueueWhere(queue: ReconciliationQueue): Prisma.DuplicateCandidateWhereInput {
  const base = { entityType: "Saint" };
  if (queue === "deferred") return { ...base, status: "open", resolutionAction: "defer" };
  if (queue === "merged") return { ...base, status: "resolved", resolutionAction: { in: mergeActions } };
  if (queue === "resolved") return {
    ...base, status: "resolved",
    OR: [{ resolutionAction: null }, { resolutionAction: { notIn: mergeActions } }]
  };
  if (queue === "ignored") return { ...base, status: "ignored" };
  return { ...base, status: "open", OR: [{ resolutionAction: null }, { resolutionAction: { not: "defer" } }] };
}

export function sourceQueueWhere(queue: ReconciliationQueue): Prisma.ReconciliationIssueWhereInput {
  if (queue === "deferred") return { status: "open", resolutionAction: "defer" };
  if (queue === "follow_up") return { status: "open", resolutionAction: { in: followUpActions } };
  if (queue === "resolved" || queue === "ignored") return { status: queue };
  return { status: "open", OR: [{ resolutionAction: null }, { resolutionAction: { notIn: [...followUpActions, "defer"] } }] };
}

export function duplicateQueueFor(record: { status: string; resolutionAction: string | null }): ReconciliationQueue {
  if (record.status === "resolved") return mergeActions.includes(record.resolutionAction || "") ? "merged" : "resolved";
  if (record.status === "ignored") return "ignored";
  return record.resolutionAction === "defer" ? "deferred" : "open";
}

export function sourceQueueFor(record: { status: string; resolutionAction: string | null }): ReconciliationQueue {
  if (record.status === "resolved" || record.status === "ignored") return record.status;
  if (record.resolutionAction === "defer") return "deferred";
  return followUpActions.includes(record.resolutionAction || "") ? "follow_up" : "open";
}

export function decisionError(status: string, decision: string, note?: string, completedMerge = false) {
  if (completedMerge) return "This review was closed by a merge and cannot be reopened.";
  if (decision === "defer" && !note?.trim()) return "Add a reason before deferring this review.";
  if (status !== "open" && decision !== "reopen") return "Reopen this review before making another decision.";
  if (status === "open" && decision === "reopen") return "This review is already open.";
  return null;
}

// All return destinations are constructed locally; arbitrary redirect URLs are
// never accepted from the form.
export function reconciliationHref(view: ReconciliationView, queue: ReconciliationQueue, options: {
  type?: string; updated?: string; error?: string; candidate?: string; anchor?: string;
} = {}) {
  const params = new URLSearchParams({ view, status: queue });
  for (const key of ["type", "updated", "error", "candidate"] as const) {
    if (options[key]) params.set(key, options[key]!);
  }
  return `/admin/source-data/reconciliation?${params}${options.anchor ? `#review-card-${encodeURIComponent(options.anchor)}` : ""}`;
}
