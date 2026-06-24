import { notFound } from "next/navigation";
import {
  TraditionPageLayouts,
  traditionLayoutOptions,
  type TraditionDetailLayoutOption
} from "@/components/traditions/tradition-page-layouts";
import { getPublishedTraditionBySlug } from "@/lib/public-traditions";
import { getTraditionDetailTemplateContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export default async function TraditionDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const template = getTraditionDetailTemplateContent();
  const tradition = await getPublishedTraditionBySlug(slug);
  const layout = getSelectedLayout(resolvedSearchParams.layout);

  if (!tradition) notFound();

  return <TraditionPageLayouts tradition={tradition} template={template} layout={layout} />;
}

function getSelectedLayout(value: string | string[] | undefined): TraditionDetailLayoutOption {
  const layout = Array.isArray(value) ? value[0] : value;

  return traditionLayoutOptions.some((option) => option.value === layout)
    ? layout as TraditionDetailLayoutOption
    : "overview";
}
