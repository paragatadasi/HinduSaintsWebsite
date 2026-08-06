export type AdminNavigationItem = {
  count?: number;
  exact?: boolean;
  href: string;
  label: string;
};

export type AdminNavigationGroup = {
  href: string;
  id: string;
  items: AdminNavigationItem[];
  label: string;
  standalone?: boolean;
};

export function isAdminNavigationItemActive(pathname: string, item: AdminNavigationItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function getActiveAdminNavigationGroup(pathname: string, groups: AdminNavigationGroup[]) {
  return groups.find((group) => group.items.some((item) => isAdminNavigationItemActive(pathname, item)));
}

export function getAdminNavigationGroupCount(group: AdminNavigationGroup) {
  return group.items.reduce((total, item) => total + (item.count ?? 0), 0);
}
