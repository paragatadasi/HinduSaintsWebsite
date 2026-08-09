import Link from "next/link";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { CollapsibleReviewCard } from "@/components/admin/collapsible-review-card";
import { ReviewFactGrid } from "@/components/admin/review-ui";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireAdminUser } from "@/lib/admin-access";
import { db } from "@/lib/db";
import type { DuplicateCandidate, ReconciliationIssue } from "@/lib/generated/prisma/client";
import { hasCapability } from "@/lib/permissions";
import { resolveReconciliationIssue } from "./actions";
import { reviewDuplicateCandidate, runSaintDuplicateScan } from "./duplicate-actions";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const statuses = ["open", "resolved", "ignored"] as const;
type QueueStatus = typeof statuses[number];

export default async function ReconciliationPage({ searchParams }: Props) {
  const params = await searchParams;
  const user = await requireAdminUser();
  const canResolveDuplicates = hasCapability(user.roles, "resolve_duplicate_saints");
  const canResolveSource = hasCapability(user.roles, "resolve_reconciliation");
  if (!canResolveDuplicates && !canResolveSource) redirect("/admin?access=denied");

  const requestedView = first(params.view);
  const view = requestedView === "source" && canResolveSource ? "source" : "duplicates";
  const status = statuses.includes(first(params.status) as QueueStatus) ? first(params.status) as QueueStatus : "open";

  const [openDuplicateCount, openSourceCount] = await Promise.all([
    canResolveDuplicates ? db.duplicateCandidate.count({ where: { entityType: "Saint", status: "open" } }) : Promise.resolve(0),
    canResolveSource ? db.reconciliationIssue.count({ where: { status: "open" } }) : Promise.resolve(0)
  ]);

  return (
    <div className="admin-stack">
      <header>
        <div className="eyebrow">Editorial review</div>
        <h1>Reconciliation</h1>
        <p className="lede">Review evidence before confirming that records overlap. Confirming a duplicate never merges or publishes content.</p>
        <div className="review-meta">
          {canResolveDuplicates ? <StatusBadge label={`${openDuplicateCount} duplicate candidates`} /> : null}
          {canResolveSource ? <StatusBadge label={`${openSourceCount} source conflicts`} /> : null}
        </div>
      </header>

      {canResolveDuplicates && canResolveSource ? (
        <nav aria-label="Reconciliation queues" className="admin-queue-filters">
          <Link aria-current={view === "duplicates" ? "page" : undefined} className="admin-queue-filter" href="/admin/source-data/reconciliation?view=duplicates">Duplicate candidates</Link>
          <Link aria-current={view === "source" ? "page" : undefined} className="admin-queue-filter" href="/admin/source-data/reconciliation?view=source">Source conflicts</Link>
        </nav>
      ) : null}

      {noticeFromParams(params)}

      {view === "duplicates" ? (
        <DuplicateQueue canRunScan={canResolveDuplicates} params={params} status={status} />
      ) : (
        <SourceConflictQueue params={params} status={status} />
      )}
    </div>
  );
}

async function DuplicateQueue({ canRunScan, params, status }: { canRunScan: boolean; params: Record<string, string | string[] | undefined>; status: QueueStatus }) {
  const candidates = await db.duplicateCandidate.findMany({
    where: { entityType: "Saint", status },
    orderBy: [{ confidence: "desc" }, { createdAt: "asc" }],
    take: 200
  });
  const saintIds = Array.from(new Set(candidates.flatMap((candidate) => [candidate.entityId, candidate.candidateEntityId]).filter((id): id is string => Boolean(id))));
  const reviewerIds = Array.from(new Set(candidates.map((candidate) => candidate.reviewedById).filter((id): id is string => Boolean(id))));
  const [saints, reviewers] = await Promise.all([
    db.saint.findMany({
      where: { id: { in: saintIds } },
      select: {
        id: true,
        slug: true,
        displayName: true,
        canonicalName: true,
        aliases: { select: { alias: true } },
        birthDateRaw: true,
        samadhiDateRaw: true,
        publicationStatus: true,
        teamVisibility: true,
        workflowStatus: true,
        places: { include: { place: { select: { name: true } } } },
        traditions: { include: { tradition: { select: { name: true } } } }
      }
    }),
    db.user.findMany({ where: { id: { in: reviewerIds } }, select: { id: true, name: true, email: true } })
  ]);
  const saintById = new Map(saints.map((saint) => [saint.id, saint]));
  const reviewerById = new Map(reviewers.map((reviewer) => [reviewer.id, reviewer.name || reviewer.email]));

  return (
    <section className="admin-stack">
      <div className="admin-toolbar">
        <div>
          <h2>Saint duplicate candidates</h2>
          <p>Automated matches use the same normalized name and transliteration forms as Saint search, then add date, place, and tradition evidence.</p>
        </div>
        {canRunScan ? (
          <form action={runSaintDuplicateScan}>
            <button className="admin-form-button admin-form-button--secondary" type="submit">Scan full catalog</button>
          </form>
        ) : null}
      </div>
      <StatusFilters status={status} view="duplicates" />
      {candidates.length > 0 ? candidates.map((candidate) => {
        const left = candidate.entityId ? saintById.get(candidate.entityId) : undefined;
        const right = candidate.candidateEntityId ? saintById.get(candidate.candidateEntityId) : undefined;
        return (
          <DuplicateCandidateCard
            candidate={candidate}
            key={candidate.id}
            left={left}
            reviewer={candidate.reviewedById ? reviewerById.get(candidate.reviewedById) : undefined}
            right={right}
          />
        );
      }) : <p className="empty-note">No {statusLabel(status).toLowerCase()} duplicate candidates.</p>}
    </section>
  );
}

