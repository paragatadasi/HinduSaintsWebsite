import assert from "node:assert/strict";
import test from "node:test";
import { hasCapability } from "./permissions";

test("contributors can edit but cannot publish or run imports", () => {
  assert.equal(hasCapability(["contributor"], "view_content"), true);
  assert.equal(hasCapability(["contributor"], "edit_content"), true);
  assert.equal(hasCapability(["contributor"], "publish_content"), false);
  assert.equal(hasCapability(["contributor"], "run_imports"), false);
});

test("translators are view-only until translation workflows exist", () => {
  assert.equal(hasCapability(["translator"], "view_content"), true);
  assert.equal(hasCapability(["translator"], "edit_content"), false);
});

test("data admins are editors with source-data authority", () => {
  for (const capability of ["view_content", "edit_content", "publish_content", "view_source_data", "run_imports", "resolve_reconciliation"] as const) {
    assert.equal(hasCapability(["data_admin"], capability), true);
  }
  assert.equal(hasCapability(["data_admin"], "manage_users"), false);
});

test("curators manage Museum without general content or destructive authority", () => {
  assert.equal(hasCapability(["curator"], "access_museum"), true);
  assert.equal(hasCapability(["curator"], "manage_museum"), true);
  assert.equal(hasCapability(["curator"], "edit_content"), false);
  assert.equal(hasCapability(["curator"], "manage_sensitive_actions"), false);
});

test("roles combine additively", () => {
  const roles = ["curator", "editor"] as const;
  assert.equal(hasCapability(roles, "manage_museum"), true);
  assert.equal(hasCapability(roles, "publish_content"), true);
});

test("only Site Admin has sensitive and user-management capabilities", () => {
  assert.equal(hasCapability(["site_admin"], "manage_sensitive_actions"), true);
  assert.equal(hasCapability(["site_admin"], "manage_users"), true);
  assert.equal(hasCapability(["editor", "data_admin", "curator"], "manage_sensitive_actions"), false);
});
