import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { SampradayaSummary } from "@/lib/sample-data";

export function SampradayaCard({ sampradaya }: { sampradaya: SampradayaSummary }) {
  return (
    <Card>
      <Link href={`/sampradayas/${sampradaya.slug}`}>
        <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.45rem", marginTop: 0 }}>{sampradaya.name}</h3>
        <p style={{ color: "var(--color-muted)" }}>{sampradaya.shortDescription}</p>
        {sampradaya.founder ? <p className="eyebrow">Founder: {sampradaya.founder}</p> : null}
      </Link>
    </Card>
  );
}
