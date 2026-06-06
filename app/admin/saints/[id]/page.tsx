import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSaintBySlug } from "@/lib/sample-data";

export default async function AdminSaintEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const saint = getSaintBySlug(id);

  if (!saint) notFound();

  return (
    <div className="site-grid">
      <div>
        <div className="eyebrow">Editing saint</div>
        <h1>{saint.displayName}</h1>
        <p className="lede">Tabs for basic info, aliases, images, relationships, Instagram, biography, sources, SEO, publishing, and preview will be implemented here.</p>
      </div>
      <Button href={`/admin/preview/saint/${saint.slug}`}>Preview saint</Button>
    </div>
  );
}