type SaintComparison = {
  slug: string;
  displayName: string;
  canonicalName: string;
  aliases: Array<{ alias: string }>;
  birthDateRaw: string | null;
  samadhiDateRaw: string | null;
  publicationStatus: string;
  teamVisibility: string;
  workflowStatus: string;
  places: Array<{ place: { name: string } }>;
  traditions: Array<{ tradition: { name: string } }>;
};

function DuplicateCandidateCard({ candidate, left, reviewer, right }: { candidate: DuplicateCandidate; left?: SaintComparison; reviewer?: string; right?: SaintComparison }) {
  const evidence = evidenceReasons(candidate.evidenceJson);
  return (
    <CollapsibleReviewCard
      cardId={`duplicate-${candidate.id}`}
      defaultOpen={candidate.confidence === "high" && candidate.status === "open"}
      description={candidate.message || "Potentially overlapping saint records."}
      eyebrow={`${formatLabel(candidate.confidence)} confidence · ${formatSource(candidate.sourceType)}`}
      title={left && right ? `${left.displayName} and ${right.displayName}` : "Unavailable saint pair"}
    >
      <div className="review-meta">
        <StatusBadge label={statusLabel(candidate.status)} />
        {reviewer ? <StatusBadge label={`reviewed by ${reviewer}`} /> : null}
      </div>
      <div className="duplicate-comparison-grid">
        <SaintComparisonFacts label="First record" saint={left} />
        <SaintComparisonFacts label="Possible duplicate" saint={right} />
      </div>
      {evidence.length > 0 ? (
        <div className="duplicate-evidence">
          <strong>Why this pair was flagged</strong>
          <ul>{evidence.map((reason) => <li key={reason}>{reason}</li>)}</ul>
        </div>
      ) : null}
      <form action={reviewDuplicateCandidate} className="admin-settings-form">
        <input name="candidateId" type="hidden" value={candidate.id} />
        <label className="admin-field">
          <span>Review note</span>
          <textarea defaultValue={candidate.resolutionNotes || ""} maxLength={2000} name="note" rows={3} />
        </label>
        <div className="review-actions">
          {candidate.status === "open" ? (
            <>
              <DuplicateDecision label="Confirm duplicate" value="confirm" />
              <DuplicateDecision label="Not a duplicate" value="ignore" secondary />
              <DuplicateDecision label="Defer" value="defer" secondary />
            </>
          ) : <DuplicateDecision label="Reopen review" value="reopen" secondary />}
        </div>
      </form>
      {candidate.resolvedAt ? <p className="admin-settings-note">Reviewed {candidate.resolvedAt.toLocaleString()}.</p> : null}
    </CollapsibleReviewCard>
  );
}

function SaintComparisonFacts({ label, saint }: { label: string; saint?: SaintComparison }) {
  if (!saint) return <section className="duplicate-comparison-panel"><h3>{label}</h3><p className="empty-note">This record is no longer available.</p></section>;
  return (
    <section className="duplicate-comparison-panel">
      <h3>{label}</h3>
      <ReviewFactGrid facts={[
        { label: "Display name", value: saint.displayName },
        { label: "Canonical name", value: saint.canonicalName },
        { label: "Aliases", value: saint.aliases.map((alias) => alias.alias).join(", ") },
        { label: "Dates", value: [saint.birthDateRaw, saint.samadhiDateRaw].filter(Boolean).join(" – ") },
        { label: "Places", value: saint.places.map((item) => item.place.name).join(", ") },
        { label: "Traditions", value: saint.traditions.map((item) => item.tradition.name).join(", ") },
        { label: "State", value: [saint.teamVisibility, saint.publicationStatus, saint.workflowStatus].map(formatLabel).join(" · ") }
      ]} />
      <Link className="admin-text-link" href={`/admin/saints/${saint.slug}`}>Open record</Link>
    </section>
  );
}

