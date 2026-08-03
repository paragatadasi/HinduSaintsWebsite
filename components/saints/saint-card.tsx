import Link from "next/link";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { FocalImage } from "@/components/ui/focal-image";
import type { PublicImage, PublicSaintSummary } from "@/lib/public-contracts";

type SaintCardProps = {
  imageTag?: string;
  saint: PublicSaintSummary;
  variant?: "summary" | "portrait";
};

export function SaintCard({ imageTag, saint, variant = "summary" }: SaintCardProps) {
  const image: PublicImage = saint.image ?? {
    url: "/images/devotional-archive-placeholder.svg",
    alt: `${saint.displayName} portrait placeholder`
  };
  if (variant === "portrait") {
    return (
      <Card className="entity-card interactive-surface rail-card rail-card--featured saint-card saint-card--summary">
        <Link href={`/saints/${saint.slug}`}>
          <div className="saint-card__summary-image">
            <FocalImage
              src={image.url}
              alt={image.alt}
              width={image.width}
              height={image.height}
              focalPoint={image.focalPoint}
              variants={image.variants}
              sizes="(max-width: 720px) 84vw, 320px"
            />
            {imageTag ? <span className="saint-card__image-tag">{imageTag}</span> : null}
          </div>
          <div className="entity-card__content">
            <div className="eyebrow">{saint.eraLabel}</div>
            <h3 className="entity-card__title">{saint.displayName}</h3>
            <p className="entity-card__meta">
              <MapPin size={16} />
              {saint.primaryLocation}
            </p>
          </div>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="entity-card interactive-surface saint-card saint-card--summary">
      <Link href={`/saints/${saint.slug}`}>
        <div className="saint-card__summary-image">
          <FocalImage
            src={image.url}
            alt={image.alt}
            width={image.width}
            height={image.height}
            focalPoint={image.focalPoint}
            variants={image.variants}
            sizes="(max-width: 720px) 92vw, 360px"
          />
        </div>
        <div className="entity-card__content">
          <div className="eyebrow">{saint.eraLabel}</div>
          <h3 className="entity-card__title">{saint.displayName}</h3>
          <p className="entity-card__meta">
            <MapPin size={16} />
            {saint.primaryLocation}
          </p>
        </div>
      </Link>
    </Card>
  );
}
