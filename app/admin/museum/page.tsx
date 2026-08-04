import { redirect } from "next/navigation";
import { requireCapability } from "@/lib/admin-access";

export default async function AdminMuseumRedirectPage() {
  await requireCapability("access_museum");
  redirect("/museumadmin");
}
