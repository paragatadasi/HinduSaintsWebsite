import { SaintCard } from "@/components/saints/saint-card";
import { getPublishedSaints } from "@/lib/sample-data";

export default function SaintsIndexPage() {
  const saints = getPublishedSaints();

  return (
    <main className="page-shell section site-grid">
      <div>
        <div className="eyebrow">Saints</div>
        <h1 className="page-title">Saints archive</h1>
        <p className="lede">Search and filters will connect to PostgreSQL once the CMS data model is migrated.</p>
      </div>
      <div className="card-grid">
        {saints.map((saint) => <SaintCard key={saint.slug} saint={saint} />)}
      </div>
    </main>
  );
}
