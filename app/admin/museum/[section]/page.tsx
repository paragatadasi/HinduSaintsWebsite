import { redirect } from "next/navigation";

type AdminMuseumSectionRedirectPageProps = {
  params: Promise<{ section: string }>;
};

export default async function AdminMuseumSectionRedirectPage({ params }: AdminMuseumSectionRedirectPageProps) {
  const { section } = await params;
  redirect(`/museumadmin/${section}`);
}
