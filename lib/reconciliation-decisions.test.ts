import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { reconciliationDecisionUpdate } from "./reconciliation-decisions";

describe("reconciliation decisions", () => {
  it("finalizes keep-current and ignore decisions", () => {
    assert.deepEqual(reconciliationDecisionUpdate("keep_current"), { status: "resolved", finalized: true });
    assert.deepEqual(reconciliationDecisionUpdate("ignore"), { status: "ignored", finalized: true });
  });

  for (const decision of ["accept_source", "merge", "defer"] as const) {
    it(`keeps ${decision} open for explicit follow-up`, () => {
      assert.deepEqual(reconciliationDecisionUpdate(decision), { status: "open", finalized: false });
    });
  }
});
