import { redirect } from "next/navigation";

type AdminMuseumFamilyTreeRedirectProps = {
  params: Promise<{ file: string }>;
};

export async function GET(_request: Request, { params }: AdminMuseumFamilyTreeRedirectProps) {
  const { file } = await params;
  redirect(`/museumadmin/family-tree/${file}`);
}
