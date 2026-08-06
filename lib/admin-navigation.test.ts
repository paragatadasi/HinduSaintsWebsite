import assert from "node:assert/strict";
import test from "node:test";
import {
  getActiveAdminNavigationGroup,
  getAdminNavigationGroupCount,
  isAdminNavigationItemActive,
  type AdminNavigationGroup
} from "./admin-navigation";

const groups: AdminNavigationGroup[] = [
  {
    href: "/admin",
    id: "operations",
    label: "Operations",
    items: [
      { exact: true, href: "/admin", label: "Dashboard" },
      { count: 2, href: "/admin/work", label: "My Work" },
      { count: 3, href: "/admin/feedback", label: "Inbox" }
    ]
  },
  {
    href: "/admin/source-data",
    id: "source-data",
    label: "Source Data",
    items: [
      { exact: true, href: "/admin/source-data", label: "Overview" },
      { href: "/admin/source-data/reconciliation", label: "Reconciliation" },
      { href: "/admin/airtable", label: "Airtable" }
    ]
  }
];

test("exact admin navigation items do not claim nested workspaces", () => {
  assert.equal(isAdminNavigationItemActive("/admin", groups[0].items[0]), true);
  assert.equal(isAdminNavigationItemActive("/admin/saints", groups[0].items[0]), false);
});

test("workspace items remain active on detail routes", () => {
  assert.equal(isAdminNavigationItemActive("/admin/feedback/example", groups[0].items[2]), true);
});

test("finds the group for routes that live outside the group prefix", () => {
  assert.equal(getActiveAdminNavigationGroup("/admin/airtable", groups)?.id, "source-data");
});

test("adds only visible item counts for a workspace badge", () => {
  assert.equal(getAdminNavigationGroupCount(groups[0]), 5);
});
