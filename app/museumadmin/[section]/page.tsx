import { notFound } from "next/navigation";
import { getMuseumData } from "@/lib/museum-data";
import { MuseumSectionWorkspace } from "./museum-section-workspace";

type MuseumAdminSectionPageProps = {
  params: Promise<{ section: string }>;
};

export default async function MuseumAdminSectionPage({ params }: MuseumAdminSectionPageProps) {
  const { section: slug } = await params;
  const { sectionBySlug, membersById } = await getMuseumData();
  const section = sectionBySlug.get(slug);
  if (!section) notFound();

  return (
    <MuseumSectionWorkspace
      memberDetails={Object.fromEntries(membersById)}
      section={section}
    />
  );
}
