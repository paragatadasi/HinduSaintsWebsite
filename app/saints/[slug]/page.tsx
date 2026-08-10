import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { SaintDetailPageContent } from "@/components/saints/saint-detail-page";
import { getPublishedSaintBySlug, getPublishedSaintRedirectBySlug, getRelatedPublishedSaints } from "@/lib/public-saints";
import { getSaintDetailTemplateContent } from "@/lib/site-content";
import { getSocialImage } from "@/lib/social-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const saint = await getPublishedSaintBySlug(slug);
  if (!saint) return {};

  const title = saint.seo?.title ?? saint.displayName;
  const description = saint.seo?.description ?? saint.shortDescription;
  const canonicalPath = `/saints/${slug}`;
  const socialTitle = `${title} | Hindu Saints Archive`;
  const image = getSocialImage(saint.heroImage, { fallbackAlt: saint.displayName });

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "profile",
      url: canonicalPath,
      siteName: "Hindu Saints Archive",
      title: socialTitle,
      description,
      images: [image]
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [image.url]
    }
  };
}

export default async function SaintDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const template = getSaintDetailTemplateContent();
  const [saint, relatedSaints, redirectSlug] = await Promise.all([
    getPublishedSaintBySlug(slug),
    getRelatedPublishedSaints(slug),
    getPublishedSaintRedirectBySlug(slug)
  ]);
  if (!saint && redirectSlug) permanentRedirect(`/saints/${redirectSlug}`);
  if (!saint) notFound();

  return <SaintDetailPageContent relatedSaints={relatedSaints} saint={saint} template={template} />;
}
