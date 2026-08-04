import { requireCapability } from "@/lib/admin-access";

export default async function FeedbackAdminLayout({ children }: { children: React.ReactNode }) {
  await requireCapability("view_content");
  return children;
}
