import { requireCapability } from "@/lib/admin-access";

export default async function InstagramAdminLayout({ children }: { children: React.ReactNode }) {
  await requireCapability("view_instagram_review");
  return children;
}
