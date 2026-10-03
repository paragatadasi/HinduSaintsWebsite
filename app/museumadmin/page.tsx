import Link from "next/link";
import type { Route } from "next";
import { GitBranch, Map, Search } from "lucide-react";
import { museumBridgeCards, museumFlowZones } from "@/lib/museum-layout-groups";
import { museumSectionSlug } from "@/lib/museum-proposals";
import { getMuseumData } from "@/lib/museum-data";
import { searchWorkingMuseumPlacements } from "@/lib/museum-working-view";

import { requireCapability } from "@/lib/admin-access";
import { hasCapability } from "@/lib/permissions";
import { readMuseumSaintProfiles } from "@/lib/museum-saint-profiles";
import { MuseumSearchResults } from "@/components/admin/museum-search-results";

type MuseumAdminPageProps = {
  searchParams: Promise<{ q?: string | string[];membershipSaved?:string;correctionRequested?:string;arrangementSaved?:string }>;
};

export default async function MuseumAdminPage({ searchParams }: MuseumAdminPageProps) {
  const user = await requireCapability("access_museum");
  const { q,membershipSaved,correctionRequested,arrangementSaved } = await searchParams;
  const query = getSearchParam(q);
  const { sections, placements, membersById, familyMoveOptions } = await getMuseumData();
  const matches = query ? searchWorkingMuseumPlacements(placements, query, 30) : [];
  const profiles = await readMuseumSaintProfiles(matches.flatMap(row => row.saintId ? [row.saintId] : []));
  const totals = sections.reduce(
    (acc, section) => ({
      saints: acc.saints + section.total,
      featured: acc.featured + section.featured,
      secondary: acc.secondary + section.secondary,
      tertiary: acc.tertiary + section.tertiary
    }),
    { saints: 0, featured: 0, secondary: 0, tertiary: 0 }
  );

  return (
    <div className="museum-admin museum-admin--index">
      {arrangementSaved?<p role="status">Arrangement updated. Individual relic records remain available for precise location updates.</p>:null}
      {membershipSaved?<p role="status">Display membership updated. Relic locations and historical relationships are unchanged.</p>:null}
      {correctionRequested?<p role="status">Relationship correction requested for editorial review.</p>:null}
      <section className="museum-admin-hero museum-admin-hero--index">
        <div>
          <div className="eyebrow">SPN Museum</div>
          <h1>Section proposals</h1>
          <p>
            Browse saint proposals, plan destination vitrines, and record completed arrangements. Open a saint to make changes.
          </p>
        </div>
        <div className="museum-admin-hero__stats" aria-label="Museum proposal totals">
          <Metric label="Saints" value={totals.saints} />
          <Metric label="Sections" value={sections.length} />
          <Metric label="Primary" value={totals.featured} />
          <Metric label="Secondary" value={totals.secondary} />
          <Metric label="Tertiary" value={totals.tertiary} />
        </div>
      </section>

      <p><Link className="museum-admin-button" href="/museumadmin/review">Resolve source links</Link></p>
      <section className="museum-admin-panel">
        <div className="museum-admin-section-heading">
          <div>
            <div className="museum-admin-kicker">Find a saint</div>
            <h2>Search section assignment</h2>
          </div>
        </div>
        <form action="/museumadmin" className="museum-admin-search" role="search">
          <label className="sr-only" htmlFor="museum-search">Search by saint name</label>
          <Search aria-hidden="true" size={18} />
          <input
            defaultValue={query}
            id="museum-search"
            name="q"
            placeholder="Search a saint, deity, family member, place, or section"
            type="search"
          />
          <button className="museum-admin-button" type="submit">Search</button>
          {query ? <Link className="museum-admin-button museum-admin-button--secondary" href="/museumadmin">Clear</Link> : null}
        </form>

        {query ? <MuseumSearchResults canEditRelationships={hasCapability(user.roles,"edit_structured_content")} key={query} matches={matches} profiles={profiles} members={Object.fromEntries(matches.map(row => [row.id, membersById.get(row.id) || {}]))} sections={sections.map(s => ({name:s.name, slug:s.slug}))} familyMoveOptions={familyMoveOptions} canManage={hasCapability(user.roles, "manage_museum")} /> : null}
      </section>

      <section className="museum-admin-panel museum-flow-panel" aria-labelledby="museum-flow-title">
        <div className="museum-admin-section-heading">
          <div>
            <div className="museum-admin-kicker">Visitor circuit</div>
            <h2 id="museum-flow-title">Proposed museum flow and bridges</h2>
          </div>
          <Map aria-hidden="true" size={22} />
        </div>

        <ol className="museum-flow-zones" aria-label="Proposed visitor flow">
          {museumFlowZones.map((zone, index) => (
            <li className="museum-flow-zone" key={zone.title}>
              <div className="museum-flow-zone__index">{String(index + 1).padStart(2, "0")}</div>
              <div className="museum-flow-zone__content">
                <h3>{zone.title}</h3>
                <p>{zone.summary}</p>
                <div className="museum-flow-zone__sections">
                  {zone.sections.map((section) => (
                    <Link href={`/museumadmin/${museumSectionSlug(section)}` as Route} key={section}>
                      {section}
                    </Link>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="museum-bridge-map" aria-label="Bridge traditions that connect the visitor circuit">
          {museumBridgeCards.map((bridge) => (
            <article className="museum-bridge-card" key={bridge.title}>
              <div className="museum-bridge-card__icon">
                <GitBranch aria-hidden="true" size={17} />
              </div>
              <div>
                <h3>{bridge.title}</h3>
                <p>{bridge.summary}</p>
                <small>{bridge.evidence}</small>
              </div>
            </article>
          ))}
        </div>
      </section>

    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function getSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return value?.trim() ?? "";
}
