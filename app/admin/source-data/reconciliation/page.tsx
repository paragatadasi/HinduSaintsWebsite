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
import {
  duplicateQueueFor, duplicateQueueWhere, duplicateQueues, parseQueue, queueLabel,
  reconciliationHref, sourceQueueFor, sourceQueueWhere, sourceQueues, sourceSeverityFilters,
  type ReconciliationQueue, type ReconciliationView
} from "@/lib/reconciliation-workflow";
import { resolveReconciliationIssue } from "./actions";
import { reviewDuplicateCandidate, runSaintDuplicateScan } from "./duplicate-actions";
import { getUserDisplayName, userDisplayNameSelect } from "@/lib/user-display-name";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
type QueueStatus = ReconciliationQueue;

export default async function ReconciliationPage({ searchParams }: Props) {
  const params = await searchParams;
  const user = await requireAdminUser();
  const canResolveDuplicates = hasCapability(user.roles, "resolve_duplicate_saints");
  const canMergeSaints = hasCapability(user.roles, "merge_saints");
  const canResolveSource = hasCapability(user.roles, "resolve_reconciliation");
  if (!canResolveDuplicates && !canResolveSource) redirect("/admin?access=denied");

  const requestedView = first(params.view);
  const view = canResolveSource && (requestedView === "source" || !canResolveDuplicates) ? "source" : "duplicates";
  const status = parseQueue(view, first(params.status));

  const [openDuplicateCount, openSourceCount] = await Promise.all([
    canResolveDuplicates ? db.duplicateCandidate.count({ where: { entityType: "Saint", status: "open" } }) : Promise.resolve(0),
    canResolveSource ? db.reconciliationIssue.count({ where: { status: "open" } }) : Promise.resolve(0)
  ]);

  return (
    <div className="admin-stack">
      <header>
        <div className="eyebrow">Editorial review</div>
        <h1>Reconciliation</h1>
        <p className="lede">Review duplicate saints and source conflicts, record a decision, and track the work still needed.</p>
        <div className="review-meta">
          {canResolveDuplicates ? <StatusBadge label={`${openDuplicateCount} unresolved duplicate reviews`} /> : null}
          {canResolveSource ? <StatusBadge label={`${openSourceCount} unresolved source conflicts`} /> : null}
        </div>
      </header>

      {canResolveDuplicates && canResolveSource ? (
        <nav aria-label="Reconciliation queues" className="admin-queue-filters">
          <Link aria-current={view === "duplicates" ? "page" : undefined} className="admin-queue-filter" href="/admin/source-data/reconciliation?view=duplicates">Duplicate candidates</Link>
          <Link aria-current={view === "source" ? "page" : undefined} className="admin-queue-filter" href="/admin/source-data/reconciliation?view=source">Source conflicts</Link>
        </nav>
      ) : null}

      {noticeFromParams(params, canMergeSaints)}

      {view === "duplicates" ? (
        <DuplicateQueue canMerge={canMergeSaints} canRunScan={canResolveDuplicates} params={params} status={status} />
      ) : (
        <SourceConflictQueue params={params} status={status} />
      )}
    </div>
  );
}

async function DuplicateQueue({ canMerge, canRunScan, params, status }: { canMerge: boolean; canRunScan: boolean; params: Record<string, string | string[] | undefined>; status: QueueStatus }) {
  const candidates = await db.duplicateCandidate.findMany({
    where: duplicateQueueWhere(status),
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
    db.user.findMany({ where: { id: { in: reviewerIds } }, select: { id: true, ...userDisplayNameSelect } })
  ]);
  const saintById = new Map(saints.map((saint) => [saint.id, saint]));
  const reviewerById = new Map(reviewers.map((reviewer) => [reviewer.id, getUserDisplayName(reviewer)]));

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
            canMerge={canMerge}
            candidate={candidate}
            focus={first(params.candidate) === candidate.id}
            key={candidate.id}
            left={left}
            reviewer={candidate.reviewedById ? reviewerById.get(candidate.reviewedById) : undefined}
            right={right}
          />
        );
      }) : <p className="empty-note">No duplicate reviews in {queueLabel("duplicates", status).toLowerCase()}.</p>}
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

