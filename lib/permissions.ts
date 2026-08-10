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
  | "manage_assignments"
  | "manage_sensitive_actions"
  | "view_full_saint_catalog"
  | "view_instagram_review"
  | "edit_structured_content"
  | "edit_long_form_content"
  | "manage_team_visibility"
  | "manage_saint_team_visibility"
  | "resolve_duplicate_saints"
  | "merge_saints"
  | "self_assign_content"
  | "update_assigned_workflow";

const workflowParticipant: readonly Capability[] = ["self_assign_content", "update_assigned_workflow"];
const structuredEditor: readonly Capability[] = ["view_content", "edit_content", "edit_structured_content", ...workflowParticipant];
const longFormEditor: readonly Capability[] = [...structuredEditor, "edit_long_form_content"];
const catalogCoordinator: readonly Capability[] = [
  ...longFormEditor,
  "publish_content",
  "manage_assignments",
  "view_full_saint_catalog",
  "view_instagram_review",
  "manage_team_visibility",
  "manage_saint_team_visibility",
  "resolve_duplicate_saints",
  "merge_saints"
];

const roleCapabilities: Record<UserRole, readonly Capability[]> = {
  site_admin: [
    ...catalogCoordinator,
    "view_source_data",
    "run_imports",
    "resolve_reconciliation",
    "access_museum",
    "manage_museum",
    "manage_site",
    "view_analytics",
    "manage_users",
    "manage_sensitive_actions"
  ],
  data_admin: [...catalogCoordinator, "view_source_data", "run_imports", "resolve_reconciliation"],
  editor: catalogCoordinator,
  contributor: structuredEditor,
  fact_checker: structuredEditor,
  writer: longFormEditor,
  curator: ["access_museum", "manage_museum", "view_full_saint_catalog", "manage_saint_team_visibility", ...workflowParticipant],
  translator: ["view_content", ...workflowParticipant]
};

export const userRoleLabels: Record<UserRole, string> = {
  site_admin: "Site Admin",
  data_admin: "Data Admin",
  editor: "Editor",
  contributor: "Contributor",
  fact_checker: "Fact-checker",
  writer: "Writer",
  curator: "Curator",
  translator: "Translator"
};

export function hasCapability(roles: readonly UserRole[], capability: Capability) {
  return roles.some((role) => roleCapabilities[role].includes(capability));
}

export function canPublish(roles: readonly UserRole[]) {
  return hasCapability(roles, "publish_content");
}

export function canReviewEditorialRevisions(roles: readonly UserRole[]) {
  return roles.includes("site_admin") || roles.includes("editor");
}

export function canManageUsers(roles: readonly UserRole[]) {
  return hasCapability(roles, "manage_users");
}

export function canUpdateAssignedWorkflow(
  roles: readonly UserRole[],
  userId: string,
  activeAssigneeIds: readonly (string | null)[]
) {
  return hasCapability(roles, "update_assigned_workflow") && (
    hasCapability(roles, "manage_assignments")
    || activeAssigneeIds.includes(userId)
  );
}
