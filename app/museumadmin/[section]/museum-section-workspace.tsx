"use client";

import Link from "next/link";
import type { Route } from "next";
import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, MapPin, Search, TreePine } from "lucide-react";
import type { MuseumFamilyGroup, MuseumSaintPlacement, MuseumSection } from "@/lib/museum-proposals";

type MemberDetails = Record<string, Record<string, string>>;

type MuseumSectionWorkspaceProps = {
  section: MuseumSection;
  memberDetails: MemberDetails;
};

export function MuseumSectionWorkspace({ section, memberDetails }: MuseumSectionWorkspaceProps) {
  const [groupMode, setGroupMode] = useState<"saint" | "location">("saint");
  const [tertiaryQuery, setTertiaryQuery] = useState("");
  const [researchOnly, setResearchOnly] = useState(false);
  const groupedPrimaryIds = useMemo(
    () => new Set(section.primaryGroups.flatMap((family) => family.featured.map((row) => row.id))),
    [section.primaryGroups]
  );
  const tierFor = (row: MuseumSaintPlacement) => row.tier;

  const standalonePrimaries = section.rows
    .filter((row) => tierFor(row) === "Featured" && !groupedPrimaryIds.has(row.id))
    .sort(sortSaints);
  const tertiaryRows = section.rows
    .filter((row) => tierFor(row) === "Tertiary")
    .filter((row) => matchesTertiaryQuery(row, tertiaryQuery))
    .filter((row) => !researchOnly || row.needsResearch)
    .sort(sortSaints);
  const tertiaryByLocation = groupTertiaryByLocation(tertiaryRows);
  const treeFamilies = [...section.primaryGroups, ...section.secondaryOnlyGroups, ...section.tertiaryGroups]
    .filter(
      (family, index, families) =>
        family.treeFile && families.findIndex((candidate) => candidate.key === family.key) === index
    )
    .sort((a, b) => b.rows.length - a.rows.length || a.label.localeCompare(b.label));
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
              <p className="museum-filter-note">
                Open a saint to review sources and save museum placement. Review signals include imported
                placements awaiting acceptance.
              </p>
            </div>
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
                <FamilyCard
                  family={family}
                  key={family.key}
                  memberDetails={memberDetails}
                  rows={section.rows}
                />
              ))}
              {standalonePrimaries.map((row) => (
                <PrimarySaintCard key={row.id} row={row} rows={section.rows} />
              ))}
              {section.secondaryOnlyGroups.map((family) => (
                <SecondaryFamilyCard family={family} key={family.key} rows={section.rows} />
              ))}
              <SecondaryStandaloneCard rows={section.secondaryUngrouped} />
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
                    <img
                      alt={`${family.label} relationship tree`}
                      src={`/museumadmin/family-tree/${family.treeFile}`}
                    />
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          <section className="museum-admin-panel">
            <div className="museum-admin-section-heading">
              <div>
                <div className="museum-admin-kicker">Tertiary saints</div>
                <h2>{tertiaryRows.length} supporting placements</h2>
              </div>
              <div className="museum-tertiary-controls">
                <button
                  aria-pressed={groupMode === "saint"}
                  className="museum-view-toggle"
                  onClick={() => setGroupMode("saint")}
                  type="button"
                >
                  By saint
                </button>
                <button
                  aria-pressed={groupMode === "location"}
                  className="museum-view-toggle"
                  onClick={() => setGroupMode("location")}
                  type="button"
                >
                  By location
                </button>
                <label className="museum-check-toggle">
                  <input
                    checked={researchOnly}
                    onChange={(event) => setResearchOnly(event.target.checked)}
                    type="checkbox"
                  />
                  Needs research
                </label>
              </div>
              <div className="museum-tertiary-search" role="search">
                <label className="sr-only" htmlFor="tertiary-search">
                  Search tertiary saints
                </label>
                <Search aria-hidden="true" size={16} />
                <input
                  id="tertiary-search"
                  onChange={(event) => setTertiaryQuery(event.target.value)}
                  placeholder="Search tertiary saints"
                  type="search"
                  value={tertiaryQuery}
                />
              </div>
            </div>

            {tertiaryQuery || researchOnly ? (
              <p className="museum-filter-note">
                {tertiaryRows.length} tertiary saints match the current filters.
              </p>
            ) : null}

            {groupMode === "location" ? (
              <div className="museum-location-groups">
                {tertiaryByLocation.map((location) => (
                  <section className="museum-location-group" key={location.label}>
                    <h3>{location.label}</h3>
                    <div className="museum-location-place-groups">
                      {location.places.map((place) => (
                        <div className="museum-location-place-group" key={place.label}>
                          <h4>{place.label}</h4>
                          <div className="museum-tertiary-grid">
                            {place.rows.map((row) => (
                              <TertiaryCard key={row.id} locationMode="specific" row={row} />
                            ))}
                          </div>
                        </div>
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
                  {item.tone === "good" ? (
                    <CheckCircle2 aria-hidden="true" size={17} />
                  ) : (
                    <AlertTriangle aria-hidden="true" size={17} />
                  )}
                  <span>
                    {item.count} {item.label}
                  </span>
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

function FamilyCard({
  family,
  memberDetails,
  rows
}: {
  family: MuseumFamilyGroup;
  memberDetails: MemberDetails;
  rows: MuseumSaintPlacement[];
}) {
  const cardRows = family.rows;
  const featured = cardRows
    .filter((row) => row.tier === "Featured")
    .sort(
      (a, b) => primaryRank(a, memberDetails) - primaryRank(b, memberDetails) || a.name.localeCompare(b.name)
    );
  const affiliated = cardRows.filter((row) => row.tier !== "Featured").sort(sortSaints);
  const [head, ...otherPrimaries] = featured;
  const isPeerGroup = family.key.startsWith("CUR-") && featured.length > 1;

  return (
    <article className="museum-family-card">
      <div className="museum-family-card__header">
        <div>
          <h3>{isPeerGroup ? family.label : head ? <SaintButton row={head} /> : family.label}</h3>
          <p>
            {cardRows.length} saint{cardRows.length === 1 ? "" : "s"}
          </p>
        </div>
        <TreePine aria-hidden="true" size={19} />
      </div>
      <ul>
        {isPeerGroup
          ? featured.map((row) => (
              <li className="museum-family-card__primary" key={row.id}>
                <SaintButton row={row} />
              </li>
            ))
          : otherPrimaries.map((row) => (
              <li className="museum-family-card__primary" key={row.id}>
                <SaintButton row={row} />
              </li>
            ))}
        {affiliated.map((row) => (
          <li key={row.id}>
            <SaintButton row={row} />
          </li>
        ))}
      </ul>
    </article>
  );
}

function PrimarySaintCard({ row, rows }: { row: MuseumSaintPlacement; rows: MuseumSaintPlacement[] }) {
  return (
    <article className="museum-family-card museum-family-card--standalone-primary">
      <div className="museum-family-card__header">
        <div>
          <h3>
            <SaintButton row={row} />
          </h3>
          <p>Primary saint</p>
        </div>
        <TreePine aria-hidden="true" size={19} />
      </div>
    </article>
  );
}

function SecondaryFamilyCard({ family, rows }: { family: MuseumFamilyGroup; rows: MuseumSaintPlacement[] }) {
  const cardRows = family.rows.filter((row) => row.tier !== "Featured").sort(sortSaints);
  if (!cardRows.length) return null;

  return (
    <article className="museum-family-card museum-family-card--secondary">
      <div className="museum-family-card__header">
        <div>
          <h3>{family.label}</h3>
          <p>
            {cardRows.length} affiliated saint{cardRows.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>
      <ul>
        {cardRows.map((row) => (
          <li key={row.id}>
            <SaintButton row={row} />
          </li>
        ))}
      </ul>
    </article>
  );
}

function SecondaryStandaloneCard({ rows }: { rows: MuseumSaintPlacement[] }) {
  const cardRows = rows.filter((row) => row.tier === "Secondary").sort(sortSaints);
  if (!cardRows.length) return null;

  return (
    <article className="museum-family-card museum-family-card--secondary">
      <div className="museum-family-card__header">
        <div>
          <h3>Other affiliated saints</h3>
          <p>
            {cardRows.length} affiliated saint{cardRows.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>
      <ul>
        {cardRows.map((row) => (
          <li key={row.id}>
            <SaintButton row={row} />
          </li>
        ))}
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

function TertiaryCard({
  locationMode = "summary",
  row
}: {
  locationMode?: "summary" | "specific";
  row: MuseumSaintPlacement;
}) {
  const placeLabel =
    locationMode === "specific"
      ? specificLocationLabel(row)
      : row.normalizedPlaces[0]
        ? museumLocationLabel(row.normalizedPlaces[0])
        : row.spiritualRegions[0] || "Place pending";

  return (
    <article className="museum-tertiary-card">
      <strong>
        <SaintButton row={row} />
      </strong>
      <span>{placeLabel}</span>
      {row.needsResearch ? <small>Needs research</small> : null}
    </article>
  );
}

function SaintButton({ row }: { row: MuseumSaintPlacement }) {
  return (
    <Link className="museum-saint-link" href={`/museumadmin/saints/${row.id}` as Route}>
      {row.name}
    </Link>
  );
}

function groupTertiaryByLocation(rows: MuseumSaintPlacement[]) {
  const groups = new Map<string, Map<string, MuseumSaintPlacement[]>>();
  for (const row of rows) {
    const stateLabel = locationStateGroupLabel(row);
    const placeLabel = locationPlaceGroupLabel(row);
    if (!groups.has(stateLabel)) groups.set(stateLabel, new Map());
    const placeGroups = groups.get(stateLabel);
    if (!placeGroups?.has(placeLabel)) placeGroups?.set(placeLabel, []);
    placeGroups?.get(placeLabel)?.push(row);
  }
  return [...groups.entries()]
    .map(([label, placeGroups]) => {
      const places = [...placeGroups.entries()]
        .map(([placeLabel, placeRows]) => ({ label: placeLabel, rows: placeRows.sort(sortSaints) }))
        .sort((a, b) => b.rows.length - a.rows.length || a.label.localeCompare(b.label));
      return {
        label,
        places,
        count: places.reduce((total, place) => total + place.rows.length, 0)
      };
    })
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function locationStateGroupLabel(row: MuseumSaintPlacement) {
  const place = row.normalizedPlaces[0];
  if (!place) return row.spiritualRegions[0] || "Location pending";
  return statePlaceGroupLabel(place);
}

function locationPlaceGroupLabel(row: MuseumSaintPlacement) {
  const place = row.normalizedPlaces[0];
  if (!place) return row.spiritualRegions[0] || "Location pending";
  return specificPlaceGroupLabel(place);
}

function specificLocationLabel(row: MuseumSaintPlacement) {
  if (row.normalizedPlaces.length) return row.normalizedPlaces.join("; ");
  return row.spiritualRegions.join("; ") || "Place pending";
}

function specificPlaceGroupLabel(value: string) {
  const parts = String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (!parts[0]) return "Location pending";
  if (parts.length === 1 && indianStateNames.has(parts[0].toLowerCase())) return `${parts[0]}, India`;
  return parts.join(", ");
}

function statePlaceGroupLabel(value: string) {
  const parts = String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (!parts[0]) return "Location pending";
  if (parts.length >= 2) return parts.slice(-2).join(", ");
  if (indianStateNames.has(parts[0].toLowerCase())) return `${parts[0]}, India`;
  return parts[0];
}

const indianStateNames = new Set([
  "andhra pradesh",
  "arunachal pradesh",
  "assam",
  "bihar",
  "chhattisgarh",
  "delhi",
  "goa",
  "gujarat",
  "haryana",
  "himachal pradesh",
  "jammu and kashmir",
  "jharkhand",
  "karnataka",
  "kerala",
  "madhya pradesh",
  "maharashtra",
  "manipur",
  "meghalaya",
  "mizoram",
  "nagaland",
  "odisha",
  "orissa",
  "punjab",
  "rajasthan",
  "sikkim",
  "tamil nadu",
  "telangana",
  "tripura",
  "uttar pradesh",
  "uttarakhand",
  "uttharkand",
  "west bengal"
]);

function museumLocationLabel(value: string | undefined, fallback = "Location pending") {
  const parts = String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 2) return parts.slice(-2).join(", ");
  if (!parts[0]) return fallback;
  if (indianStateNames.has(parts[0].toLowerCase())) return `${parts[0]}, India`;
  return parts[0];
}

function matchesTertiaryQuery(row: MuseumSaintPlacement, query: string) {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    row.name.toLowerCase().includes(q) ||
    row.normalizedPlaces.some((place) => place.toLowerCase().includes(q)) ||
    row.spiritualRegions.some((region) => region.toLowerCase().includes(q))
  );
}

function primaryRank(row: MuseumSaintPlacement, memberDetails: MemberDetails) {
  const member = memberDetails[row.id];
  if (!member) return 999999;
  const hasMaster = Boolean(member.Masters?.trim());
  const discipleCount = String(member.Disciples || "")
    .split(";")
    .filter(Boolean).length;
  const year = Number.parseInt(String(member.BirthYear || "9999"), 10) || 9999;
  return (hasMaster ? 100000 : 0) - discipleCount * 100 + year;
}

function sortSaints(a: MuseumSaintPlacement, b: MuseumSaintPlacement) {
  return a.name.localeCompare(b.name);
}
