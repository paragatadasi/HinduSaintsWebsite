import assert from "node:assert/strict";
import test from "node:test";
import {
  canAccessSaintCatalog,
  canManageSaintTeamVisibility,
  canViewSaintWithRoles,
  getAdminSaintCatalogScope,
  saintCatalogWhere
} from "./admin-saint-access";

test("full-catalog roles default to Full Catalog and may choose Public", () => {
  for (const role of ["site_admin", "data_admin", "editor", "curator"] as const) {
    assert.equal(canAccessSaintCatalog([role]), true);
    assert.equal(getAdminSaintCatalogScope([role]), "full");
    assert.equal(getAdminSaintCatalogScope([role], "public"), "public");
  }
});

test("other internal roles are always clamped to Team-Public saints", () => {
  for (const role of ["fact_checker", "writer", "translator"] as const) {
    assert.equal(canAccessSaintCatalog([role]), true);
    assert.equal(getAdminSaintCatalogScope([role], "full"), "public");
    assert.equal(canViewSaintWithRoles([role], { teamVisibility: "private" }), false);
    assert.equal(canViewSaintWithRoles([role], { teamVisibility: "public" }), true);
  }
});

test("catalog where clauses distinguish internal Public from external Published", () => {
  assert.deepEqual(saintCatalogWhere("full"), {});
  assert.deepEqual(saintCatalogWhere("public"), { teamVisibility: "public" });
  assert.deepEqual(saintCatalogWhere("published"), { publicationStatus: "published" });
});

test("curators can manage Saint visibility without general visibility authority", () => {
  assert.equal(canManageSaintTeamVisibility(["curator"]), true);
  assert.equal(canManageSaintTeamVisibility(["fact_checker"]), false);
});
