import { notFound } from "next/navigation";
import { requireDevelopmentExperience } from "@/lib/development-experiences";
import { getSaintBySlug } from "@/lib/sample-data";

export default async function SaintProfilePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireDevelopmentExperience("saint-profile-preview");
  const { id } = await params;
  const saint = getSaintBySlug(id);

  if (!saint) notFound();

  return (
    <main className="page-shell site-grid">
      <div className="eyebrow">Development preview</div>
      <h1>{saint.displayName}</h1>
      <p className="lede">{saint.shortDescription}</p>
    </main>
  );
}
