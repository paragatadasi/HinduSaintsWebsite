import { redirect } from "next/navigation";
import { requireCapability } from "@/lib/admin-access";

type AdminMuseumSectionRedirectPageProps = {
  params: Promise<{ section: string }>;
};

export default async function AdminMuseumSectionRedirectPage({ params }: AdminMuseumSectionRedirectPageProps) {
  await requireCapability("access_museum");
  const { section } = await params;
  redirect(`/museumadmin/${section}`);
}
