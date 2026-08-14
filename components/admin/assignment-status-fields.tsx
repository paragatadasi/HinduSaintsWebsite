"use client";

import { useId, useRef, useState } from "react";
import type { AssignmentState } from "@/lib/generated/prisma/client";

const taskStatusOptions: Array<{ label: string; value: AssignmentState }> = [
  { label: "Assigned", value: "assigned" },
  { label: "In progress", value: "in_progress" },
  { label: "Blocked", value: "blocked" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" }
];

export function AssignmentStatusFields({
  defaultBlockedReason,
  defaultStatus
}: {
  defaultBlockedReason?: string | null;
  defaultStatus: AssignmentState;
}) {
  const [taskStatus, setTaskStatus] = useState<AssignmentState>(defaultStatus);
  const [blockedReason, setBlockedReason] = useState(defaultBlockedReason ?? "");
  const blockedReasonHintId = useId();
  const blockedReasonRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="assignment-status-fields">
      <label className="admin-field">
        <span>Task status</span>
        <select
          name="taskStatus"
          onChange={(event) => {
            const nextStatus = event.target.value as AssignmentState;
            setTaskStatus(nextStatus);
            if (nextStatus === "blocked") {
              window.requestAnimationFrame(() => blockedReasonRef.current?.focus());
            }
          }}
          value={taskStatus}
        >
          {taskStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>

      {taskStatus === "blocked" ? (
        <label className="admin-field assignment-status-fields__reason">
          <span>Blocking reason</span>
          <textarea
            aria-describedby={blockedReasonHintId}
            maxLength={1000}
            name="blockedReason"
            onChange={(event) => setBlockedReason(event.target.value)}
            placeholder="Summarize what is needed before this task can move forward."
            ref={blockedReasonRef}
            required
            rows={4}
            value={blockedReason}
          />
          <small className="form-field-hint" id={blockedReasonHintId}>Required to mark this task as blocked.</small>
        </label>
      ) : null}
    </div>
  );
}