function DuplicateCandidateCard({ canMerge, candidate, focus, left, reviewer, right }: { canMerge: boolean; candidate: DuplicateCandidate; focus: boolean; left?: SaintComparison; reviewer?: string; right?: SaintComparison }) {
  const evidence = evidenceReasons(candidate.evidenceJson);
  const queue = duplicateQueueFor(candidate);
  const merged = queue === "merged";
  const stateLabel = candidate.resolutionAction === "merged" ? "Merged"
    : candidate.resolutionAction === "closed_by_merge" ? "Closed by another merge"
    : queue === "resolved" ? "Confirmed · awaiting merge" : queueLabel("duplicates", queue);
  return (
    <CollapsibleReviewCard
      cardId={`duplicate-${candidate.id}`}
      defaultOpen={focus || (candidate.confidence === "high" && queue === "open")}
      description={candidate.message || "Potentially overlapping saint records."}
      eyebrow={`${formatLabel(candidate.confidence)} confidence · ${formatSource(candidate.sourceType)}`}
      title={left && right ? `${left.displayName} and ${right.displayName}` : merged ? "Completed duplicate review" : "Unavailable saint pair"}
    >
      <div className="review-meta">
        <StatusBadge label={stateLabel} />
        {reviewer ? <StatusBadge label={`reviewed by ${reviewer}`} /> : null}
      </div>
      {!merged ? <div className="duplicate-comparison-grid">
        <SaintComparisonFacts label="First record" saint={left} />
        <SaintComparisonFacts label="Possible duplicate" saint={right} />
      </div> : <p>{candidate.resolutionNotes || "This review was closed when a saint record was merged."}</p>}
      {canMerge && queue === "resolved" && left && right ? (
        <div className="review-actions">
          <Link className="admin-form-button" href={`/admin/source-data/reconciliation/${candidate.id}/merge`}>Continue to merge review</Link>
        </div>
      ) : null}
      {queue === "resolved" ? <p className="admin-settings-note">The duplicate is confirmed; the records are still separate. A Site Admin must complete the merge.</p> : null}
      {evidence.length > 0 ? (
        <div className="duplicate-evidence">
          <strong>Why this pair was flagged</strong>
          <ul>{evidence.map((reason) => <li key={reason}>{reason}</li>)}</ul>
        </div>
      ) : null}
      {!merged ? <form action={reviewDuplicateCandidate} className="admin-settings-form">
        <input name="candidateId" type="hidden" value={candidate.id} />
        <input name="expectedUpdatedAt" type="hidden" value={candidate.updatedAt.toISOString()} />
        <input name="queue" type="hidden" value={queue} />
        {candidate.status === "open" ? <label className="admin-field">
          <span>Review note (required to defer)</span>
          <textarea defaultValue={candidate.resolutionNotes || ""} maxLength={2000} name="note" rows={3} />
        </label> : candidate.resolutionNotes ? <p>{candidate.resolutionNotes}</p> : null}
        <div className="review-actions">
          {candidate.status === "open" ? (
            <>
              {left && right ? <DuplicateDecision label="Confirm duplicate" value="confirm" /> : null}
              <DuplicateDecision label="Not a duplicate" value="ignore" secondary />
              <DuplicateDecision label="Defer" value="defer" secondary />
            </>
          ) : left && right ? <DuplicateDecision label="Reopen review" value="reopen" secondary /> : null}
        </div>
      </form> : null}
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
  const [issueBuckets, grouped] = await Promise.all([
    Promise.all(sourceSeverityFilters.map((severity) => db.reconciliationIssue.findMany({
      where: { ...sourceQueueWhere(status), ...severity, ...(issueType === "all" ? {} : { issueType }) },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }], take: 200
    }))),
    db.reconciliationIssue.groupBy({ by: ["issueType"], where: sourceQueueWhere(status), _count: { _all: true }, orderBy: { issueType: "asc" } })
  ]);
  const issues = issueBuckets.flat().slice(0, 200);
  const saintIds = issues.filter((issue) => issue.entityType === "Saint" && issue.entityId).map((issue) => issue.entityId!);
  const saints = await db.saint.findMany({ where: { id: { in: saintIds } }, select: { id: true, displayName: true, slug: true } });
  const saintById = new Map(saints.map((saint) => [saint.id, saint]));

  return (
    <section className="admin-stack">
      <div><h2>Source conflicts</h2><p>Compare preserved source context with reviewed CMS context. Generic decisions never overwrite CMS fields automatically.</p></div>
      <StatusFilters status={status} type={issueType} view="source" />
      <form action="/admin/source-data/reconciliation" className="admin-search">
        <input name="view" type="hidden" value="source" />
        <input name="status" type="hidden" value={status} />
        <label><span>Issue type</span><select defaultValue={issueType} name="type"><option value="all">All issue types</option>{issueType !== "all" && !grouped.some((row) => row.issueType === issueType) ? <option value={issueType}>{formatLabel(issueType)} (0)</option> : null}{grouped.map((row) => <option key={row.issueType} value={row.issueType}>{formatLabel(row.issueType)} ({row._count._all})</option>)}</select></label>
        <button className="admin-form-button admin-form-button--secondary" type="submit">Filter</button>
      </form>
      {issues.length > 0 ? issues.map((issue) => <SourceConflictCard issue={issue} issueType={issueType} key={issue.id} saint={issue.entityId ? saintById.get(issue.entityId) : undefined} />) : <p className="empty-note">No source conflicts in {queueLabel("source", status).toLowerCase()}.</p>}
    </section>
  );
}

