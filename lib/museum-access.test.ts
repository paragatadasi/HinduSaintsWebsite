import assert from "node:assert/strict";
import test from "node:test";
import { museumMutationCapabilities } from "./museum-access";

test("ordinary Museum writes require curator mutation authority", () => {
  assert.deepEqual(museumMutationCapabilities(), ["manage_museum"]);
});

test("destructive Museum writes additionally require Site Admin authority", () => {
  assert.deepEqual(museumMutationCapabilities(true), ["manage_museum", "manage_sensitive_actions"]);
});
