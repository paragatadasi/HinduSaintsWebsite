import type { UserRole } from "@/lib/generated/prisma/client";

export type Capability =
  | "view_content"
  | "edit_content"
  | "publish_content"
  | "view_source_data"
  | "run_imports"
  | "resolve_reconciliation"
  | "access_museum"
  | "manage_museum"
  | "manage_site"
  | "view_analytics"
  | "manage_users"
  | "manage_sensitive_actions";

const roleCapabilities: Record<UserRole, readonly Capability[]> = {
  site_admin: ["view_content", "edit_content", "publish_content", "view_source_data", "run_imports", "resolve_reconciliation", "access_museum", "manage_museum", "manage_site", "view_analytics", "manage_users", "manage_sensitive_actions"],
  data_admin: ["view_content", "edit_content", "publish_content", "view_source_data", "run_imports", "resolve_reconciliation"],
  editor: ["view_content", "edit_content", "publish_content"],
  contributor: ["view_content", "edit_content"],
  curator: ["access_museum", "manage_museum"],
  translator: ["view_content"]
};

export const userRoleLabels: Record<UserRole, string> = {
  site_admin: "Site Admin",
  data_admin: "Data Admin",
  editor: "Editor",
  contributor: "Contributor",
  curator: "Curator",
  translator: "Translator"
};

export function hasCapability(roles: readonly UserRole[], capability: Capability) {
  return roles.some((role) => roleCapabilities[role].includes(capability));
}

export function canPublish(roles: readonly UserRole[]) {
  return hasCapability(roles, "publish_content");
}

export function canManageUsers(roles: readonly UserRole[]) {
  return hasCapability(roles, "manage_users");
}
