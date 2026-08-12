import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PlaceDetailPageContent } from "@/components/places/place-detail-page";
import { getPublishedPlaceBySlug } from "@/lib/public-places";
import { getPlaceDetailTemplateContent } from "@/lib/site-content";
import { buildPublicMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const place = await getPublishedPlaceBySlug(slug);
  if (!place) return { robots: { index: false, follow: false } };

  return buildPublicMetadata({
    title: place.name,
    description: place.shortDescription || `Discover published Hindu saints associated with ${place.name}.`,
    path: `/places/${slug}`
  });
}

export default async function PlaceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const template = getPlaceDetailTemplateContent();
  const place = await getPublishedPlaceBySlug(slug);

  if (!place) notFound();

  return <PlaceDetailPageContent place={place} template={template} />;
}
