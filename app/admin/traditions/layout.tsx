import { requireCapability } from "@/lib/admin-access";

export default async function TraditionsAdminLayout({ children }: { children: React.ReactNode }) {
  await requireCapability("view_content");
  return children;
}
