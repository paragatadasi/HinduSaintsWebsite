import { Prose } from "@/components/content/prose";
import { BiographyTableOfContents } from "@/components/saints/biography-table-of-contents";
import { extractMarkdownHeadings, SANITIZED_MARKDOWN_ID_PREFIX } from "@/lib/markdown";
import type { PublicBiographySection, PublicSourceSummary } from "@/lib/public-contracts";

const HEADING_ID_PREFIX = "biography-section-";

export function SaintBiography({ biography, eyebrow, sources }: {
  biography: PublicBiographySection;
  eyebrow: string;
  sources: PublicSourceSummary[];
}) {
  const headings = extractMarkdownHeadings(biography.bodyMarkdown);
  const tableOfContents = [
    { id: "biography-start", label: biography.title },
    ...headings.map((heading) => ({ id: `${SANITIZED_MARKDOWN_ID_PREFIX}${HEADING_ID_PREFIX}${heading.id}`, label: heading.label }))
  ];
  const sourceReferences = sources.flatMap((source) => source.id ? [{ key: source.id, title: source.title }] : []);

  return (
    <section className="saint-profile-biography" id="biography">
      <div className="saint-profile-biography__layout page-shell">
        <aside className="saint-profile-biography__aside">
          <BiographyTableOfContents items={tableOfContents} />
        </aside>
        <article className="saint-biography-reading" id="biography-start">
          <header className="saint-biography-reading__header">
            <div className="eyebrow">{eyebrow}</div>
            <h2>{biography.title}</h2>
            {biography.summary ? <p className="lede">{biography.summary}</p> : null}
          </header>
          <Prose
            className="saint-biography-reading__prose"
            headingIdPrefix={HEADING_ID_PREFIX}
            markdown={biography.bodyMarkdown}
            sourceReferences={sourceReferences}
          />
        </article>
      </div>
    </section>
  );
}
