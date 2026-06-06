import { notFound } from "next/navigation";
import { Prose } from "@/components/content/prose";
import { getPublishedSampradayas, getSampradayaBySlug } from "@/lib/sample-data";

export function generateStaticParams() {
  return getPublishedSampradayas().map((sampradaya) => ({ slug: sampradaya.slug }));
}

export default async function SampradayaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sampradaya = getSampradayaBySlug(slug);

  if (!sampradaya) notFound();

  return (
    <main className="page-shell section site-grid">
      <div>
        <div className="eyebrow">Sampradaya</div>
        <h1 className="page-title">{sampradaya.name}</h1>
        <p className="lede">{sampradaya.shortDescription}</p>
      </div>
      <Prose markdown={`This page is the launch template for tradition introductions. Founder, associated saints, sources, and longer Markdown content will be managed in the CMS.`} />
    </main>
  );
}
