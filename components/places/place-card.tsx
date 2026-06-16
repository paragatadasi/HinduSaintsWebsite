import Link from "next/link";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { PublicPlaceSummary } from "@/lib/public-contracts";

type PlaceCardProps = {
  place: PublicPlaceSummary;
};

export function PlaceCard({ place }: PlaceCardProps) {
  return (
    <Card className="entity-card interactive-surface place-card">
      <Link href={`/places/${place.slug}`}>
        <span className="place-card__icon" aria-hidden="true">
          <MapPin size={34} />
        </span>
        <h3 className="entity-card__title">{place.name}</h3>
        <p className="entity-card__body">{place.shortDescription}</p>
        <p className="eyebrow">{place.saintCount} {place.saintCount === 1 ? "saint" : "saints"}</p>
      </Link>
    </Card>
  );
}
