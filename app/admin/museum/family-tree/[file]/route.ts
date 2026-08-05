import { redirect } from "next/navigation";
import { requireCapability } from "@/lib/admin-access";

type AdminMuseumFamilyTreeRedirectProps = {
  params: Promise<{ file: string }>;
};

export async function GET(_request: Request, { params }: AdminMuseumFamilyTreeRedirectProps) {
  await requireCapability("access_museum");
  const { file } = await params;
  redirect(`/museumadmin/family-tree/${file}`);
}
