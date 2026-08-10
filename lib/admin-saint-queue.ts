export type AdminSaintQueueScope = "full" | "public";

export function getAdminSaintsQueueUrl(
  scope: AdminSaintQueueScope,
  filters: Readonly<Record<string, string>>,
  query: string
) {
  const params = new URLSearchParams({ scope });
  for (const [name, value] of Object.entries(filters)) {
    if (name === "workflow" && scope === "full") continue;
    if (name === "visibility" && scope === "public") continue;
    if (value !== "all") params.set(name, value);
  }
  if (query) params.set("q", query);
  return `/admin/saints?${params.toString()}`;
}
