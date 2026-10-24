import { requireCapability } from "@/lib/admin-access";
import { PublicDesignSpecimens } from "@/components/design-system/public-specimens";

export const dynamic = "force-dynamic";
export const metadata = { title: "Public design specimens", robots: { index: false, follow: false } };

export default async function DesignSystemPreviewPage() {
  await requireCapability("manage_site");
  return <PublicDesignSpecimens />;
}
