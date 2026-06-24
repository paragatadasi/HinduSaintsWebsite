import { notFound } from "next/navigation";
import { TraditionPageLayouts } from "@/components/traditions/tradition-page-layouts";
import { getPublishedTraditionBySlug } from "@/lib/public-traditions";
import { getTraditionDetailTemplateContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export default async function TraditionDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const template = getTraditionDetailTemplateContent();
  const tradition = await getPublishedTraditionBySlug(slug);

  if (!tradition) notFound();

  return <TraditionPageLayouts tradition={tradition} template={template} />;
}
