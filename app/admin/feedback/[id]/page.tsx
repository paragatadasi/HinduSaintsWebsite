import { ExternalLink, Inbox, MessageSquareText, UserRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Route } from "next";
import { CollapsibleReviewCard } from "@/components/admin/collapsible-review-card";
import { ReviewFactGrid, ReviewSection, ReviewWorkflow } from "@/components/admin/review-ui";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireCapability } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { updateFeedbackWorkflow } from "../actions";

export const dynamic = "force-dynamic";

type FeedbackDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string | string[];
    returnTo?: string | string[];
    updated?: string | string[];
  }>;
};

export default async function FeedbackDetailPage({ params, searchParams }: FeedbackDetailPageProps) {
  await requireCapability("view_feedback_inbox");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const feedback = await db.feedbackSubmission.findUnique({ where: { id } });
  if (!feedback) notFound();

  const activity = await db.auditEvent.findMany({
    where: { entityType: "FeedbackSubmission", entityId: feedback.id },
    orderBy: { createdAt: "desc" }
  });
  const returnTo = getReturnTo(query.returnTo);
  const error = getSearchParam(query.error);
  const updated = getSearchParam(query.updated);
  const publicHref = feedback.pagePath && feedback.pagePath.startsWith("/") ? feedback.pagePath : null;
  const adminHref = getAdminEntityHref(feedback.entityType, feedback.entitySlug);
  const title = `${formatCategory(feedback.category)} — ${feedback.pageTitle || "General feedback"}`;
  const isOpen = feedback.status === "new" || feedback.status === "in_review";

  return (
    <div className="admin-stack">
      <div className="admin-toolbar">
        <div>
          <div className="eyebrow">Reviewing feedback</div>
          <h1>{title}</h1>
          <div className="review-meta">
            <StatusBadge label={formatLabel(feedback.status)} />
            <StatusBadge label={formatCategory(feedback.category)} />
            {feedback.entityType ? <StatusBadge label={`${formatLabel(feedback.entityType)} page`} /> : null}
          </div>
        </div>
        <div className="review-actions">
          <Link className="button button--secondary" href={returnTo as Route}>Back to inbox</Link>
          {publicHref ? (
            <Link className="button button--secondary" href={publicHref as Route}>
              View public page
              <ExternalLink aria-hidden="true" size={16} />
            </Link>
          ) : null}
          {adminHref ? <Link className="button button--secondary" href={adminHref as Route}>Open editor</Link> : null}
        </div>
      </div>

      {updated ? (
        <p className="admin-notice form-status form-status--success">
          Feedback updated: {formatLabel(updated)}.
        </p>
      ) : null}
      {error ? (
        <p className="admin-notice form-status form-status--error">
          This feedback changed before the requested action could be applied. Review its current status and try again.
        </p>
      ) : null}

      <ReviewWorkflow
        description="Review the original note and make the next editorial decision explicit."
        eyebrow="Primary decision"
        title="Review feedback"
      >
        <ReviewSection icon={<MessageSquareText aria-hidden="true" size={18} />} title="Submission">
          <div className="feedback-message">{feedback.message}</div>
          {feedback.supportingSourceUrl ? (
            <a className="admin-text-link feedback-source-link" href={feedback.supportingSourceUrl} rel="noreferrer" target="_blank">
              Open supporting source
              <ExternalLink aria-hidden="true" size={16} />
            </a>
          ) : <p>No supporting source was provided.</p>}
        </ReviewSection>

        <ReviewSection icon={<UserRound aria-hidden="true" size={18} />} title="Submitter and context">
          <ReviewFactGrid
            facts={[
              { label: "Name", value: feedback.submitterName || "Anonymous" },
              {
                label: "Reply email",
                value: feedback.submitterEmail
                  ? <a href={`mailto:${feedback.submitterEmail}`}>{feedback.submitterEmail}</a>
                  : "Not provided"
              },
              { label: "Related page", value: feedback.pageTitle || feedback.pagePath || "General feedback" },
              { label: "Received", value: formatDate(feedback.createdAt) },
              { label: "Assigned to", value: feedback.assignedToEmail || "Unassigned" },
              { label: "Resolved by", value: feedback.resolvedByEmail || "Not resolved" }
            ]}
          />
        </ReviewSection>

        <ReviewSection icon={<Inbox aria-hidden="true" size={18} />} title="Review action">
          <form action={updateFeedbackWorkflow} className="form-stack">
            <input name="feedbackId" type="hidden" value={feedback.id} />
            <input
              name="returnTo"
              type="hidden"
              value={`/admin/feedback/${feedback.id}?returnTo=${encodeURIComponent(returnTo)}`}
            />
            <label>
              Resolution note
              <textarea
                defaultValue={feedback.resolutionNote ?? ""}
                maxLength={2000}
                name="resolutionNote"
                placeholder="Optional internal note explaining the decision or follow-up."
              />
            </label>
            <div className="review-actions">
              {feedback.status === "new" ? (
                <button className="admin-form-button" name="intent" type="submit" value="start_review">Start review</button>
              ) : null}
              {isOpen && !feedback.assignedToEmail ? (
                <button className="admin-form-button admin-form-button--secondary" name="intent" type="submit" value="assign_self">
                  Assign to me
                </button>
              ) : null}
              {isOpen ? (
                <>
                  <button className="admin-form-button" name="intent" type="submit" value="resolve">Resolve</button>
                  <button className="admin-form-button admin-form-button--secondary" name="intent" type="submit" value="spam">Mark spam</button>
                </>
              ) : (
                <button className="admin-form-button" name="intent" type="submit" value="reopen">Reopen</button>
              )}
              {feedback.status === "resolved" || feedback.status === "spam" ? (
                <button className="admin-form-button admin-form-button--secondary" name="intent" type="submit" value="archive">Archive</button>
              ) : null}
            </div>
          </form>
        </ReviewSection>
      </ReviewWorkflow>

      <CollapsibleReviewCard
        cardId="feedback-activity"
        description="Workflow history and immutable submission identifiers."
        eyebrow="Reference"
        title="Activity and technical context"
      >
        <ReviewFactGrid
          facts={[
            { label: "Submission ID", value: feedback.id },
            { label: "Page path", value: feedback.pagePath },
            { label: "Entity ID", value: feedback.entityId },
            { label: "Last updated", value: formatDate(feedback.updatedAt) },
            { label: "Resolved", value: feedback.resolvedAt ? formatDate(feedback.resolvedAt) : undefined }
          ]}
        />
        {activity.length > 0 ? (
          <div className="review-list">
            {activity.map((event) => (
              <div className="review-row review-row--compact feedback-activity-row" key={event.id}>
                <div className="review-row__content">
                  <strong>{formatLabel(event.action)}</strong>
                  <span>{formatDate(event.createdAt)} · {event.userId || "Unknown reviewer"}</span>
                </div>
              </div>
            ))}
          </div>
        ) : <p>No workflow actions have been recorded yet.</p>}
      </CollapsibleReviewCard>
    </div>
  );
}

function getAdminEntityHref(entityType: string | null, entitySlug: string | null) {
  if (!entityType || !entitySlug || !["saint", "tradition", "place"].includes(entityType)) return null;
  const collection = entityType === "saint" ? "saints" : `${entityType}s`;
  return `/admin/${collection}/${entitySlug}`;
}

function getReturnTo(value: string | string[] | undefined) {
  const normalized = getSearchParam(value);
  return normalized.startsWith("/admin/feedback") && !normalized.startsWith("/admin/feedback/")
    ? normalized
    : "/admin/feedback";
}

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0]?.trim() ?? "" : value?.trim() ?? "";
}

function formatCategory(category: string) {
  const labels: Record<string, string> = {
    comment_testimony: "Comment/testimony",
    correction: "Correction",
    source_citation: "Source or citation",
    name_spelling: "Name or spelling",
    missing_information: "Missing information",
    technical_issue: "Technical issue",
    other: "Other"
  };
  return labels[category] ?? formatLabel(category);
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: Date) {
  return value.toLocaleString("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
