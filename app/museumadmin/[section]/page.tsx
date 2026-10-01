import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCapability } from "@/lib/admin-access";
import { hasCapability } from "@/lib/permissions";
import { getMuseumData } from "@/lib/museum-data";
import { readMuseumSaintProfiles } from "@/lib/museum-saint-profiles";
import { MuseumSectionWorkspace } from "./museum-section-workspace";

type MuseumAdminSectionPageProps = {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ view?: string }>;
};

export default async function MuseumAdminSectionPage({ params, searchParams }: MuseumAdminSectionPageProps) {
  const user = await requireCapability("access_museum");
  const { section: slug } = await params;
  const originalView = (await searchParams).view === "original";
  const data = await getMuseumData();
  const workingSection = data.sectionBySlug.get(slug);
  if (!workingSection) notFound();
  const source = data.original.sections.find(s => s.name === workingSection.name);
  const section = originalView ? source : workingSection;
  const saintProfiles = await readMuseumSaintProfiles((section?.rows || []).flatMap(row => row.saintId ? [row.saintId] : []));
  return (
    <>
      <nav className="museum-breadcrumb" aria-label="Placement view">
        <Link aria-current={!originalView ? "page" : undefined} href={`/museumadmin/${slug}`}>Working arrangement</Link>
        {source ? <Link aria-current={originalView ? "page" : undefined} href={`/museumadmin/${slug}?view=original`}>Original proposal comparison</Link> : null}
      </nav>
      {section ? <MuseumSectionWorkspace
        key={originalView ? "original" : "working"}
        originalView={originalView}
        familyMoveOptions={data.familyMoveOptions}
        sectionNames={data.sections.map(s => s.name)}
        canManage={hasCapability(user.roles, "manage_museum")}
        memberDetails={Object.fromEntries(originalView ? data.original.membersById : data.membersById)}
        saintProfiles={saintProfiles}
        section={section}
      /> : <p>This section has no original export proposal. Its current placements are in the working arrangement.</p>}
    </>
  );
}
