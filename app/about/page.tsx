import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Prose } from "@/components/content/prose";
import { getAboutPageContent } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "About",
  description: "About the Hindu Saints Archive and its source-backed editorial workflow."
};

export default function AboutPage() {
  const content = getAboutPageContent();

  if (!content) notFound();

  return (
    <main className="page-shell section site-grid">
      <div>
        <div className="eyebrow">{content.eyebrow}</div>
        <h1 className="page-title">{content.title}</h1>
        <p className="lede">{content.introduction}</p>
      </div>

      <div className="site-grid">
        {content.sections.map((section) => (
          <section key={section.title} className="card">
            <h2>{section.title}</h2>
            <Prose markdown={section.body} />
          </section>
        ))}
      </div>
    </main>
  );
}
