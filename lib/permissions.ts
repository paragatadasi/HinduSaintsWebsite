export type UserRole = "admin" | "editor" | "contributor";

export function canPublish(role: UserRole) {
  return role === "admin" || role === "editor";
}

export function canManageUsers(role: UserRole) {
  return role === "admin";
}
