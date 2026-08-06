"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import {
  getActiveAdminNavigationGroup,
  getAdminNavigationGroupCount,
  isAdminNavigationItemActive,
  type AdminNavigationGroup
} from "@/lib/admin-navigation";

export function AdminPrimaryNavigation({ groups }: { groups: AdminNavigationGroup[] }) {
  const pathname = usePathname();
  const activeGroup = getActiveAdminNavigationGroup(pathname, groups);

  return (
    <aside className="admin-sidebar">
      <Link className="admin-sidebar__brand" href="/admin">
        <strong>Admin CMS</strong>
      </Link>
      <nav aria-label="Admin workspaces" className="admin-sidebar__workspaces">
        {groups.map((group) => {
          const count = getAdminNavigationGroupCount(group);
          const active = activeGroup?.id === group.id;
          return (
            <Link
              aria-current={active ? "location" : undefined}
              className={clsx("admin-sidebar__workspace-link", active && "admin-sidebar__workspace-link--active")}
              href={group.href as Route}
              key={group.id}
            >
              <span>{group.label}</span>
              {count > 0 ? <span className="admin-navigation-count">{count}</span> : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function AdminWorkspaceTabs({ groups }: { groups: AdminNavigationGroup[] }) {
  const pathname = usePathname();
  const activeGroup = getActiveAdminNavigationGroup(pathname, groups);
  if (!activeGroup || activeGroup.standalone || activeGroup.items.length < 2) return null;

  return (
    <nav aria-label={`${activeGroup.label} sections`} className="admin-workspace-tabs">
      <span className="admin-workspace-tabs__label">{activeGroup.label}</span>
      <div className="admin-workspace-tabs__rail">
        {activeGroup.items.map((item) => {
          const active = isAdminNavigationItemActive(pathname, item);
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className="admin-workspace-tab"
              href={item.href as Route}
              key={item.href}
            >
              <span>{item.label}</span>
              {typeof item.count === "number" && item.count > 0 ? (
                <span className="admin-navigation-count">{item.count}</span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
