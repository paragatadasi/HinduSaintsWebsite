"use client";

import Link from "next/link";
import type { Route } from "next";
import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, MapPin, Search, TreePine, X } from "lucide-react";
import type { MuseumFamilyGroup, MuseumSaintPlacement, MuseumSection, MuseumTier } from "@/lib/museum-proposals";

type MemberDetails = Record<string, Record<string, string>>;

type MuseumSectionWorkspaceProps = {
  section: MuseumSection;
  memberDetails: MemberDetails;
  sectionNames: string[];
};

type AnchorOption = {
  id: string;
  label: string;
};

const tiers: MuseumTier[] = ["Featured", "Secondary", "Tertiary"];

export function MuseumSectionWorkspace({ section, memberDetails, sectionNames }: MuseumSectionWorkspaceProps) {
  const [selectedSaintId, setSelectedSaintId] = useState<string | null>(null);
  const [tierById, setTierById] = useState<Record<string, MuseumTier>>({});
  const [anchorById, setAnchorById] = useState<Record<string, string>>({});
  const [primarySectionById, setPrimarySectionById] = useState<Record<string, string>>({});
  const [groupMode, setGroupMode] = useState<"saint" | "location">("saint");
  const [tertiaryQuery, setTertiaryQuery] = useState("");
  const [researchOnly, setResearchOnly] = useState(false);

  const rowsById = useMemo(() => new Map(section.rows.map((row) => [row.id, row])), [section.rows]);
  const groupedPrimaryIds = useMemo(
    () => new Set(section.primaryGroups.flatMap((family) => family.featured.map((row) => row.id))),
    [section.primaryGroups]
  );
  const selectedSaint = selectedSaintId ? rowsById.get(selectedSaintId) ?? null : null;

  const tierFor = (row: MuseumSaintPlacement) => tierById[row.id] || row.tier;
  const anchorFor = (row: MuseumSaintPlacement) => anchorById[row.id] || "";
  const primarySectionFor = (row: MuseumSaintPlacement) => primarySectionById[row.id] || row.section;
  const setTier = (id: string, tier: MuseumTier) => setTierById((current) => ({ ...current, [id]: tier }));
  const setPrimarySection = (id: string, nextSection: string) => setPrimarySectionById((current) => ({ ...current, [id]: nextSection }));
  const setAnchor = (id: string, anchor: string) => {
    setAnchorById((current) => ({ ...current, [id]: anchor }));
    if (anchor === `saint:${id}`) setTier(id, "Featured");
    if (anchor && anchor !== `saint:${id}` && (tierById[id] || rowsById.get(id)?.tier) === "Featured") {
      setTier(id, "Secondary");
    }
  };

  const anchorOptions = useMemo<AnchorOption[]>(() => {
    const familyOptions = section.primaryGroups.map((family) => ({
      id: family.key,
      label: family.featured[0]?.name || family.label
    }));
    const standaloneOptions = section.rows
      .filter((row) => tierFor(row) === "Featured" && (!groupedPrimaryIds.has(row.id) || anchorFor(row) === `saint:${row.id}`))
      .map((row) => ({ id: `saint:${row.id}`, label: row.name }));
    return [...familyOptions, ...standaloneOptions]
      .filter((option, index, options) => options.findIndex((candidate) => candidate.id === option.id) === index)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [anchorById, groupedPrimaryIds, section.primaryGroups, section.rows, tierById]);

  const standalonePrimaries = section.rows
    .filter((row) => tierFor(row) === "Featured" && (!groupedPrimaryIds.has(row.id) || anchorFor(row) === `saint:${row.id}`))
    .sort(sortSaints);
  const tertiaryRows = section.rows
    .filter((row) => tierFor(row) === "Tertiary")
    .filter((row) => !anchorFor(row))
    .filter((row) => matchesTertiaryQuery(row, tertiaryQuery))
    .filter((row) => !researchOnly || row.needsResearch)
    .sort(sortSaints);
  const tertiaryByLocation = groupTertiaryByLocation(tertiaryRows);
  const treeFamilies = [...section.primaryGroups, ...section.secondaryOnlyGroups, ...section.tertiaryGroups]
    .filter((family, index, families) => family.treeFile && families.findIndex((candidate) => candidate.key === family.key) === index)
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
                  anchorById={anchorById}
                  family={family}
                  key={family.key}
                  memberDetails={memberDetails}
                  onSaintClick={setSelectedSaintId}
                  rows={section.rows}
                  tierById={tierById}
                />
              ))}
              {standalonePrimaries.map((row) => (
                <PrimarySaintCard anchorById={anchorById} key={row.id} onSaintClick={setSelectedSaintId} row={row} rows={section.rows} />
              ))}
              {section.secondaryOnlyGroups.map((family) => (
                <SecondaryFamilyCard
                  anchorById={anchorById}
                  family={family}
                  key={family.key}
                  onSaintClick={setSelectedSaintId}
                  rows={section.rows}
                  tierById={tierById}
                />
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
                  <input checked={researchOnly} onChange={(event) => setResearchOnly(event.target.checked)} type="checkbox" />
                  Needs research
                </label>
              </div>
              <div className="museum-tertiary-search" role="search">
                <label className="sr-only" htmlFor="tertiary-search">Search tertiary saints</label>
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
              <p className="museum-filter-note">{tertiaryRows.length} tertiary saints match the current filters.</p>
            ) : null}

            {groupMode === "location" ? (
              <div className="museum-location-groups">
                {tertiaryByLocation.map((location) => (
                  <section className="museum-location-group" key={location.label}>
                    <h3>{location.label}</h3>
                    <div className="museum-tertiary-grid">
                      {location.rows.map((row) => (
                        <TertiaryCard key={row.id} locationMode="specific" onSaintClick={setSelectedSaintId} row={row} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="museum-tertiary-grid">
                {tertiaryRows.map((row) => (
                  <TertiaryCard key={row.id} onSaintClick={setSelectedSaintId} row={row} />
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

      {selectedSaint ? (
        <SaintModal
          anchorOptions={anchorOptions}
          anchorValue={anchorFor(selectedSaint)}
          member={memberDetails[selectedSaint.id]}
          onAnchorChange={(value) => setAnchor(selectedSaint.id, value)}
          onClose={() => setSelectedSaintId(null)}
          onPrimarySectionChange={(value) => setPrimarySection(selectedSaint.id, value)}
          onTierChange={(tier) => setTier(selectedSaint.id, tier)}
          primarySectionValue={primarySectionFor(selectedSaint)}
          row={selectedSaint}
          sectionNames={sectionNames}
          tierValue={tierFor(selectedSaint)}
        />
      ) : null}
    </div>
  );
}

function FamilyCard({
  anchorById,
  family,
  memberDetails,
  onSaintClick,
  rows,
  tierById
}: {
  anchorById: Record<string, string>;
  family: MuseumFamilyGroup;
  memberDetails: MemberDetails;
  onSaintClick: (id: string) => void;
  rows: MuseumSaintPlacement[];
  tierById: Record<string, MuseumTier>;
}) {
  const familyRows = family.rows.filter((row) => !anchorById[row.id] || anchorById[row.id] === family.key);
  const familyIds = new Set(familyRows.map((row) => row.id));
  const affiliatedRows = rows.filter((row) => anchorById[row.id] === family.key && !familyIds.has(row.id));
  const cardRows = [...familyRows, ...affiliatedRows];
  const featured = cardRows
    .filter((row) => (tierById[row.id] || row.tier) === "Featured")
    .sort((a, b) => primaryRank(a, memberDetails) - primaryRank(b, memberDetails) || a.name.localeCompare(b.name));
  const affiliated = cardRows
    .filter((row) => (tierById[row.id] || row.tier) !== "Featured")
    .sort(sortSaints);
  const [head, ...otherPrimaries] = featured;
  const isPeerGroup = family.key.startsWith("CUR-") && featured.length > 1;

  return (
    <article className="museum-family-card">
      <div className="museum-family-card__header">
        <div>
          <h3>{isPeerGroup ? family.label : head ? <SaintButton row={head} onSaintClick={onSaintClick} /> : family.label}</h3>
          <p>{cardRows.length} saint{cardRows.length === 1 ? "" : "s"}</p>
        </div>
        <TreePine aria-hidden="true" size={19} />
      </div>
      <ul>
        {isPeerGroup ? featured.map((row) => (
          <li className="museum-family-card__primary" key={row.id}><SaintButton row={row} onSaintClick={onSaintClick} /></li>
        )) : otherPrimaries.map((row) => (
          <li className="museum-family-card__primary" key={row.id}><SaintButton row={row} onSaintClick={onSaintClick} /></li>
        ))}
        {affiliated.map((row) => <li key={row.id}><SaintButton row={row} onSaintClick={onSaintClick} /></li>)}
      </ul>
    </article>
  );
}

function PrimarySaintCard({
  anchorById,
  onSaintClick,
  row,
  rows
}: {
  anchorById: Record<string, string>;
  onSaintClick: (id: string) => void;
  row: MuseumSaintPlacement;
  rows: MuseumSaintPlacement[];
}) {
  const cardId = `saint:${row.id}`;
  if (anchorById[row.id] && anchorById[row.id] !== cardId) return null;

  const affiliated = rows.filter((candidate) => anchorById[candidate.id] === cardId && candidate.id !== row.id).sort(sortSaints);

  return (
    <article className="museum-family-card museum-family-card--standalone-primary">
      <div className="museum-family-card__header">
        <div>
          <h3><SaintButton row={row} onSaintClick={onSaintClick} /></h3>
          <p>Primary saint</p>
        </div>
        <TreePine aria-hidden="true" size={19} />
      </div>
      {affiliated.length ? (
        <ul>
          {affiliated.map((candidate) => <li key={candidate.id}><SaintButton row={candidate} onSaintClick={onSaintClick} /></li>)}
        </ul>
      ) : null}
    </article>
  );
}

function SecondaryFamilyCard({
  anchorById,
  family,
  onSaintClick,
  rows,
  tierById
}: {
  anchorById: Record<string, string>;
  family: MuseumFamilyGroup;
  onSaintClick: (id: string) => void;
  rows: MuseumSaintPlacement[];
  tierById: Record<string, MuseumTier>;
}) {
  const familyRows = family.rows.filter((row) => !anchorById[row.id] || anchorById[row.id] === family.key);
  const familyIds = new Set(familyRows.map((row) => row.id));
  const cardRows = [...familyRows, ...rows.filter((row) => anchorById[row.id] === family.key && !familyIds.has(row.id))]
    .filter((row) => (tierById[row.id] || row.tier) !== "Featured")
    .sort(sortSaints);
  if (!cardRows.length) return null;

  return (
    <article className="museum-family-card museum-family-card--secondary">
      <div className="museum-family-card__header">
        <div>
          <h3>{family.label}</h3>
          <p>{cardRows.length} affiliated saint{cardRows.length === 1 ? "" : "s"}</p>
        </div>
      </div>
      <ul>
        {cardRows.map((row) => <li key={row.id}><SaintButton row={row} onSaintClick={onSaintClick} /></li>)}
      </ul>
    </article>
  );
}

function SaintModal({
  anchorOptions,
  anchorValue,
  member,
  onAnchorChange,
  onClose,
  onPrimarySectionChange,
  onTierChange,
  primarySectionValue,
  row,
  sectionNames,
  tierValue
}: {
  anchorOptions: AnchorOption[];
  anchorValue: string;
  member?: Record<string, string>;
  onAnchorChange: (value: string) => void;
  onClose: () => void;
  onPrimarySectionChange: (value: string) => void;
  onTierChange: (tier: MuseumTier) => void;
  primarySectionValue: string;
  row: MuseumSaintPlacement;
  sectionNames: string[];
  tierValue: MuseumTier;
}) {
  return (
    <div className="museum-modal-backdrop" role="presentation">
      <section aria-modal="true" className="museum-modal" role="dialog">
        <div className="museum-modal__header">
          <div>
            <div className="museum-admin-kicker">Saint proposal</div>
            <h2>{row.name}</h2>
          </div>
          <button aria-label="Close saint proposal" className="museum-icon-button" onClick={onClose} type="button">
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="museum-modal__actions">
          <label>
            <span>Status</span>
            <select onChange={(event) => onTierChange(event.target.value as MuseumTier)} value={tierValue}>
              {tiers.map((tier) => <option key={tier} value={tier}>{tier === "Featured" ? "Primary" : tier}</option>)}
            </select>
          </label>
          <label>
            <span>Primary section</span>
            <select onChange={(event) => onPrimarySectionChange(event.target.value)} value={primarySectionValue}>
              {sectionNames.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
          <label>
            <span>Anchor card</span>
            <select onChange={(event) => onAnchorChange(event.target.value)} value={anchorValue}>
              <option value="">No explicit anchor</option>
              <option value={`saint:${row.id}`}>Make a new anchor card with this saint</option>
              {anchorOptions
                .filter((option) => option.id !== `saint:${row.id}`)
                .map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select>
          </label>
        </div>

        <dl className="museum-saint-data">
          <DataItem label="Original primary section" value={row.section} />
          {primarySectionValue !== row.section ? <DataItem label="Proposed primary section" value={primarySectionValue} /> : null}
          <DataItem label="Alternate sections" value={row.alternatives.join("; ")} />
          <DataItem label="Confidence" value={row.confidence} />
          <DataItem label="Family" value={row.curatorialFamily || row.familyId} />
          <DataItem label="Family size" value={row.familySize ? String(row.familySize) : ""} />
          <DataItem label="Sampradaya" value={row.sampradaya} />
          <DataItem label="Spiritual regions" value={row.spiritualRegions.join("; ")} />
          <DataItem label="Normalized places" value={row.normalizedPlaces.join("; ")} />
          <DataItem label="Birth / samadhi" value={[member?.BirthDate, member?.SamadhiDate].filter(Boolean).join(" - ")} />
          <DataItem label="Masters" value={member?.Masters} />
          <DataItem label="Disciples" value={member?.Disciples} />
          <DataItem label="Partner" value={member?.Partner} />
          <DataItem label="Incarnation" value={member?.Incarnation} />
          <DataItem label="Rationale" value={row.rationale} wide />
          <DataItem label="Internal note" value={row.note} wide />
          <DataItem label="Review signal" value={row.needsResearch ? "Needs more research or cleanup review" : ""} wide />
        </dl>
      </section>
    </div>
  );
}

function DataItem({ label, value, wide }: { label: string; value?: string; wide?: boolean }) {
  if (!value) return null;
  return (
    <div className={wide ? "museum-saint-data__wide" : undefined}>
      <dt>{label}</dt>
      <dd>{value}</dd>
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
  onSaintClick,
  row
}: {
  locationMode?: "summary" | "specific";
  onSaintClick: (id: string) => void;
  row: MuseumSaintPlacement;
}) {
  const placeLabel = locationMode === "specific"
    ? specificLocationLabel(row)
    : row.normalizedPlaces[0]
      ? museumLocationLabel(row.normalizedPlaces[0])
      : row.spiritualRegions[0] || "Place pending";

  return (
    <article className="museum-tertiary-card">
      <strong><SaintButton row={row} onSaintClick={onSaintClick} /></strong>
      <span>{placeLabel}</span>
      {row.needsResearch ? <small>Needs research</small> : null}
    </article>
  );
}

function SaintButton({ onSaintClick, row }: { onSaintClick: (id: string) => void; row: MuseumSaintPlacement }) {
  return (
    <button className="museum-saint-link" onClick={() => onSaintClick(row.id)} type="button">
      {row.name}
    </button>
  );
}

function groupTertiaryByLocation(rows: MuseumSaintPlacement[]) {
  const groups = new Map<string, MuseumSaintPlacement[]>();
  for (const row of rows) {
    const label = locationGroupLabel(row);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)?.push(row);
  }
  return [...groups.entries()]
    .map(([label, groupRows]) => ({ label, rows: groupRows.sort(sortSaints) }))
    .sort((a, b) => b.rows.length - a.rows.length || a.label.localeCompare(b.label));
}

function locationGroupLabel(row: MuseumSaintPlacement) {
  const place = row.normalizedPlaces[0];
  if (!place) return row.spiritualRegions[0] || "Location pending";
  return museumLocationLabel(place);
}

function specificLocationLabel(row: MuseumSaintPlacement) {
  if (row.normalizedPlaces.length) return row.normalizedPlaces.join("; ");
  return row.spiritualRegions.join("; ") || "Place pending";
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
  return row.name.toLowerCase().includes(q) ||
    row.normalizedPlaces.some((place) => place.toLowerCase().includes(q)) ||
    row.spiritualRegions.some((region) => region.toLowerCase().includes(q));
}

function primaryRank(row: MuseumSaintPlacement, memberDetails: MemberDetails) {
  const member = memberDetails[row.id];
  if (!member) return 999999;
  const hasMaster = Boolean(member.Masters?.trim());
  const discipleCount = String(member.Disciples || "").split(";").filter(Boolean).length;
  const year = Number.parseInt(String(member.BirthYear || "9999"), 10) || 9999;
  return (hasMaster ? 100000 : 0) - discipleCount * 100 + year;
}

function sortSaints(a: MuseumSaintPlacement, b: MuseumSaintPlacement) {
  return a.name.localeCompare(b.name);
}