function SourceConflictCard({ issue, issueType, saint }: { issue: ReconciliationIssue; issueType: string; saint?: { displayName: string; slug: string } }) {
  const queue = sourceQueueFor(issue);
  const completed = issue.status !== "open";
  return (
    <CollapsibleReviewCard cardId={`reconciliation-${issue.id}`} defaultOpen={!completed && issue.severity === "high"} description={issue.message} eyebrow={`${formatLabel(issue.issueType)} · ${issue.severity}`} title={saint?.displayName || formatLabel(issue.entityType)}>
      <div className="review-meta"><StatusBadge label={queueLabel("source", queue)} /></div>
      {issue.resolutionAction ? <p className="admin-settings-note">{sourceActionLabel(issue.resolutionAction)}{issue.resolvedByEmail ? ` · ${issue.resolvedByEmail}` : ""}{issue.resolvedAt ? ` · ${issue.resolvedAt.toLocaleString()}` : ""}</p> : null}
      {queue === "follow_up" ? <p>The requested change has not been applied. Complete it in the relevant content review; this conflict remains unresolved until that work is finished.</p> : null}
      {queue === "deferred" ? <p>Deferred reason: {issue.resolutionNote || "No reason was recorded for this earlier decision."}</p> : null}
      {completed && issue.resolutionNote ? <p>{issue.resolutionNote}</p> : null}
      <div className="review-fact-grid">
        <div className="review-fact"><strong>Preserved raw/current context</strong><pre className="raw-json-preview">{prettyValue(issue.rawValue)}</pre></div>
        <div className="review-fact"><strong>Suggested/source context</strong><pre className="raw-json-preview">{prettyValue(issue.suggestedValue)}</pre></div>
      </div>
      {saint ? <p><Link href={`/admin/saints/${saint.slug}`}>Open {saint.displayName} in content review</Link></p> : null}
      <form action={resolveReconciliationIssue} className="admin-settings-form">
        <input name="issueId" type="hidden" value={issue.id} />
        <input name="expectedUpdatedAt" type="hidden" value={issue.updatedAt.toISOString()} />
        <input name="queue" type="hidden" value={queue} />
        <input name="type" type="hidden" value={issueType} />
        {!completed ? <>
          <label className="admin-field"><span>Decision note (required to defer)</span><textarea defaultValue={issue.resolutionNote || ""} maxLength={2000} name="note" rows={3} /></label>
          <div className="review-actions"><SourceDecision value="keep_current" label="Keep CMS value" /><SourceDecision value="accept_source" label="Request source change" /><SourceDecision value="merge" label="Request merge review" /><SourceDecision value="ignore" label="Ignore issue" /><SourceDecision value="defer" label="Defer" /></div>
        </> : <div className="review-actions"><SourceDecision value="reopen" label="Reopen review" /></div>}
      </form>
    </CollapsibleReviewCard>
  );
}

