import { Instagram } from "lucide-react";
import { getInstagramSectionContent } from "@/lib/site-content";

export function InstagramEmbedGrid({ urls }: { urls: string[] }) {
  if (urls.length === 0) return null;

  const content = getInstagramSectionContent();

  return (
    <section className="section">
      <div className="eyebrow">{content.eyebrow}</div>
      <h2>{content.title}</h2>
      <div className="card-grid">
        {urls.map((url) => (
          <a
            key={url}
            href={url}
            style={{
              alignItems: "center",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              display: "flex",
              gap: "var(--space-3)",
              minHeight: 92,
              padding: "var(--space-4)"
            }}
          >
            <Instagram size={22} />
            {content.linkLabel}
          </a>
        ))}
      </div>
    </section>
  );
}