async function SourceConflictQueue({ params, status }: { params: Record<string, string | string[] | undefined>; status: QueueStatus }) {
  const issueType = first(params.type) || "all";
  const [issues, grouped] = await Promise.all([
    db.reconciliationIssue.findMany({ where: { status, ...(issueType === "all" ? {} : { issueType }) }, orderBy: [{ severity: "desc" }, { createdAt: "asc" }], take: 200 }),
    db.reconciliationIssue.groupBy({ by: ["issueType"], where: { status }, _count: { _all: true }, orderBy: { issueType: "asc" } })
  ]);
  const saintIds = issues.filter((issue) => issue.entityType === "Saint" && issue.entityId).map((issue) => issue.entityId!);
  const saints = await db.saint.findMany({ where: { id: { in: saintIds } }, select: { id: true, displayName: true, slug: true } });
  const saintById = new Map(saints.map((saint) => [saint.id, saint]));

  return (
    <section className="admin-stack">
      <div><h2>Source conflicts</h2><p>Compare preserved source context with reviewed CMS context. Generic decisions never overwrite CMS fields automatically.</p></div>
      <StatusFilters status={status} view="source" />
      <form action="/admin/source-data/reconciliation" className="admin-search">
        <input name="view" type="hidden" value="source" />
        <input name="status" type="hidden" value={status} />
        <label><span>Issue type</span><select defaultValue={issueType} name="type"><option value="all">All issue types</option>{grouped.map((row) => <option key={row.issueType} value={row.issueType}>{formatLabel(row.issueType)} ({row._count._all})</option>)}</select></label>
        <button className="admin-form-button admin-form-button--secondary" type="submit">Filter</button>
      </form>
      {issues.length > 0 ? issues.map((issue) => <SourceConflictCard issue={issue} key={issue.id} saint={issue.entityId ? saintById.get(issue.entityId) : undefined} />) : <p className="empty-note">No {statusLabel(status).toLowerCase()} source conflicts.</p>}
    </section>
  );
}

function SourceConflictCard({ issue, saint }: { issue: ReconciliationIssue; saint?: { displayName: string; slug: string } }) {
  return (
    <CollapsibleReviewCard cardId={`reconciliation-${issue.id}`} defaultOpen={issue.severity === "high"} description={issue.message} eyebrow={`${formatLabel(issue.issueType)} · ${issue.severity}`} title={saint?.displayName || formatLabel(issue.entityType)}>
      <div className="review-fact-grid">
        <div className="review-fact"><strong>Preserved raw/current context</strong><pre className="raw-json-preview">{prettyValue(issue.rawValue)}</pre></div>
        <div className="review-fact"><strong>Suggested/source context</strong><pre className="raw-json-preview">{prettyValue(issue.suggestedValue)}</pre></div>
      </div>
      {saint ? <p><Link href={`/admin/saints/${saint.slug}`}>Open {saint.displayName} in content review</Link></p> : null}
      <form action={resolveReconciliationIssue} className="admin-settings-form">
        <input name="issueId" type="hidden" value={issue.id} />
        <label className="admin-field"><span>Decision note</span><textarea defaultValue={issue.resolutionNote || ""} maxLength={2000} name="note" rows={3} /></label>
        <div className="review-actions"><SourceDecision value="keep_current" label="Keep CMS value" /><SourceDecision value="accept_source" label="Approve source for follow-up" /><SourceDecision value="merge" label="Queue merge follow-up" /><SourceDecision value="ignore" label="Ignore issue" /><SourceDecision value="defer" label="Defer" /></div>
      </form>
    </CollapsibleReviewCard>
  );
}

function StatusFilters({ status, view }: { status: QueueStatus; view: "duplicates" | "source" }) {
  return <nav aria-label={`${view} status`} className="admin-queue-filters">{statuses.map((value) => <Link aria-current={status === value ? "page" : undefined} className="admin-queue-filter" href={`/admin/source-data/reconciliation?view=${view}&status=${value}` as Route} key={value}>{statusLabel(value)}</Link>)}</nav>;
}

function DuplicateDecision({ value, label, secondary = false }: { value: string; label: string; secondary?: boolean }) { return <button className={secondary ? "admin-form-button admin-form-button--secondary" : "admin-form-button"} name="decision" type="submit" value={value}>{label}</button>; }
function SourceDecision({ value, label }: { value: string; label: string }) { return <button className={value === "keep_current" ? "admin-form-button" : "admin-form-button admin-form-button--secondary"} name="decision" type="submit" value={value}>{label}</button>; }

function noticeFromParams(params: Record<string, string | string[] | undefined>) {
  const error = first(params.error);
  if (error) return <p className="admin-notice form-status form-status--error">{error}</p>;
  const updated = first(params.updated);
  if (updated) return <p className="admin-notice form-status form-status--success">Decision recorded: {formatLabel(updated)}.</p>;
  const scanned = first(params.scanned);
  if (scanned) return <p className="admin-notice form-status form-status--success">Scanned {scanned} saints. Added {first(params.created) || "0"} candidates and refreshed {first(params.refreshed) || "0"} existing candidates.</p>;
  return null;
}

function evidenceReasons(value: unknown) {
  if (!value || typeof value !== "object" || !("reasons" in value) || !Array.isArray(value.reasons)) return [];
  return value.reasons.filter((reason): reason is string => typeof reason === "string");
}

function statusLabel(value: string) {
  if (value === "open") return "Needs review";
  if (value === "resolved") return "Confirmed duplicate";
  if (value === "ignored") return "Not duplicate";
  return formatLabel(value);
}
function formatSource(value: string | null) { return value === "database_scan" ? "catalog scan" : formatLabel(value || "manual review"); }
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function formatLabel(value: string) { return value.replaceAll("_", " "); }
function prettyValue(value: string | null) { if (!value) return "Not recorded"; try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; } }
