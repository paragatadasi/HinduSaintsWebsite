import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Prose } from "@/components/content/prose";
import { getPublicAboutPageContent } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "About",
  description: "About the Hindu Saints Archive and its source-backed editorial workflow."
};

export default async function AboutPage() {
  const content = await getPublicAboutPageContent();

  if (!content) notFound();

  return (
    <main className="page-shell section site-grid">
      <div>
        <div className="eyebrow">{content.eyebrow}</div>
        <h1 className="page-title">{content.title}</h1>
        <Prose className="lede about-introduction" markdown={content.introduction} />
      </div>

      <div className="site-grid">
        {content.sections.map((section, index) => (
          <section key={`${section.title}-${index}`} className="card">
            <h2>{section.title}</h2>
            <Prose markdown={section.body} />
          </section>
        ))}
      </div>
    </main>
  );
}
