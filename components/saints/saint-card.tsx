import Link from "next/link";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { PublicImage, PublicSaintSummary } from "@/lib/public-contracts";

const SUMMARY_READ_MORE_THRESHOLD = 170;

type SaintCardProps = {
  saint: PublicSaintSummary;
  variant?: "summary" | "portrait";
};

export function SaintCard({ saint, variant = "summary" }: SaintCardProps) {
  const image: PublicImage = saint.image ?? {
    url: "/images/devotional-archive-placeholder.svg",
    alt: `${saint.displayName} portrait placeholder`
  };

  if (variant === "portrait") {
    return (
      <Card className="entity-card interactive-surface saint-card saint-card--portrait">
        <Link href={`/saints/${saint.slug}`}>
          <div className={`saint-card__portrait saint-card__portrait--${saint.slug}`}>
            <img src={image.url} alt={image.alt} width={image.width} height={image.height} />
          </div>
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

  const showReadMore = saint.shortDescription.length > SUMMARY_READ_MORE_THRESHOLD;

  return (
    <Card className="entity-card interactive-surface saint-card saint-card--summary">
      <Link href={`/saints/${saint.slug}`}>
        <div className="saint-card__summary-image">
          <img src={image.url} alt={image.alt} width={image.width} height={image.height} />
        </div>
        <div className="entity-card__content">
          <div className="eyebrow">{saint.eraLabel}</div>
          <h3 className="entity-card__title">{saint.displayName}</h3>
          <p className="entity-card__body saint-card__summary-bio">{saint.shortDescription}</p>
          {showReadMore ? <span className="saint-card__read-more" aria-hidden="true">READ MORE</span> : null}
          <p className="entity-card__meta">
            <MapPin size={16} />
            {saint.primaryLocation}
          </p>
        </div>
      </Link>
    </Card>
  );
}
