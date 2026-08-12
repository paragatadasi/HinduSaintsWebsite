import assert from "node:assert/strict";
import test from "node:test";
import { canViewDevelopmentExperienceWithRoles } from "./development-experience-access";

test("off development experiences are hidden from every role", () => {
  assert.equal(canViewDevelopmentExperienceWithRoles("off", ["site_admin"]), false);
  assert.equal(canViewDevelopmentExperienceWithRoles("off", ["tester"]), false);
});

test("admin previews are visible only to site admins, editors, and testers", () => {
  for (const role of ["site_admin", "editor", "tester"] as const) {
    assert.equal(canViewDevelopmentExperienceWithRoles("admin_preview", [role]), true);
  }
  for (const role of ["data_admin", "fact_checker", "writer", "curator", "translator"] as const) {
    assert.equal(canViewDevelopmentExperienceWithRoles("admin_preview", [role]), false);
  }
  assert.equal(canViewDevelopmentExperienceWithRoles("admin_preview", null), false);
});

test("public development experiences are visible without a session", () => {
  assert.equal(canViewDevelopmentExperienceWithRoles("public", null), true);
});
