import Link from "next/link";
import type { Route } from "next";
import { requireCapability } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { stageMuseumImports } from "@/lib/museum-import";
import { stageMuseumImportsAction } from "../actions";
import { ReviewWorkflow, ReviewSection } from "@/components/admin/review-ui";

export default async function MuseumReviewPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; staged?: string }>;
}) {
  await requireCapability("access_museum");
  const params = await searchParams;
  const q = (params.q || "").trim().slice(0, 200);
  const [audit, saints, proposals] = await Promise.all([
    stageMuseumImports(true),
    db.saint.findMany({
      where: { status: { not: "archived" } },
      select: {
        id: true,
        displayName: true,
        museumSectionAssignments: {
          where: { assignmentType: "primary", status: { not: "archived" } },
          select: { id: true, status: true }
        }
      },
      orderBy: { displayName: "asc" }
    }),
    db.museumImportProposal.findMany({
      where: { status: "pending" },
      select: { externalRecord: { select: { entityId: true } } }
    })
  ]);
  const pending = new Set(proposals.map((p) => p.externalRecord.entityId));
  const queue = saints
    .map((s) => ({
      ...s,
      reason:
        s.museumSectionAssignments.length > 1
          ? "Competing primary placements"
          : !s.museumSectionAssignments.length
            ? pending.has(s.id) ? "Source proposal awaiting review; no saved primary placement" : "No saved primary placement"
            : s.museumSectionAssignments[0].status !== "published"
              ? "Imported placement needs review"
              : pending.has(s.id)
                ? "New source proposal"
                : ""
    }))
    .filter((s) => s.reason);
  const filtered = queue.filter((s) => !q || s.displayName.toLowerCase().includes(q.toLowerCase()));
  const unresolved = audit.unresolved.filter(
    (r) => !q || [r.name, r.recordId, r.reason].some((v) => v.toLowerCase().includes(q.toLowerCase()))
  );
  return (
    <div className="museum-admin">
      <h1>Museum placement review</h1>
      <p>
        Database records are authoritative. Prepare proposals from the existing Airtable mirror and legacy
        exports, then review each saint. This does not contact or write to Airtable.
      </p>
      <p><Link href="/museumadmin">Browse the original section proposals</Link>. Source candidates are importable source records, not saved placements or unique saints. Preparing proposals does not accept them. A missing saved primary placement does not mean the historical proposal is missing.</p>
      {params.staged ? <p role="status">{params.staged} new proposals prepared.</p> : null}
      <form action={stageMuseumImportsAction}>
        <button className="museum-admin-button" type="submit">
          Prepare source proposals
        </button>
      </form>
      <form className="museum-admin-search" action="/museumadmin/review">
        <label htmlFor="review-search">Find a record</label>
        <input id="review-search" name="q" defaultValue={q} />
        <button className="museum-admin-button">Search</button>
      </form>
      <ReviewWorkflow
        eyebrow="Coverage audit"
        title={`${queue.length} saints need placement review`}
        description={`${audit.candidates} source records eligible for proposal preparation; ${audit.unresolved.length} unresolved source rows. Search to narrow lists of more than 100 records.`}
      >
        <ReviewSection title="Canonical saints">
          <ul>
            {filtered.slice(0, 100).map((s) => (
              <li key={s.id}>
                <Link href={`/museumadmin/saints/${s.id}` as Route}>{s.displayName}</Link> — {s.reason}
              </li>
            ))}
          </ul>
          <p>
            Showing {Math.min(filtered.length, 100)} of {filtered.length} matches.
          </p>
        </ReviewSection>
        <ReviewSection title="Unresolved source records">
          <p>
            Resolve these through the existing Airtable import and saint reconciliation workflow. Museum
            imports never guess a match from a name.
          </p>
          <ul>
            {unresolved.slice(0, 100).map((r, i) => (
              <li key={r.recordId + ":" + i}>
                {r.name} — {r.reason} ({r.recordId})
              </li>
            ))}
          </ul>
          <p>
            Showing {Math.min(unresolved.length, 100)} of {unresolved.length} matches.
          </p>
        </ReviewSection>
      </ReviewWorkflow>
    </div>
  );
}
