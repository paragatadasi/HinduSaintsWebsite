import Link from "next/link";
import { getPublishedSaints } from "@/lib/sample-data";

export default function AdminSaintsPage() {
  return (
    <div className="site-grid">
      <div>
        <div className="eyebrow">Saint editor</div>
        <h1>Saints</h1>
      </div>
      {getPublishedSaints().map((saint) => (
        <Link key={saint.slug} href={`/admin/saints/${saint.slug}`} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "var(--space-4)" }}>
          <strong>{saint.displayName}</strong>
          <p>{saint.shortDescription}</p>
        </Link>
      ))}
    </div>
  );
}
