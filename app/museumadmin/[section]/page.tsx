import Link from "next/link";
import { notFound } from "next/navigation";
import { getMuseumData } from "@/lib/museum-data";
import { MuseumSectionWorkspace } from "./museum-section-workspace";

type MuseumAdminSectionPageProps = {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ view?: string }>;
};

export default async function MuseumAdminSectionPage({ params, searchParams }: MuseumAdminSectionPageProps) {
  const { section: slug } = await params;
  const originalView = (await searchParams).view === "original";
  const data = await getMuseumData();
  const workingSection = data.sectionBySlug.get(slug);
  if (!workingSection) notFound();
  const source = data.original.sections.find(s => s.name === workingSection.name);
  const section = originalView ? source : workingSection;
  return (
    <>
      <nav className="museum-breadcrumb" aria-label="Placement view">
        <Link aria-current={!originalView ? "page" : undefined} href={`/museumadmin/${slug}`}>Working arrangement</Link>
        {source ? <Link aria-current={originalView ? "page" : undefined} href={`/museumadmin/${slug}?view=original`}>Original proposal comparison</Link> : null}
      </nav>
      {section ? <MuseumSectionWorkspace
        key={originalView ? "original" : "working"}
        originalView={originalView}
        memberDetails={Object.fromEntries(originalView ? data.original.membersById : data.membersById)}
        section={section}
      /> : <p>This section has no original export proposal. Its current placements are in the working arrangement.</p>}
    </>
  );
}
