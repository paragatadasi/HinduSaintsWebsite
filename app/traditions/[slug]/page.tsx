import { notFound } from "next/navigation";
import { Prose } from "@/components/content/prose";
import { getPublishedTraditions, getTraditionBySlug } from "@/lib/sample-data";
import { getTraditionDetailTemplateContent } from "@/lib/site-content";

export function generateStaticParams() {
  return getPublishedTraditions().map((tradition) => ({ slug: tradition.slug }));
}

export default async function TraditionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const template = getTraditionDetailTemplateContent();
  const tradition = getTraditionBySlug(slug);

  if (!tradition) notFound();

  return (
    <main className="page-shell section site-grid">
      <div>
        <div className="eyebrow">{template.eyebrow}</div>
        <h1 className="page-title">{tradition.name}</h1>
        <p className="lede">{tradition.shortDescription}</p>
      </div>
      <Prose markdown={template.placeholderMarkdown} />
    </main>
  );
}
