import assert from "node:assert/strict";
import test from "node:test";
import { createLocalAccountInput, hashLocalPassword, verifyLocalPassword, isExclusiveMuseumAssistant } from "./local-password";
import { hasCapability } from "./permissions";

test("username accounts normalize identity and cannot choose privileged roles", () => {
  const input = createLocalAccountInput.parse({ username: " Curator.Helper ", password: "a long passphrase 2026" });
  assert.equal(input.username, "curator.helper");
  assert.equal(createLocalAccountInput.safeParse({ ...input, roles: ["site_admin"] }).success, false);
  assert.equal(createLocalAccountInput.safeParse({ ...input, username: "fake@example.org" }).success, false);
  assert.equal(isExclusiveMuseumAssistant(["museum_assistant", "site_admin"]), false);
  assert.equal(isExclusiveMuseumAssistant(["museum_assistant"]), true);
});
test("assistant access permits museum reads without editorial or museum mutation capabilities", () => {
  assert.equal(hasCapability(["museum_assistant"], "access_museum"), true);
  assert.equal(hasCapability(["museum_assistant"], "view_museum_catalog"), true);
  for (const capability of ["view_content", "view_full_saint_catalog", "edit_content", "manage_museum", "manage_users", "run_imports", "publish_content", "manage_saint_team_visibility"] as const) {
    assert.equal(hasCapability(["museum_assistant"], capability), false, capability);
  }
});
test("password hashes use independent salts and verify without retaining plaintext", async () => {
  const password = "a long passphrase 2026";
  const first = await hashLocalPassword(password), second = await hashLocalPassword(password);
  assert.notEqual(first, second);
  assert.equal(first.includes(password), false);
  assert.equal(await verifyLocalPassword(password, first), true);
  assert.equal(await verifyLocalPassword("wrong long passphrase", first), false);
  assert.equal(await verifyLocalPassword(password, null), false);
});
