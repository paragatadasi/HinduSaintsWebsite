import type { Route } from "next";
import { redirect } from "next/navigation";
import { requireCapability } from "@/lib/admin-access";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function WorkDashboardRedirect({ searchParams }: Props) {
  await requireCapability("view_content");
  const params = await searchParams;
  const dashboardParams = new URLSearchParams();
  dashboardParams.set("work", parseView(first(params.view)));

  const updated = first(params.updated);
  const error = first(params.error);
  if (updated) dashboardParams.set("updated", updated);
  if (error) dashboardParams.set("error", error);

  redirect(`/admin?${dashboardParams.toString()}#my-work` as Route);
}

function parseView(value: string | undefined) {
  return value === "available" || value === "blocked" || value === "completed" || value === "team" ? value : "mine";
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
