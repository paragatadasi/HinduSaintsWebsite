import assert from "node:assert/strict";
import test from "node:test";
import { canUpdateAssignedWorkflow, hasCapability } from "./permissions";

test("fact-checkers retain structured editing without publishing authority", () => {
  assert.equal(hasCapability(["fact_checker"], "view_content"), true);
  assert.equal(hasCapability(["fact_checker"], "edit_structured_content"), true);
  assert.equal(hasCapability(["fact_checker"], "edit_long_form_content"), false);
  assert.equal(hasCapability(["fact_checker"], "publish_content"), false);
  assert.equal(hasCapability(["fact_checker"], "run_imports"), false);
});

test("writers add long-form editing to the fact-checker baseline", () => {
  assert.equal(hasCapability(["writer"], "edit_structured_content"), true);
  assert.equal(hasCapability(["writer"], "edit_long_form_content"), true);
  assert.equal(hasCapability(["writer"], "publish_content"), false);
});

test("legacy contributors remain compatible until the role is removed", () => {
  assert.equal(hasCapability(["contributor"], "edit_structured_content"), true);
  assert.equal(hasCapability(["contributor"], "edit_long_form_content"), false);
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

test("curators manage Museum and the full saint catalog without general editing authority", () => {
  assert.equal(hasCapability(["curator"], "access_museum"), true);
  assert.equal(hasCapability(["curator"], "manage_museum"), true);
  assert.equal(hasCapability(["curator"], "edit_content"), false);
  assert.equal(hasCapability(["curator"], "view_full_saint_catalog"), true);
  assert.equal(hasCapability(["curator"], "view_instagram_review"), false);
  assert.equal(hasCapability(["curator"], "manage_saint_team_visibility"), true);
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

test("all internal roles can self-assign visible content", () => {
  assert.equal(hasCapability(["editor"], "manage_assignments"), true);
  assert.equal(hasCapability(["data_admin"], "manage_assignments"), true);
  assert.equal(hasCapability(["fact_checker"], "manage_assignments"), false);
  assert.equal(hasCapability(["translator"], "manage_assignments"), false);
  assert.equal(hasCapability(["fact_checker"], "self_assign_content"), true);
  assert.equal(hasCapability(["writer"], "self_assign_content"), true);
  assert.equal(hasCapability(["curator"], "self_assign_content"), true);
  assert.equal(hasCapability(["translator"], "self_assign_content"), true);
});

test("workflow updates require an active assignment unless the user manages assignments", () => {
  assert.equal(canUpdateAssignedWorkflow(["fact_checker"], "reviewer-1", ["reviewer-1"]), true);
  assert.equal(canUpdateAssignedWorkflow(["writer"], "reviewer-1", ["reviewer-2", null]), false);
  assert.equal(canUpdateAssignedWorkflow(["editor"], "editor-1", []), true);
});

test("duplicate and Instagram authority stays with the smaller internal circle", () => {
  for (const role of ["site_admin", "data_admin", "editor"] as const) {
    assert.equal(hasCapability([role], "view_instagram_review"), true);
    assert.equal(hasCapability([role], "resolve_duplicate_saints"), true);
    assert.equal(hasCapability([role], "merge_saints"), true);
  }
  for (const role of ["fact_checker", "writer", "curator", "translator"] as const) {
    assert.equal(hasCapability([role], "view_instagram_review"), false);
    assert.equal(hasCapability([role], "resolve_duplicate_saints"), false);
    assert.equal(hasCapability([role], "merge_saints"), false);
  }
});
