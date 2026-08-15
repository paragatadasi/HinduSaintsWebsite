import assert from "node:assert/strict";
import test from "node:test";
import type { Prisma } from "./generated/prisma/client";
import { acquireAssignmentClaimLock } from "./assignment-claim-lock";

test("assignment claim locks use the raw execute path", async () => {
  let statement = "";
  let values: unknown[] = [];
  const tx = {
    $executeRaw: async (strings: TemplateStringsArray, ...parameters: unknown[]) => {
      statement = strings.join("?");
      values = parameters;
      return 1;
    }
  } as unknown as Prisma.TransactionClient;

  await acquireAssignmentClaimLock(tx, "user-123");

  assert.equal(statement, "SELECT pg_advisory_xact_lock(hashtext(?))");
  assert.deepEqual(values, ["user-123"]);
});
