import { requireCapability } from "@/lib/admin-access";

export default async function PlacesAdminLayout({ children }: { children: React.ReactNode }) {
  await requireCapability("view_content");
  return children;
}
