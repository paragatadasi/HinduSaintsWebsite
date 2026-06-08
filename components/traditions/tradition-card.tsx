import Link from "next/link";
import { Flame, Flower2, Waves } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { PublicTraditionSummary } from "@/lib/public-contracts";

type TraditionCardProps = {
  tradition: PublicTraditionSummary;
  variant?: "summary" | "icon";
};

export function TraditionCard({ tradition, variant = "summary" }: TraditionCardProps) {
  const Icon = tradition.slug.includes("bhakti") || tradition.slug.includes("gaudiya") || tradition.slug.includes("varkari")
    ? Flower2
    : tradition.slug.includes("advaita")
      ? Waves
      : Flame;

  if (variant === "icon") {
    return (
      <Card className="entity-card tradition-card tradition-card--icon">
        <Link href={`/traditions/${tradition.slug}`}>
          <span className="tradition-card__icon" aria-hidden="true">
            <Icon size={42} />
          </span>
          <h3 className="entity-card__title">{tradition.name}</h3>
          {tradition.founder ? <p className="eyebrow">Founder: {tradition.founder}</p> : null}
        </Link>
      </Card>
    );
  }

  return (
    <Card className="entity-card tradition-card tradition-card--summary">
      <Link href={`/traditions/${tradition.slug}`}>
        <h3 className="entity-card__title">{tradition.name}</h3>
        <p className="entity-card__body">{tradition.shortDescription}</p>
        {tradition.founder ? <p className="eyebrow">Founder: {tradition.founder}</p> : null}
      </Link>
    </Card>
  );
}
