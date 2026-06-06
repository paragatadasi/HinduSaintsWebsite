import { Instagram } from "lucide-react";

export function InstagramEmbedGrid({ urls }: { urls: string[] }) {
  if (urls.length === 0) return null;

  return (
    <section className="section">
      <div className="eyebrow">Instagram</div>
      <h2>Related posts and reels</h2>
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
            View on Instagram
          </a>
        ))}
      </div>
    </section>
  );
}
