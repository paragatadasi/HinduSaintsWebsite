import { requireSaintCatalogUser } from "@/lib/admin-access";

export default async function SaintsAdminLayout({ children }: { children: React.ReactNode }) {
  await requireSaintCatalogUser();
  return children;
}
