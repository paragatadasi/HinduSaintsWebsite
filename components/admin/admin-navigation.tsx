"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import {
  getActiveAdminNavigationGroup,
  isAdminNavigationItemActive,
  type AdminNavigationGroup
} from "@/lib/admin-navigation";

export function AdminPrimaryNavigation({ groups }: { groups: AdminNavigationGroup[] }) {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar">
      <Link aria-current={pathname === "/admin" ? "page" : undefined} className="admin-sidebar__brand" href="/admin">
        <strong>Dashboard</strong>
      </Link>
      <nav aria-label="Admin navigation" className="admin-sidebar__sections">
        {groups.map((group) => (
          <div className="admin-sidebar__group" key={group.id}>
            <div className="admin-sidebar__heading">{group.label}</div>
            {group.items.map((item) => {
              const active = isAdminNavigationItemActive(pathname, item);
              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={clsx("admin-sidebar__link", active && "admin-sidebar__link--active")}
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
        ))}
      </nav>
    </aside>
  );
}

// Nested route navigation only. Main admin destinations belong in the left sidebar.
export function AdminWorkspaceTabs({ groups }: { groups: AdminNavigationGroup[] }) {
  const pathname = usePathname();
  const activeGroup = getActiveAdminNavigationGroup(pathname, groups);
  if (!activeGroup || activeGroup.standalone || activeGroup.items.length < 2) return null;

  return (
    <nav aria-label={`${activeGroup.label} sections`} className="admin-workspace-tabs">
      <span className="admin-workspace-tabs__label">{activeGroup.label}</span>
      <div className="admin-workspace-tabs__rail admin-tab-strip">
        {activeGroup.items.map((item) => {
          const active = isAdminNavigationItemActive(pathname, item);
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className="admin-workspace-tab admin-tab-strip__tab"
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
