import { redirect } from "next/navigation";

export default async function ImportHistoryPage() {
  redirect("/admin/source-data/reconciliation");
}
