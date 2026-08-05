import assert from "node:assert/strict";
import test from "node:test";
import { versionedMutation } from "./admin-conflicts";

test("optimistic updates require the rendered version and increment atomically", () => {
  assert.deepEqual(versionedMutation(7, { name: "Attempted" }), {
    where: { version: 7 },
    data: { name: "Attempted", version: { increment: 1 } }
  });
});
