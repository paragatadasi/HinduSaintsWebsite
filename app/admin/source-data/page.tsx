import { redirect } from "next/navigation";

export default async function SourceDataPage() {
  redirect("/admin/source-data/reconciliation");
}
