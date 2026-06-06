import { notFound } from "next/navigation";
import { getSaintBySlug } from "@/lib/sample-data";

export default async function AdminSaintPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const saint = getSaintBySlug(id);

  if (!saint) notFound();

  return (
    <div className="site-grid">
      <div className="eyebrow">Noindex preview</div>
      <h1>{saint.displayName}</h1>
      <p className="lede">{saint.shortDescription}</p>
    </div>
  );
}