function StatusFilters({ status, type, view }: { status: QueueStatus; type?: string; view: ReconciliationView }) {
  const queues = view === "duplicates" ? duplicateQueues : sourceQueues;
  return <nav aria-label={`${view} status`} className="admin-queue-filters">{queues.map((value) => <Link aria-current={status === value ? "page" : undefined} className="admin-queue-filter" href={reconciliationHref(view, value, { type }) as Route} key={value}>{queueLabel(view, value)}</Link>)}</nav>;
}

function DuplicateDecision({ value, label, secondary = false }: { value: string; label: string; secondary?: boolean }) { return <button className={secondary ? "admin-form-button admin-form-button--secondary" : "admin-form-button"} name="decision" type="submit" value={value}>{label}</button>; }
function SourceDecision({ value, label }: { value: string; label: string }) { return <button className={value === "keep_current" ? "admin-form-button" : "admin-form-button admin-form-button--secondary"} name="decision" type="submit" value={value}>{label}</button>; }

function noticeFromParams(params: Record<string, string | string[] | undefined>, canMerge: boolean) {
  const error = first(params.error);
  if (error) return <p className="admin-notice form-status form-status--error">{error}</p>;
  const merged = first(params.merged);
  const survivor = first(params.survivor);
  if (merged && survivor) return <p className="admin-notice form-status form-status--success">Merged {merged} into {survivor}. Relationships were transferred and the retired URL now redirects.</p>;
  const updated = first(params.updated);
  const candidate = first(params.candidate);
  if (updated === "confirm") return <div className="admin-notice form-status form-status--success"><p>Duplicate confirmed. The records are still separate and awaiting merge.</p>{canMerge && candidate && /^[a-z0-9]+$/.test(candidate) ? <Link className="admin-text-link" href={`/admin/source-data/reconciliation/${candidate}/merge` as Route}>Continue to merge review</Link> : <p>A Site Admin can complete the merge from Awaiting merge.</p>}</div>;
  if (updated) return <p className="admin-notice form-status form-status--success">{decisionNotice(updated)}</p>;
  const scanned = first(params.scanned);
  if (scanned) return <p className="admin-notice form-status form-status--success">Scanned {scanned} saints. Added {first(params.created) || "0"} candidates and refreshed {first(params.refreshed) || "0"} existing candidates.</p>;
  return null;
}

function evidenceReasons(value: unknown) {
  if (!value || typeof value !== "object" || !("reasons" in value) || !Array.isArray(value.reasons)) return [];
  return value.reasons.filter((reason): reason is string => typeof reason === "string");
}

function sourceActionLabel(value: string) {
  const labels: Record<string, string> = { keep_current: "Kept CMS value", accept_source: "Source change requested", merge: "Merge review requested", ignore: "Issue ignored", defer: "Review deferred", reopen: "Review reopened" };
  return labels[value] || formatLabel(value);
}
function decisionNotice(value: string) {
  const notices: Record<string, string> = {
    keep_current: "CMS value kept. This conflict is resolved.",
    accept_source: "Source change requested. This conflict is in Follow-up needed; no CMS values were changed.",
    merge: "Merge review requested. This conflict is in Follow-up needed; no records were merged.",
    defer: "Review deferred. Find it in Deferred when you are ready to continue.",
    reopen: "Review reopened. It is back in Needs review.",
    ignore: "Decision saved. You can reopen this review from its completed queue."
  };
  return notices[value] || "Decision recorded.";
}
function formatSource(value: string | null) { return value === "database_scan" ? "catalog scan" : formatLabel(value || "manual review"); }
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function formatLabel(value: string) { return value.replaceAll("_", " "); }
function prettyValue(value: string | null) { if (!value) return "Not recorded"; try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; } }
