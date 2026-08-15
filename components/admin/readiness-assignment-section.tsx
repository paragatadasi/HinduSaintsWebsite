import { UserRoundCheck } from "lucide-react";
import type { UserRole, WorkflowStatus } from "@/lib/generated/prisma/client";
import { db } from "@/lib/db";
import {
  canSelfAssignAnotherTask,
  canUpdateAssignedWorkflow,
  hasCapability,
  hasSingleActionableAssignmentLimit
} from "@/lib/permissions";
import { AssignmentLeaveControl } from "@/components/admin/assignment-leave-control";
import { AssignmentStatusFields } from "@/components/admin/assignment-status-fields";
import { ReviewSection } from "@/components/admin/review-ui";
import { selfAssignContent, updateContentWorkflowStatus } from "@/app/admin/work/actions";
import { assignmentTaskTypeForWorkflow, assignmentTaskTypeLabel } from "@/lib/assignment-task-type";
import { getUserDisplayName, userDisplayNameSelect } from "@/lib/user-display-name";

type ReadinessContentType = "saint" | "tradition" | "place";

type ReadinessAssignmentSectionProps = {
  contentId: string;
  contentType: ReadinessContentType;
  currentUserId: string;
  currentUserRoles: readonly UserRole[];
  returnTo: string;
  workflowStatus: WorkflowStatus;
  assignmentError?: string;
  assignmentUpdated?: string;
};

const activeStates = ["assigned", "in_progress", "blocked"] as const;
const workflowOptions: Array<{ label: string; value: WorkflowStatus }> = [
  { label: "Needs review", value: "needs_review" },
  { label: "Fact-checked", value: "fact_checked" },
  { label: "Populated", value: "populated" },
  { label: "Polished", value: "polished" }
];

export async function ReadinessAssignmentSection({
  contentId,
  contentType,
  currentUserId,
  currentUserRoles,
  returnTo,
  workflowStatus,
  assignmentError,
  assignmentUpdated
}: ReadinessAssignmentSectionProps) {
  const singleAssignmentLimit = hasSingleActionableAssignmentLimit(currentUserRoles);
  const [assignments, currentUserAssignments] = await Promise.all([
    db.contentAssignment.findMany({
      where: { contentId, contentType, state: { in: [...activeStates] } },
      orderBy: [{ createdAt: "asc" }],
      select: {
        id: true,
        blockedReason: true,
        state: true,
        taskType: true,
        assigneeId: true,
        assignee: { select: userDisplayNameSelect }
      }
    }),
    singleAssignmentLimit
      ? db.contentAssignment.findMany({
          where: { assigneeId: currentUserId, state: { in: [...activeStates] } },
          select: { state: true }
        })
      : Promise.resolve([])
  ]);
  const currentAssignment = assignments.find((assignment) => assignment.assigneeId === currentUserId);
  const assignedToCurrentUser = Boolean(currentAssignment);
  const nextTaskType = assignmentTaskTypeForWorkflow(workflowStatus);
  const claimLimitReached = !canSelfAssignAnotherTask(
    currentUserRoles,
    currentUserAssignments.map((assignment) => assignment.state)
  );
  const canSelfAssign = hasCapability(currentUserRoles, "self_assign_content")
    && !assignedToCurrentUser
    && !claimLimitReached
    && nextTaskType !== null;
  const canUpdateWorkflow = canUpdateAssignedWorkflow(
    currentUserRoles,
    currentUserId,
    assignments.map((assignment) => assignment.assigneeId)
  );
  const namedAssignments = assignments.filter((assignment) => assignment.assignee);
  const availableCount = assignments.filter((assignment) => !assignment.assigneeId).length;
  const message = assignmentError
    ? { kind: "error" as const, text: assignmentError }
    : assignmentUpdated
      ? {
          kind: "success" as const,
          text: assignmentUpdated === "workflow"
            ? "Review workflow updated."
            : assignmentUpdated === "released"
              ? "You left this task. It is now available for another contributor."
              : "This review is now assigned to you."
        }
      : null;

  return (
    <ReviewSection
      className="review-workflow__section--assignment"
      icon={<UserRoundCheck aria-hidden="true" size={18} />}
      title="Assignment and workflow"
    >
      {message ? <p className={`readiness-assignment__message readiness-assignment__message--${message.kind}`}>{message.text}</p> : null}
      <div className="readiness-assignment__group">
        <strong>Assigned reviewers</strong>
        {namedAssignments.length > 0 ? (
          <ul className="readiness-assignment__people">
            {namedAssignments.map((assignment) => (
              <li key={assignment.id}>
                <span>{assignment.assignee ? getUserDisplayName(assignment.assignee) : "Unassigned"}</span>
                <small>{assignmentTaskTypeLabel(assignment.taskType)} · {formatLabel(assignment.state)}</small>
                {assignment.state === "blocked" && assignment.blockedReason ? (
                  <p className="assignment-blocked-reason"><strong>Blocking reason:</strong> {assignment.blockedReason}</p>
                ) : null}
                {assignment.assigneeId === currentUserId ? (
                  <AssignmentLeaveControl
                    assignmentId={assignment.id}
                    contentLabel="This review"
                    returnTo={returnTo}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        ) : <p className="readiness-assignment__empty">No reviewer is assigned yet.</p>}
        {availableCount > 0 ? <small>{availableCount} open assignment{availableCount === 1 ? "" : "s"} available.</small> : null}
        {claimLimitReached && !assignedToCurrentUser ? (
          <small>Finish or block your current task before assigning yourself another.</small>
        ) : null}
        {nextTaskType === null && !assignedToCurrentUser ? (
          <small>Polished content has no next workflow assignment.</small>
        ) : null}
      </div>

      {canSelfAssign ? (
        <form action={selfAssignContent}>
          <input name="contentType" type="hidden" value={contentType} />
          <input name="contentId" type="hidden" value={contentId} />
          <input name="returnTo" type="hidden" value={returnTo} />
          <button className="admin-form-button admin-form-button--secondary" type="submit">Assign to me</button>
        </form>
      ) : null}
      <div className="readiness-assignment__group">
        <strong>Workflow</strong>
        {canUpdateWorkflow ? (
          <form action={updateContentWorkflowStatus} className="readiness-assignment__workflow-form">
            <input name="contentType" type="hidden" value={contentType} />
            <input name="contentId" type="hidden" value={contentId} />
            <input name="returnTo" type="hidden" value={returnTo} />
            <div className="readiness-assignment__workflow-fields">
              <label className="admin-field">
                <span>Editorial progress</span>
                <select defaultValue={workflowStatus} name="workflowStatus">
                  {workflowOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              {currentAssignment ? (
                <>
                  <input name="assignmentId" type="hidden" value={currentAssignment.id} />
                  <AssignmentStatusFields
                    defaultBlockedReason={currentAssignment.blockedReason}
                    defaultStatus={currentAssignment.state}
                  />
                </>
              ) : null}
            </div>
            <button className="admin-form-button" type="submit">Update workflow</button>
          </form>
        ) : (
          <div className="readiness-assignment__workflow-readonly">
            <span>{formatLabel(workflowStatus)}</span>
            <small>{assignedToCurrentUser ? "Workflow editing is unavailable for this role." : "Assign this review to yourself to update its workflow."}</small>
          </div>
        )}
      </div>
    </ReviewSection>
  );
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}
