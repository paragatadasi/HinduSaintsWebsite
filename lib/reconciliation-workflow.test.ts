import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  decisionError, duplicateQueueFor, duplicateQueueWhere, duplicateQueues,
  parseQueue, queueLabel, reconciliationHref, sourceQueueFor, sourceQueueWhere, sourceQueues
} from "./reconciliation-workflow";
import { reconciliationDecisionUpdate } from "./reconciliation-decisions";
import { duplicateDecisionUpdate } from "./saint-duplicates";

// Evaluate the small subset of Prisma predicates used by queue membership.
// Fixtures exercise the stored legacy states as well as new decision outcomes.
function matches(row: Record<string, unknown>, where: Record<string, unknown>): boolean {
  return Object.entries(where).every(([key, expected]) => {
    if (key === "OR") return (expected as Record<string, unknown>[]).some((part) => matches(row, part));
    if (expected && typeof expected === "object") {
      const filter = expected as { in?: unknown[]; notIn?: unknown[]; not?: unknown };
      if (row[key] === null) return false; // SQL comparisons do not include NULL.
      if (filter.in) return filter.in.includes(row[key]);
      if (filter.notIn) return !filter.notIn.includes(row[key]);
      return row[key] !== filter.not;
    }
    return row[key] === expected;
  });
}

describe("reconciliation queue membership", () => {
  for (const decision of ["confirm", "ignore", "defer", "reopen"] as const) {
    it(`puts duplicate ${decision} in exactly one actionable/history queue`, () => {
      const record = { ...duplicateDecisionUpdate(decision), entityType: "Saint", resolutionAction: decision };
      const queues = duplicateQueues.filter((queue) => matches(record, duplicateQueueWhere(queue)));
      assert.deepEqual(queues, [duplicateQueueFor(record)]);
      if (decision === "confirm") assert.deepEqual(queues, ["resolved"]);
      if (decision === "defer") assert.deepEqual(queues, ["deferred"]);
    });
  }
  for (const decision of ["keep_current", "accept_source", "merge", "ignore", "defer", "reopen"] as const) {
    it(`puts source ${decision} in exactly one queue`, () => {
      const record = { ...reconciliationDecisionUpdate(decision), resolutionAction: decision };
      assert.deepEqual(sourceQueues.filter((queue) => matches(record, sourceQueueWhere(queue))), [sourceQueueFor(record)]);
      if (decision === "accept_source" || decision === "merge") {
        assert.equal(sourceQueueFor(record), "follow_up");
        assert.equal(record.finalized, false);
      }
    });
  }
  it("keeps legacy null decisions visible", () => {
    for (const status of ["open", "resolved", "ignored"] as const) {
      const record = { status, entityType: "Saint", resolutionAction: null };
      assert.deepEqual(duplicateQueues.filter((queue) => matches(record, duplicateQueueWhere(queue))), [status]);
      assert.deepEqual(sourceQueues.filter((queue) => matches(record, sourceQueueWhere(queue))), [status]);
    }
  });
  it("separates actual and related completed merges from awaiting merge", () => {
    for (const resolutionAction of ["merged", "closed_by_merge"]) {
      const record = { status: "resolved", entityType: "Saint", resolutionAction };
      assert.deepEqual(duplicateQueues.filter((queue) => matches(record, duplicateQueueWhere(queue))), ["merged"]);
      assert.ok(decisionError("resolved", "reopen", undefined, true));
    }
  });
});

describe("review transitions and navigation", () => {
  it("requires meaningful deferral notes and explicit reopening of completed work", () => {
    assert.ok(decisionError("open", "defer", "   "));
    assert.equal(decisionError("open", "defer", "Need to check the original source"), null);
    assert.ok(decisionError("resolved", "keep_current"));
    assert.ok(decisionError("ignored", "confirm"));
    assert.equal(decisionError("ignored", "reopen"), null);
    assert.ok(decisionError("open", "reopen"));
  });
  it("uses source-specific labels and rejects statuses from the other workflow", () => {
    assert.equal(queueLabel("source", "resolved"), "Resolved");
    assert.equal(queueLabel("source", "ignored"), "Ignored");
    assert.equal(queueLabel("duplicates", "resolved"), "Awaiting merge");
    assert.equal(parseQueue("source", "merged"), "open");
    assert.equal(parseQueue("duplicates", "follow_up"), "open");
    assert.equal(parseQueue("source", "deferred"), "deferred");
  });
  it("preserves issue filters and returns to the affected review without accepting an external URL", () => {
    const href = reconciliationHref("source", "follow_up", { type: "date conflict & source", updated: "accept_source", anchor: "reconciliation-abc" });
    const url = new URL(href, "https://example.test");
    assert.equal(url.pathname, "/admin/source-data/reconciliation");
    assert.equal(url.searchParams.get("type"), "date conflict & source");
    assert.equal(url.searchParams.get("status"), "follow_up");
    assert.equal(url.hash, "#review-card-reconciliation-abc");
  });
});
