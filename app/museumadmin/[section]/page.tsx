import { notFound } from "next/navigation";
import { getMuseumProposalData } from "@/lib/museum-proposals";
import { MuseumSectionWorkspace } from "./museum-section-workspace";

type MuseumAdminSectionPageProps = {
  params: Promise<{ section: string }>;
};

export default async function MuseumAdminSectionPage({ params }: MuseumAdminSectionPageProps) {
  const { section: slug } = await params;
  const { sections, sectionBySlug, membersById } = getMuseumProposalData();
  const section = sectionBySlug.get(slug);
  if (!section) notFound();

  return (
    <MuseumSectionWorkspace
      memberDetails={Object.fromEntries(membersById)}
      section={section}
      sectionNames={sections.map((museumSection) => museumSection.name)}
    />
  );
}
