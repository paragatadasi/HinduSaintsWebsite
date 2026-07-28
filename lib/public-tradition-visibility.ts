export const PUBLIC_TRADITION_STATUSES = ["draft", "needs_review", "published"] as const;

export type PublicTraditionPresentation = "basic" | "published";

export function getPublicTraditionPresentation(
  status: string
): PublicTraditionPresentation | null {
  if (status === "published") return "published";
  if (status === "draft" || status === "needs_review") return "basic";
  return null;
}
