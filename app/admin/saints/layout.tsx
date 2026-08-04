import { requireCapability } from "@/lib/admin-access";

export default async function SaintsAdminLayout({ children }: { children: React.ReactNode }) {
  await requireCapability("view_content");
  return children;
}
