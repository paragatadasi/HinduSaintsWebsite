import { getDirectMuseumProposals } from "@/lib/museum-direct-proposals";
import { requireCapability } from "@/lib/admin-access";
import { notFound } from "next/navigation";
import { getMuseumProposalData } from "@/lib/museum-proposals";
import { MuseumSectionWorkspace } from "./museum-section-workspace";

type MuseumAdminSectionPageProps = {
  params: Promise<{ section: string }>;
};

export default async function MuseumAdminSectionPage({ params }: MuseumAdminSectionPageProps) {
  await requireCapability("access_museum");
  const { linkedSaintByRecordId } = await getDirectMuseumProposals();
  const { section: slug } = await params;
  const { sectionBySlug, membersById } = getMuseumProposalData();
  const section = sectionBySlug.get(slug);
  if (!section) notFound();
  for (const row of section.rows) row.saintId = linkedSaintByRecordId.get(row.id);

  return (
    <MuseumSectionWorkspace
      memberDetails={Object.fromEntries(membersById)}
      section={section}
    />
  );
}
