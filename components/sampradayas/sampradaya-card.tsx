import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { SampradayaSummary } from "@/lib/sample-data";

export function SampradayaCard({ sampradaya }: { sampradaya: SampradayaSummary }) {
  return (
    <Card className="entity-card">
      <Link href={`/sampradayas/${sampradaya.slug}`}>
        <h3 className="entity-card__title">{sampradaya.name}</h3>
        <p className="entity-card__body">{sampradaya.shortDescription}</p>
        {sampradaya.founder ? <p className="eyebrow">Founder: {sampradaya.founder}</p> : null}
      </Link>
    </Card>
  );
}
