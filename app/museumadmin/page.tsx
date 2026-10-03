import Link from "next/link";
import { Search } from "lucide-react";
import { MuseumProposalOverview } from "@/components/admin/museum-proposal-overview";
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

  return (
    <div className="museum-admin museum-admin--index">
      {arrangementSaved?<p role="status">Arrangement updated. Individual relic records remain available for precise location updates.</p>:null}
      {membershipSaved?<p role="status">Display membership updated. Relic locations and historical relationships are unchanged.</p>:null}
      {correctionRequested?<p role="status">Relationship correction requested for editorial review.</p>:null}
      <MuseumProposalOverview museumName="SPN Museum" sections={sections} basePath="/museumadmin">
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

      </MuseumProposalOverview>

    </div>
  );
}

function getSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return value?.trim() ?? "";
}
