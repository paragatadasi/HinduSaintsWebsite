import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, MapPin, Search, TreePine } from "lucide-react";
import type { MuseumFamilyGroup, MuseumSaintPlacement } from "@/lib/museum-proposals";
import { getMuseumProposalData, museumLocationLabel } from "@/lib/museum-proposals";

type MuseumAdminSectionPageProps = {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ group?: string | string[]; tertiary?: string | string[] }>;
};

export default async function MuseumAdminSectionPage({ params, searchParams }: MuseumAdminSectionPageProps) {
  const [{ section: slug }, { group, tertiary }] = await Promise.all([params, searchParams]);
  const groupMode = getSearchParam(group) === "location" ? "location" : "saint";
  const tertiaryQuery = getSearchParam(tertiary);
  const { sectionBySlug, membersById } = getMuseumProposalData();
  const section = sectionBySlug.get(slug);
  if (!section) notFound();

  const treeFamilies = [...section.primaryGroups, ...section.secondaryOnlyGroups, ...section.tertiaryGroups]
    .filter((family, index, families) => family.treeFile && families.findIndex((candidate) => candidate.key === family.key) === index)
    .sort((a, b) => b.rows.length - a.rows.length || a.label.localeCompare(b.label));
  const groupedPrimaryIds = new Set(section.primaryGroups.flatMap((family) => family.featured.map((row) => row.id)));
  const standalonePrimaries = section.rows
    .filter((row) => row.tier === "Featured" && !groupedPrimaryIds.has(row.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  const tertiaryRows = [...section.tertiaryGroups.flatMap((group) => group.tertiary), ...section.tertiaryUngrouped]
    .filter((row, index, rows) => rows.findIndex((candidate) => candidate.id === row.id) === index)
    .filter((row) => matchesTertiaryQuery(row, tertiaryQuery))
    .sort((a, b) => a.name.localeCompare(b.name));
  const tertiaryByLocation = groupTertiaryByLocation(tertiaryRows);

  const maxDistribution = Math.max(section.featured, section.secondary, section.tertiary, 1);

  return (
    <div className="museum-admin museum-admin--detail">
      <nav className="museum-breadcrumb" aria-label="Museum breadcrumb">
        <Link href="/museumadmin">Museum Admin</Link>
        <span>/</span>
        <span>{section.name}</span>
      </nav>

      <div className="museum-detail-layout">
        <div className="museum-detail-main">
          <section className="museum-admin-hero museum-admin-hero--detail">
            <div>
              <div className="eyebrow">Museum section</div>
              <h1>{section.name}</h1>
              <div className="museum-admin-hero__stats" aria-label="Section counts">
                <Metric label="Saints" value={section.total} />
                <Metric label="Primary" value={section.featured} />
                <Metric label="Secondary" value={section.secondary} />
                <Metric label="Tertiary" value={section.tertiary} />
              </div>
              <p>{section.idea}</p>
            </div>
          </section>

          <section className="museum-admin-panel museum-admin-panel--intent">
            <div className="museum-admin-kicker">Curatorial intent</div>
            <p>{section.idea}</p>
          </section>

          <section className="museum-admin-panel">
            <div className="museum-admin-section-heading">
              <div>
                <div className="museum-admin-kicker">Primary families & lineages</div>
                <h2>Anchor saints and affiliated secondary saints</h2>
              </div>
            </div>
            <div className="museum-family-grid">
              {section.primaryGroups.map((family) => (
                <FamilyCard family={family} key={family.key} membersById={membersById} />
              ))}
              {standalonePrimaries.map((row) => (
                <PrimarySaintCard key={row.id} row={row} />
              ))}
              {section.secondaryOnlyGroups.map((family) => (
                <SecondaryFamilyCard family={family} key={family.key} />
              ))}
            </div>
          </section>

          {treeFamilies.length ? (
            <section className="museum-admin-panel">
              <div className="museum-admin-section-heading">
                <div>
                  <div className="museum-admin-kicker">Family trees</div>
                  <h2>Relationship trees in this section</h2>
                </div>
              </div>
              <div className="museum-tree-grid">
                {treeFamilies.map((family) => (
                  <details className="museum-tree-panel" key={family.key}>
                    <summary>
                      <span>{family.label}</span>
                      <small>{family.rows.length} saints</small>
                    </summary>
                    <img alt={`${family.label} relationship tree`} src={`/museumadmin/family-tree/${family.treeFile}`} />
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          <section className="museum-admin-panel">
            <div className="museum-admin-section-heading">
              <div>
                <div className="museum-admin-kicker">Tertiary saints</div>
                <h2>{section.tertiary} supporting placements</h2>
              </div>
              <div className="museum-tertiary-controls">
                <Link
                  aria-current={groupMode === "saint" ? "page" : undefined}
                  className="museum-view-toggle"
                  href={tertiaryModeHref(section.slug, tertiaryQuery, "saint") as Route}
                >
                  By saint
                </Link>
                <Link
                  aria-current={groupMode === "location" ? "page" : undefined}
                  className="museum-view-toggle"
                  href={tertiaryModeHref(section.slug, tertiaryQuery, "location") as Route}
                >
                  By location
                </Link>
              </div>
              <form action={`/museumadmin/${section.slug}`} className="museum-tertiary-search" role="search">
                <label className="sr-only" htmlFor="tertiary-search">Search tertiary saints</label>
                <Search aria-hidden="true" size={16} />
                {groupMode === "location" ? <input name="group" type="hidden" value="location" /> : null}
                <input
                  defaultValue={tertiaryQuery}
                  id="tertiary-search"
                  name="tertiary"
                  placeholder="Search tertiary saints"
                  type="search"
                />
              </form>
            </div>

            {tertiaryQuery ? <p className="museum-filter-note">{tertiaryRows.length} tertiary saints match "{tertiaryQuery}".</p> : null}

            {groupMode === "location" ? (
              <div className="museum-location-groups">
                {tertiaryByLocation.map((location) => (
                  <section className="museum-location-group" key={location.label}>
                    <h3>{location.label}</h3>
                    <div className="museum-tertiary-grid">
                      {location.rows.map((row) => (
                        <TertiaryCard key={row.id} row={row} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="museum-tertiary-grid">
                {tertiaryRows.map((row) => (
                  <TertiaryCard key={row.id} row={row} />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="museum-detail-sidebar">
          <section className="museum-admin-panel museum-admin-panel--sidebar">
            <div className="museum-admin-kicker">Section health</div>
            <ul className="museum-health-list">
              {section.health.map((item) => (
                <li key={item.label}>
                  {item.tone === "good" ? <CheckCircle2 aria-hidden="true" size={17} /> : <AlertTriangle aria-hidden="true" size={17} />}
                  <span>{item.count} {item.label}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="museum-admin-panel museum-admin-panel--sidebar">
            <div className="museum-admin-kicker">Saint distribution</div>
            <DistributionRow label="Primary" max={maxDistribution} value={section.featured} />
            <DistributionRow label="Secondary" max={maxDistribution} value={section.secondary} />
            <DistributionRow label="Tertiary" max={maxDistribution} value={section.tertiary} />
            <div className="museum-sidebar-total">
              <span>Total</span>
              <strong>{section.total}</strong>
            </div>
          </section>

          <section className="museum-admin-panel museum-admin-panel--sidebar">
            <div className="museum-admin-kicker">Geographic coverage</div>
            <ul className="museum-geography-list">
              {section.geography.map((item) => (
                <li key={item.label}>
                  <MapPin aria-hidden="true" size={15} />
                  <span>{item.label}</span>
                  <strong>{item.count}</strong>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

function FamilyCard({ family, membersById }: { family: MuseumFamilyGroup; membersById: Map<string, Record<string, string>> }) {
  const orderedPrimaries = [...family.featured].sort((a, b) => primaryRank(a, membersById) - primaryRank(b, membersById) || a.name.localeCompare(b.name));
  const [head, ...otherPrimaries] = orderedPrimaries;
  const isPeerGroup = family.key.startsWith("CUR-") && orderedPrimaries.length > 1;

  return (
    <article className="museum-family-card">
      <div className="museum-family-card__header">
        <div>
          <h3>{isPeerGroup ? family.label : head?.name || family.label}</h3>
          <p>{family.rows.length} saint{family.rows.length === 1 ? "" : "s"}</p>
        </div>
        <TreePine aria-hidden="true" size={19} />
      </div>
      <ul>
        {isPeerGroup ? orderedPrimaries.map((row) => (
          <li className="museum-family-card__primary" key={row.id}>{row.name}</li>
        )) : otherPrimaries.map((row) => (
          <li className="museum-family-card__primary" key={row.id}>{row.name}</li>
        ))}
        {family.secondary.map((row) => <li key={row.id}>{row.name}</li>)}
      </ul>
    </article>
  );
}

function PrimarySaintCard({ row }: { row: MuseumSaintPlacement }) {
  return (
    <article className="museum-family-card museum-family-card--standalone-primary">
      <div className="museum-family-card__header">
        <div>
          <h3>{row.name}</h3>
          <p>Primary saint</p>
        </div>
        <TreePine aria-hidden="true" size={19} />
      </div>
    </article>
  );
}

function SecondaryFamilyCard({ family }: { family: MuseumFamilyGroup }) {
  return (
    <article className="museum-family-card museum-family-card--secondary">
      <div className="museum-family-card__header">
        <div>
          <h3>{family.label}</h3>
          <p>{family.secondary.length} secondary saints</p>
        </div>
      </div>
      <ul>
        {family.secondary.map((row) => <li key={row.id}>{row.name}</li>)}
      </ul>
    </article>
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

function DistributionRow({ label, max, value }: { label: string; max: number; value: number }) {
  return (
    <div className="museum-distribution-row">
      <span>{label}</span>
      <meter aria-label={`${label}: ${value}`} max={max} min={0} value={value} />
      <strong>{value}</strong>
    </div>
  );
}

function TertiaryCard({ row }: { row: MuseumSaintPlacement }) {
  return (
    <article className="museum-tertiary-card">
      <strong>{row.name}</strong>
      <span>{row.normalizedPlaces[0] ? museumLocationLabel(row.normalizedPlaces[0]) : row.spiritualRegions[0] || "Place pending"}</span>
    </article>
  );
}

function getSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return value?.trim() ?? "";
}

function tertiaryModeHref(sectionSlug: string, tertiaryQuery: string, mode: "location" | "saint") {
  const params = new URLSearchParams();
  if (tertiaryQuery) params.set("tertiary", tertiaryQuery);
  if (mode === "location") params.set("group", "location");
  const query = params.toString();
  return `/museumadmin/${sectionSlug}${query ? `?${query}` : ""}`;
}

function groupTertiaryByLocation(rows: MuseumSaintPlacement[]) {
  const groups = new Map<string, MuseumSaintPlacement[]>();
  for (const row of rows) {
    const label = locationGroupLabel(row);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)?.push(row);
  }
  return [...groups.entries()]
    .map(([label, groupRows]) => ({ label, rows: groupRows.sort((a, b) => a.name.localeCompare(b.name)) }))
    .sort((a, b) => b.rows.length - a.rows.length || a.label.localeCompare(b.label));
}

function locationGroupLabel(row: MuseumSaintPlacement) {
  const place = row.normalizedPlaces[0];
  if (!place) return row.spiritualRegions[0] || "Location pending";
  return museumLocationLabel(place);
}

function matchesTertiaryQuery(row: MuseumSaintPlacement, query: string) {
  if (!query) return true;
  const q = query.toLowerCase();
  return row.name.toLowerCase().includes(q) ||
    row.normalizedPlaces.some((place) => place.toLowerCase().includes(q)) ||
    row.spiritualRegions.some((region) => region.toLowerCase().includes(q));
}

function primaryRank(row: MuseumSaintPlacement, membersById: Map<string, Record<string, string>>) {
  const member = membersById.get(row.id);
  if (!member) return 999999;
  const hasMaster = Boolean(member.Masters?.trim());
  const discipleCount = String(member.Disciples || "").split(";").filter(Boolean).length;
  const year = Number.parseInt(String(member.BirthYear || "9999"), 10) || 9999;
  return (hasMaster ? 100000 : 0) - discipleCount * 100 + year;
}
