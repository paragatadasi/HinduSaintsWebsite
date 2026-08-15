import assert from "node:assert/strict";
import test from "node:test";
import { assignmentTaskTypeForWorkflow, assignmentTaskTypeLabel } from "./assignment-task-type";

test("derives the next assignment from the content workflow starting status", () => {
  assert.equal(assignmentTaskTypeForWorkflow("needs_review"), "fact_check");
  assert.equal(assignmentTaskTypeForWorkflow("fact_checked"), "populate");
  assert.equal(assignmentTaskTypeForWorkflow("populated"), "polish");
  assert.equal(assignmentTaskTypeForWorkflow("polished"), null);
});

test("formats workflow assignment types as editorial actions", () => {
  assert.equal(assignmentTaskTypeLabel("fact_check"), "Fact-check");
  assert.equal(assignmentTaskTypeLabel("populate"), "Populate");
  assert.equal(assignmentTaskTypeLabel("polish"), "Polish");
  assert.equal(assignmentTaskTypeLabel("review"), "Review");
});
