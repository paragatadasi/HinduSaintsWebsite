import Link from "next/link";
import type { Route } from "next";
import { CollapsibleReviewCard } from "@/components/admin/collapsible-review-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { resolveReconciliationIssue } from "./actions";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const statuses = ["open", "resolved", "ignored"] as const;

export default async function ReconciliationPage({ searchParams }: Props) {
  const params = await searchParams;
  const status = statuses.includes(first(params.status) as typeof statuses[number]) ? first(params.status) as typeof statuses[number] : "open";
  const issueType = first(params.type) || "all";
  const [issues, grouped, openCount] = await Promise.all([
    db.reconciliationIssue.findMany({ where: { status, ...(issueType === "all" ? {} : { issueType }) }, orderBy: [{ severity: "desc" }, { createdAt: "asc" }], take: 200 }),
    db.reconciliationIssue.groupBy({ by: ["issueType"], where: { status }, _count: { _all: true }, orderBy: { issueType: "asc" } }),
    db.reconciliationIssue.count({ where: { status: "open" } })
  ]);
  const saintIds = issues.filter((issue) => issue.entityType === "Saint" && issue.entityId).map((issue) => issue.entityId!);
  const saints = await db.saint.findMany({ where: { id: { in: saintIds } }, select: { id: true, displayName: true, slug: true, status: true } });
  const saintById = new Map(saints.map((saint) => [saint.id, saint]));
  const updated = first(params.updated);
  return <div className="admin-stack"><div><div className="eyebrow">Source Data</div><h1>Reconciliation</h1><p className="lede">Compare preserved source context with reviewed CMS context. Generic decisions never overwrite CMS fields automatically.</p><div className="review-meta"><StatusBadge label={`${openCount} open`} /></div></div>{updated ? <p className="admin-notice form-status form-status--success">Decision recorded: {formatLabel(updated)}.</p> : null}<div className="admin-queue-filters">{statuses.map((value) => <Link className="admin-queue-filter" aria-current={status === value ? "page" : undefined} href={`/admin/source-data/reconciliation?status=${value}` as Route} key={value}>{formatLabel(value)}</Link>)}</div><form action="/admin/source-data/reconciliation" className="admin-search"><input name="status" type="hidden" value={status} /><label><span>Issue type</span><select defaultValue={issueType} name="type"><option value="all">All issue types</option>{grouped.map((row) => <option key={row.issueType} value={row.issueType}>{formatLabel(row.issueType)} ({row._count._all})</option>)}</select></label><button className="admin-form-button admin-form-button--secondary" type="submit">Filter</button></form>{issues.length ? issues.map((issue) => { const saint = issue.entityId ? saintById.get(issue.entityId) : null; return <CollapsibleReviewCard cardId={`reconciliation-${issue.id}`} defaultOpen={issue.severity === "high"} description={issue.message} eyebrow={`${formatLabel(issue.issueType)} · ${issue.severity}`} key={issue.id} title={saint?.displayName || formatLabel(issue.entityType)}><div className="review-fact-grid"><div className="review-fact"><strong>Preserved raw/current context</strong><pre className="raw-json-preview">{prettyValue(issue.rawValue)}</pre></div><div className="review-fact"><strong>Suggested/source context</strong><pre className="raw-json-preview">{prettyValue(issue.suggestedValue)}</pre></div></div>{saint ? <p><Link href={`/admin/saints/${saint.slug}`}>Open {saint.displayName} in content review</Link></p> : null}<form action={resolveReconciliationIssue} className="admin-settings-form"><input name="issueId" type="hidden" value={issue.id} /><label className="admin-field"><span>Decision note</span><textarea defaultValue={issue.resolutionNote || ""} maxLength={2000} name="note" rows={3} /></label><div className="review-actions"><Decision value="keep_current" label="Keep CMS value" /><Decision value="accept_source" label="Approve source for follow-up" /><Decision value="merge" label="Queue merge follow-up" /><Decision value="ignore" label="Ignore issue" /><Decision value="defer" label="Defer" /></div></form>{issue.resolutionAction ? <p className="admin-settings-note">Current decision: {formatLabel(issue.resolutionAction)}{issue.resolvedByEmail ? ` by ${issue.resolvedByEmail}` : ""}.</p> : null}</CollapsibleReviewCard>; }) : <p className="empty-note">No reconciliation issues match this filter.</p>}</div>;
}

function Decision({ value, label }: { value: string; label: string }) { return <button className={value === "keep_current" ? "admin-form-button" : "admin-form-button admin-form-button--secondary"} name="decision" type="submit" value={value}>{label}</button>; }
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function formatLabel(value: string) { return value.replaceAll("_", " "); }
function prettyValue(value: string | null) { if (!value) return "Not recorded"; try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; } }
