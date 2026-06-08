import Link from "next/link";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { PublicSaintSummary } from "@/lib/public-contracts";

type SaintCardProps = {
  saint: PublicSaintSummary;
  variant?: "summary" | "portrait";
};

export function SaintCard({ saint, variant = "summary" }: SaintCardProps) {
  if (variant === "portrait") {
    return (
      <Card className="entity-card saint-card saint-card--portrait">
        <Link href={`/saints/${saint.slug}`}>
          <div className={`saint-card__portrait saint-card__portrait--${saint.slug}`} aria-hidden="true" />
          <div className="entity-card__content">
            <h3 className="entity-card__title">{saint.displayName}</h3>
            <p className="entity-card__body">{saint.tradition}</p>
            <p className="entity-card__meta">
              <MapPin size={15} />
              {saint.eraLabel}
            </p>
          </div>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="entity-card saint-card saint-card--summary">
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
