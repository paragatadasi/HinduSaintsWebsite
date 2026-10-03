import Link from "next/link";
import type {Route,Metadata} from "next";
import {museumFlowZones} from "@/lib/museum-layout-groups";
import {getMuseumData} from "@/lib/museum-data";
import {MuseumWorkspace} from "@/components/admin/museum-workspace";
export const dynamic="force-dynamic";
export const metadata:Metadata={robots:{index:false,follow:false}};
export default function MuseumAdminLayout({children}:{children:React.ReactNode}) {
 return <MuseumWorkspace name="SPN Museum" subtitle="Shree Peetha Nilaya" homeHref="/museumadmin" loadNavigation={navigation}>{children}</MuseumWorkspace>;
}
async function navigation() {
  const { sections } = await getMuseumData();
  const sectionByName = new Map(sections.map((section) => [section.name, section]));
  const groupedSectionNames = new Set<string>(museumFlowZones.flatMap((zone) => [...zone.sections]));
  const ungroupedSections = sections.filter((section) => !groupedSectionNames.has(section.name));

  return <>
          <div className="museum-admin-nav__group-links">
            <Link href="/museumadmin/review">Placement review</Link>
            <Link href={"/museumadmin/locations" as Route}>Vitrines and shelves</Link>
            <Link href={"/museumadmin/collections" as Route}>Moves and relics</Link>
            <Link href="/admin">Main admin</Link>
            <Link href="/">Public site</Link>
          </div>
          <nav aria-label="Museum sections">
            {museumFlowZones.map((zone, index) => (
              <section className="museum-admin-nav__group" key={zone.title}>
                <div className="museum-admin-nav__group-heading">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{zone.title}</strong>
                    <small>{zone.eyebrow}</small>
                  </div>
                </div>
                <div className="museum-admin-nav__group-links">
                  {zone.sections.map((sectionName) => {
                    const section = sectionByName.get(sectionName);
                    if (!section) return null;
                    return (
                      <Link href={`/museumadmin/${section.slug}`} key={section.slug}>
                        <span>{section.name}</span>
                        <small>{section.total}</small>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}

            {ungroupedSections.length ? (
              <section className="museum-admin-nav__group museum-admin-nav__group--review">
                <div className="museum-admin-nav__group-heading">
                  <span>R</span>
                  <div>
                    <strong>Review queue</strong>
                    <small>Needs placement</small>
                  </div>
                </div>
                <div className="museum-admin-nav__group-links">
                  {ungroupedSections.map((section) => (
                    <Link href={`/museumadmin/${section.slug}`} key={section.slug}>
                      <span>{section.name}</span>
                      <small>{section.total}</small>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </nav>
  </>;
}
