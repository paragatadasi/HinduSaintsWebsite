"use client";

import { useState } from "react";
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

  return (
    <div className="assignment-status-fields">
      <label className="admin-field">
        <span>Task status</span>
        <select
          name="taskStatus"
          onChange={(event) => setTaskStatus(event.target.value as AssignmentState)}
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
            maxLength={1000}
            name="blockedReason"
            onChange={(event) => setBlockedReason(event.target.value)}
            placeholder="Describe what is preventing this task from moving forward."
            required
            rows={2}
            value={blockedReason}
          />
          <small className="form-field-hint">Required while this task is blocked.</small>
        </label>
      ) : null}
    </div>
  );
}
