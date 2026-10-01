import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { getMuseumProposalData } from "@/lib/museum-proposals";
import { getDirectMuseumProposals } from "@/lib/museum-direct-proposals";
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/admin-access";
import {
  airtableIdentity,
  airtableSourceLink,
  museumFields,
  museumPlacementSchema,
} from "@/lib/museum-domain";
import {
  ReviewWorkflow,
  ReviewSection,
  ReviewFactGrid,
} from "@/components/admin/review-ui";
import { CollapsibleReviewCard } from "@/components/admin/collapsible-review-card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import { MuseumActionForm } from "@/components/admin/museum-action-form";
import { ReviewEditToggle } from "@/components/admin/review-edit-toggle";
import { savePlacementAction, reviewProposalAction } from "../../actions";

export default async function MuseumSaintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  await requireCapability("access_museum");
  const { id } = await params;
  const result = await searchParams;
  const [saint, sections, sources, groups, history, direct] = await Promise.all(
    [
      db.saint.findUnique({
        where: { id },
        include: {
          museumState: true,
          museumSectionAssignments: {
            where: { status: { not: "archived" } },
            include: { museumSection: true, exhibitGroup: true },
          },
          places: { include: { place: true } },
          traditions: { include: { tradition: true } },
          familyMemberships: { include: { family: true } },
          relationshipsFrom: {
            where: { status: { not: "archived" } },
            include: { toSaint: { select: { displayName: true } } },
          },
          relationshipsTo: {
            where: { status: { not: "archived" } },
            include: { fromSaint: { select: { displayName: true } } },
          },
        },
      }),
      db.museumSection.findMany({
        where: { status: { not: "archived" } },
        orderBy: { name: "asc" },
      }),
      db.externalRecord.findMany({
        where: { sourceType: "airtable", entityType: "Saint", entityId: id },
        select: {
          id: true,
          externalId: true,
          lastSeenAt: true,
          museumProposals: { orderBy: { createdAt: "desc" } },
        },
      }),
      db.museumExhibitGroup.findMany({
        include: { museumSection: { select: { name: true } } },
        orderBy: { label: "asc" },
      }),
      db.auditEvent.findMany({
        where: {
          entityType: "Saint",
          entityId: id,
          action: { startsWith: "museum." },
        },
        orderBy: { createdAt: "desc" },
        take: 15,
        select: {
          id: true,
          action: true,
          createdAt: true,
          beforeJson: true,
          afterJson: true,
        },
      }),
      getDirectMuseumProposals(),
    ],
  );
  if (!saint || saint.status === "archived") notFound();
  const mirrors = await db.airtableMirrorRecord.findMany({
    where: {
      OR: sources.flatMap((s) => {
        const key = airtableIdentity(s.externalId);
        return key
          ? [
              {
                baseId: key.baseId,
                tableIdOrName: key.table,
                recordId: key.recordId,
              },
            ]
          : [];
      }),
    },
    select: {
      baseId: true,
      tableIdOrName: true,
      recordId: true,
      rawFieldsJson: true,
      rawPayloadJson: true,
      lastSeenAt: true,
    },
  });
  const sourceIds = new Set(
    sources.map((s) => airtableIdentity(s.externalId)?.recordId),
  );
  const historicalTrees = getMuseumProposalData()
    .sections.flatMap((s) => s.families)
    .filter((f) => f.treeFile && f.rows.some((r) => sourceIds.has(r.id)))
    .filter(
      (f, i, all) =>
        all.findIndex((other) => other.treeFile === f.treeFile) === i,
    );
  const primaries = saint.museumSectionAssignments.filter(
    (a) => a.assignmentType === "primary",
  );
  const current = primaries.length === 1 ? primaries[0] : null;
  const version = saint.museumState?.version || 0;
  const proposals = sources.flatMap((s) =>
    s.museumProposals.map((p) => ({ ...p, externalId: s.externalId })),
  );
  const pending = [
    ...proposals.filter(
      (p) => p.status === "pending" && !direct.supersededSnapshotIds.has(p.id),
    ),
    ...direct.proposals.filter((p) => p.entityId === id),
  ];
  const existing = pending.filter((p) => p.sourceKind === "legacy-export");
  const baseProposal =
    !current && existing.length === 1
      ? existing[0]
      : current && pending.length === 1
        ? pending[0]
        : undefined;
  const parsedBase = museumPlacementSchema.safeParse(baseProposal?.payload);
  const initial = !current && parsedBase.success ? parsedBase.data : undefined;
  const names = [
    ...new Set([
      ...sections.map((s) => s.name),
      ...getMuseumProposalData().sections.map((s) => s.name),
      ...pending.flatMap((p) => {
        const parsed = museumPlacementSchema.safeParse(p.payload);
        return parsed.success
          ? [parsed.data.section, ...parsed.data.alternatives]
          : [];
      }),
    ]),
  ].sort();
  const identity = (
    <>
      <input type="hidden" name="saintId" value={id} />
      <input type="hidden" name="version" value={version} />
    </>
  );
  return (
    <div className="museum-admin">
      <nav className="museum-breadcrumb">
        <Link href="/museumadmin">Museum</Link>
        <Link href="/museumadmin/review">Placement review</Link>
      </nav>
      <h1>{saint.displayName}</h1>
      <p>
        <Link href={`/admin/saints/${saint.slug}` as Route}>
          Open main saint record
        </Link>{" "}
        ·{" "}
        {current?.status === "published"
          ? "Accepted museum placement"
          : "Museum placement needs review"}
      </p>
      {result.error ? <p role="alert">{result.error}</p> : null}
      {result.saved ? <p role="status">Museum decision saved.</p> : null}
      <ReviewWorkflow
        eyebrow="Curatorial decision"
        title="Museum placement"
        description="Museum decisions stay private and do not publish or change the saint’s public profile."
      >
        <ReviewSection
          title={current ? "Confirmed placement" : "Existing proposal"}
        >
          {primaries.length > 1 ? (
            <p role="alert">
              Competing primary placements:{" "}
              {primaries.map((p) => p.museumSection.name).join("; ")}. Saving
              one placement preserves the old assignments in history.
            </p>
          ) : null}
          <ReviewEditToggle
            editLabel={current ? "Edit placement" : "Edit and confirm proposal"}
            summary={
              <ReviewFactGrid
                facts={[
                  {
                    label: "Section",
                    value: current?.museumSection.name ?? initial?.section,
                  },
                  {
                    label: "Display tier",
                    value: current?.tier ?? initial?.tier,
                  },
                  {
                    label: "Confidence",
                    value: current?.confidence ?? initial?.confidence,
                  },
                  {
                    label: "Exhibit group",
                    value: current?.exhibitGroup?.label,
                  },
                  {
                    label: "Rationale",
                    value: current?.rationale ?? initial?.rationale,
                    wide: true,
                  },
                  {
                    label: "Internal note",
                    value: current?.internalPlacementNote ?? initial?.note,
                    wide: true,
                  },
                ]}
              />
            }
          >
            <MuseumActionForm
              action={savePlacementAction}
              className="form-stack"
            >
              {identity}
              {baseProposal ? (
                <input
                  type="hidden"
                  name="baseProposalId"
                  value={baseProposal.id}
                />
              ) : null}
              <SearchableSelect
                label="Primary section"
                name="section"
                required
                defaultValue={current?.museumSection.name ?? initial?.section}
                options={names.map((value) => ({ value, label: value }))}
              />
              <SearchableMultiSelect
                label="Alternative sections"
                name="alternatives"
                defaultSelectedValues={
                  initial?.alternatives ??
                  saint.museumSectionAssignments
                    .filter((a) => a.assignmentType === "alternative")
                    .map((a) => a.museumSection.name)
                }
                options={names.map((value) => ({ value, label: value }))}
              />
              <label>
                Display tier
                <select
                  name="tier"
                  defaultValue={current?.tier ?? initial?.tier ?? "secondary"}
                >
                  <option value="featured">Featured</option>
                  <option value="secondary">Secondary</option>
                  <option value="tertiary">Tertiary</option>
                </select>
              </label>
              <label>
                Confidence
                <select
                  name="confidence"
                  defaultValue={
                    current?.confidence ?? initial?.confidence ?? "medium"
                  }
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </label>
              <SearchableSelect
                label="Anchor / exhibit group"
                name="anchor"
                defaultValue={current?.exhibitGroupId || ""}
                options={[
                  { value: "self", label: "Make this saint an anchor" },
                  ...groups.map((g) => ({
                    value: g.id,
                    label: g.label,
                    description: g.museumSection.name,
                  })),
                ]}
              />
              <p>
                Existing groups must belong to the selected section. Leave the
                anchor empty to remove explicit grouping, or enter a new
                curatorial group below.
              </p>
              <label>
                New curatorial group
                <input
                  name="group"
                  maxLength={200}
                  defaultValue={initial?.group || ""}
                />
              </label>
              <label>
                Placement rationale
                <textarea
                  name="rationale"
                  maxLength={10000}
                  defaultValue={current?.rationale ?? initial?.rationale ?? ""}
                />
              </label>
              <label>
                Internal placement note
                <textarea
                  name="note"
                  maxLength={10000}
                  defaultValue={
                    current?.internalPlacementNote ?? initial?.note ?? ""
                  }
                />
              </label>
              <button className="museum-admin-button" type="submit">
                Save placement
              </button>
            </MuseumActionForm>
          </ReviewEditToggle>
        </ReviewSection>
        <ReviewSection
          title={
            current
              ? "Reconcile proposals with confirmed placement"
              : "Proposals to review"
          }
        >
          {!pending.length ? (
            <p>
              No proposals awaiting review. Existing proposals appear here
              automatically when their saint link is resolved.
            </p>
          ) : null}
          {pending.map((p) => {
            const parsed = museumPlacementSchema.safeParse(p.payload);
            const value = parsed.success ? parsed.data : null;
            const changes =
              current && value
                ? [
                    ["Section", current.museumSection.name, value.section],
                    [
                      "Alternatives",
                      saint.museumSectionAssignments
                        .filter((a) => a.assignmentType === "alternative")
                        .map((a) => a.museumSection.name)
                        .sort()
                        .join("; "),
                      [...value.alternatives].sort().join("; "),
                    ],
                    ["Display tier", current.tier, value.tier],
                    ["Confidence", current.confidence, value.confidence],
                    [
                      "Curatorial group",
                      current.exhibitGroup?.label || "",
                      value.group,
                    ],
                    ["Rationale", current.rationale || "", value.rationale],
                    [
                      "Internal note",
                      current.internalPlacementNote || "",
                      value.note,
                    ],
                  ]
                    .filter(([, site, source]) => site !== source)
                    .map(([label]) => label)
                : [];
            return (
              <article key={p.id}>
                <h4>
                  {p.sourceKind === "legacy-export"
                    ? "Existing museum proposal"
                    : "Suggested Airtable update"}
                </h4>
                <p>
                  {p.externalId} ·{" "}
                  {p.createdAt?.toISOString() ||
                    (p.sourceKind === "legacy-export"
                      ? "Existing section proposal"
                      : "Latest imported source")}
                </p>
                {current && value ? (
                  <p>
                    {changes.length
                      ? `Differs from confirmed placement: ${changes.join(", ")}.`
                      : "Matches the confirmed placement."}
                  </p>
                ) : null}
                {value ? (
                  <ReviewFactGrid
                    facts={[
                      { label: "Section", value: value.section },
                      {
                        label: "Alternatives",
                        value: value.alternatives.join("; "),
                      },
                      { label: "Display tier", value: value.tier },
                      { label: "Confidence", value: value.confidence },
                      { label: "Curatorial group", value: value.group },
                      {
                        label: "Rationale",
                        value: value.rationale,
                        wide: true,
                      },
                      { label: "Internal note", value: value.note, wide: true },
                    ]}
                  />
                ) : (
                  <p>
                    The source placement was cleared. Current decisions have
                    been preserved.
                  </p>
                )}
                <MuseumActionForm action={reviewProposalAction}>
                  {identity}
                  <input type="hidden" name="proposalId" value={p.id} />
                  {value ? (
                    <button
                      className="museum-admin-button"
                      name="decision"
                      value="accept"
                    >
                      Accept proposal
                    </button>
                  ) : null}{" "}
                  <button
                    className="museum-admin-button museum-admin-button--secondary"
                    name="decision"
                    value="ignore"
                  >
                    {current ? "Keep confirmed placement" : "Dismiss proposal"}
                  </button>
                </MuseumActionForm>
              </article>
            );
          })}
        </ReviewSection>
      </ReviewWorkflow>
      <CollapsibleReviewCard
        cardId="museum-saint-context"
        eyebrow="Shared saint record"
        title="Saint context"
      >
        <ReviewSection title="Biodata">
          <ReviewFactGrid
            facts={[
              { label: "Birth", value: saint.birthDateRaw || saint.birthYear },
              {
                label: "Samadhi",
                value: saint.samadhiDateRaw || saint.samadhiYear,
              },
              {
                label: "Traditions",
                value: saint.traditions.map((t) => t.tradition.name).join("; "),
              },
              {
                label: "Places",
                value: saint.places.map((p) => p.place.name).join("; "),
              },
              {
                label: "Families",
                value: saint.familyMemberships
                  .map((m) => m.family.displayName)
                  .join("; "),
              },
            ]}
          />
        </ReviewSection>
        <ReviewSection title="Recorded relationships">
          <p>
            Imported and unreviewed relationships are labeled; exhibit groups
            are separate from lineage.
          </p>
          <ul>
            {saint.relationshipsFrom.map((r) => (
              <li key={r.id}>
                {saint.displayName} → {r.relationshipType} →{" "}
                {r.toSaint.displayName} ({r.status})
              </li>
            ))}
            {saint.relationshipsTo.map((r) => (
              <li key={r.id}>
                {r.fromSaint.displayName} → {r.relationshipType} →{" "}
                {saint.displayName} ({r.status})
              </li>
            ))}
          </ul>
        </ReviewSection>
      </CollapsibleReviewCard>
      <CollapsibleReviewCard
        cardId="museum-sources"
        title="Airtable references and latest mirror"
      >
        {sources.map((s) => {
          const key = airtableIdentity(s.externalId);
          const mirror = mirrors.find(
            (m) =>
              key &&
              m.baseId === key.baseId &&
              m.tableIdOrName === key.table &&
              m.recordId === key.recordId,
          );
          const value = mirror
            ? museumFields(mirror.rawFieldsJson as Record<string, unknown>)
            : null;
          const link = airtableSourceLink(s.externalId, mirror?.rawPayloadJson);
          return (
            <section key={s.id}>
              <h3>
                {link ? (
                  <a href={link.url} target="_blank" rel="noreferrer">
                    {link.direct
                      ? "Open Airtable record"
                      : "Open Airtable base"}{" "}
                    — {link.recordId}
                  </a>
                ) : (
                  s.externalId
                )}
              </h3>
              <p>
                Mirror last seen:{" "}
                {mirror?.lastSeenAt.toISOString() || "No mirror available"}.
                Source links can include multiple records after a saint merge.
              </p>
              <ReviewFactGrid
                facts={[
                  { label: "Imported section", value: value?.section },
                  { label: "Imported tier", value: value?.tier },
                  {
                    label: "Imported rationale",
                    value: value?.rationale,
                    wide: true,
                  },
                  { label: "Imported group", value: value?.group },
                ]}
              />
            </section>
          );
        })}
      </CollapsibleReviewCard>
      {historicalTrees.length ? (
        <CollapsibleReviewCard
          cardId="museum-historical-trees"
          title="Historical family-tree exports"
          description="Reference images from the original export. These do not reflect subsequent CMS relationship edits."
        >
          {historicalTrees.map((f) => (
            <figure className="museum-tree-panel" key={f.treeFile}>
              <figcaption>{f.label}</figcaption>
              <img
                src={`/museumadmin/family-tree/${f.treeFile}`}
                alt={`${f.label}, historical family-tree export`}
              />
            </figure>
          ))}
        </CollapsibleReviewCard>
      ) : null}
      <CollapsibleReviewCard cardId="museum-history" title="Decision history">
        <ul>
          {history.map((h) => (
            <li key={h.id}>
              {h.createdAt.toISOString()} — {h.action}
              <details>
                <summary>Saved comparison</summary>
                <pre className="raw-json-preview">
                  {JSON.stringify(
                    { before: h.beforeJson, after: h.afterJson },
                    null,
                    2,
                  )}
                </pre>
              </details>
            </li>
          ))}
        </ul>
        <ul>
          {proposals
            .filter((p) => p.status !== "pending")
            .map((p) => (
              <li key={p.id}>
                {p.createdAt.toISOString()} — {p.sourceKind}: {p.status}
                {museumPlacementSchema.safeParse(p.payload).success ? (
                  <pre className="raw-json-preview">
                    {JSON.stringify(p.payload, null, 2)}
                  </pre>
                ) : null}
              </li>
            ))}
        </ul>
      </CollapsibleReviewCard>
    </div>
  );
}
