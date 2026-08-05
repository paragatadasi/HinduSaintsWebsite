import { requireCapability } from "@/lib/admin-access";

export default async function SourceDataLayout({ children }: { children: React.ReactNode }) {
  await requireCapability("view_source_data");
  return children;
}
