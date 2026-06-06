import { SampradayaCard } from "@/components/sampradayas/sampradaya-card";
import { getPublishedSampradayas } from "@/lib/sample-data";

export default function SampradayasIndexPage() {
  return (
    <main className="page-shell section site-grid">
      <div>
        <div className="eyebrow">Traditions</div>
        <h1 className="page-title">Sampradayas</h1>
        <p className="lede">Introductory tradition pages will connect saints, sources, and lineage context.</p>
      </div>
      <div className="card-grid">
        {getPublishedSampradayas().map((sampradaya) => <SampradayaCard key={sampradaya.slug} sampradaya={sampradaya} />)}
      </div>
    </main>
  );
}
