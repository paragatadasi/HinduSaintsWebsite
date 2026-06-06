import Link from "next/link";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { SaintSummary } from "@/lib/sample-data";

export function SaintCard({ saint }: { saint: SaintSummary }) {
  return (
    <Card>
      <Link href={`/saints/${saint.slug}`}>
        <div className="eyebrow">{saint.eraLabel}</div>
        <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.55rem", margin: "var(--space-2) 0" }}>
          {saint.displayName}
        </h3>
        <p style={{ color: "var(--color-muted)" }}>{saint.shortDescription}</p>
        <p style={{ alignItems: "center", color: "var(--color-green)", display: "flex", gap: "var(--space-2)", marginTop: "var(--space-4)" }}>
          <MapPin size={16} />
          {saint.primaryLocation}
        </p>
      </Link>
    </Card>
  );
}
