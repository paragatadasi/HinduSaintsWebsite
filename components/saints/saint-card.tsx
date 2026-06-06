import Link from "next/link";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { SaintSummary } from "@/lib/sample-data";

export function SaintCard({ saint }: { saint: SaintSummary }) {
  return (
    <Card className="entity-card">
      <Link href={`/saints/${saint.slug}`}>
        <div className="eyebrow">{saint.eraLabel}</div>
        <h3 className="entity-card__title">{saint.displayName}</h3>
        <p className="entity-card__body">{saint.shortDescription}</p>
        <p className="entity-card__meta">
          <MapPin size={16} />
          {saint.primaryLocation}
        </p>
      </Link>
    </Card>
  );
}
