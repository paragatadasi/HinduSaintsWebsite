import Link from "next/link";
import type { Route } from "next";
import { requireCapability } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { stageMuseumImports } from "@/lib/museum-import";
import { getDirectMuseumProposals } from "@/lib/museum-direct-proposals";
import { ReviewWorkflow, ReviewSection } from "@/components/admin/review-ui";

export default async function MuseumReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; staged?: string }>;
}) {
  await requireCapability("access_museum");
  const params = await searchParams;
  const q = (params.q || "").trim().slice(0, 200);
  const [audit, saints, proposals, direct] = await Promise.all([
    stageMuseumImports(true),
    db.saint.findMany({
      where: { status: { not: "archived" } },
      select: {
        id: true,
        displayName: true,
        museumSectionAssignments: {
          where: { assignmentType: "primary", status: { not: "archived" } },
          select: { id: true, status: true },
        },
      },
      orderBy: { displayName: "asc" },
    }),
    db.museumImportProposal.findMany({
      where: { status: "pending" },
      select: { id: true, externalRecord: { select: { entityId: true } } },
    }),
    getDirectMuseumProposals(),
  ]);
  const pending = new Set([
    ...proposals
      .filter((p) => !direct.supersededSnapshotIds.has(p.id))
      .map((p) => p.externalRecord.entityId),
    ...direct.proposals.map((p) => p.entityId),
  ]);
  const queue = saints
    .map((s) => ({
      ...s,
      reason:
        s.museumSectionAssignments.length > 1
          ? "Competing primary placements"
          : !s.museumSectionAssignments.length
            ? pending.has(s.id)
              ? "Proposal awaiting confirmation"
              : "No confirmed placement"
            : s.museumSectionAssignments[0].status !== "published"
              ? "Imported placement needs review"
              : pending.has(s.id)
                ? "Suggested update awaiting review"
                : "",
    }))
    .filter((s) => s.reason);
  const filtered = queue.filter(
    (s) => !q || s.displayName.toLowerCase().includes(q.toLowerCase()),
  );
  const unresolved = audit.unresolved.filter(
    (r) =>
      !q ||
      [r.name, r.recordId, r.reason].some((v) =>
        v.toLowerCase().includes(q.toLowerCase()),
      ),
  );
  return (
    <div className="museum-admin">
      <h1>Museum placement review and reconciliation</h1>
      <p>
        Existing museum proposals are ready to review. Open a saint to confirm
        the proposal or edit it before saving. For records with confirmed
        placements, compare suggested source updates with the site decision,
        then keep the site value, accept the update, or edit the placement.
        Source updates never replace confirmed placements automatically.
      </p>
      <p>
        <Link href="/museumadmin">Browse section proposals</Link>. Records
        without an unambiguous saint link remain visible there and are listed
        below for reconciliation.
      </p>
      <form className="museum-admin-search" action="/museumadmin/review">
        <label htmlFor="review-search">Find a record</label>
        <input id="review-search" name="q" defaultValue={q} />
        <button className="museum-admin-button">Search</button>
      </form>
      <ReviewWorkflow
        eyebrow="Coverage audit"
        title={`${queue.length} saints need placement review`}
        description={`${pending.size} saints with proposals awaiting review; ${audit.unresolved.length} unresolved source rows. Search to narrow lists of more than 100 records.`}
      >
        <ReviewSection title="Canonical saints">
          <ul>
            {filtered.slice(0, 100).map((s) => (
              <li key={s.id}>
                <Link href={`/museumadmin/saints/${s.id}` as Route}>
                  {s.displayName}
                </Link>{" "}
                — {s.reason}
              </li>
            ))}
          </ul>
          <p>
            Showing {Math.min(filtered.length, 100)} of {filtered.length}{" "}
            matches.
          </p>
        </ReviewSection>
        <ReviewSection title="Unresolved source records">
          <p>
            Resolve these through the existing Airtable import and saint
            reconciliation workflow. Museum imports never guess a match from a
            name.
          </p>
          <ul>
            {unresolved.slice(0, 100).map((r, i) => (
              <li key={r.recordId + ":" + i}>
                {r.name} — {r.reason} ({r.recordId})
              </li>
            ))}
          </ul>
          <p>
            Showing {Math.min(unresolved.length, 100)} of {unresolved.length}{" "}
            matches.
          </p>
        </ReviewSection>
      </ReviewWorkflow>
    </div>
  );
}
