export type AssignmentTaskType = "fact_check" | "populate" | "polish" | "review";
export type AssignmentWorkflowStatus = "needs_review" | "fact_checked" | "populated" | "polished";

export function assignmentTaskTypeForWorkflow(status: AssignmentWorkflowStatus): AssignmentTaskType | null {
  if (status === "needs_review") return "fact_check";
  if (status === "fact_checked") return "populate";
  if (status === "populated") return "polish";
  return null;
}

export function assignmentTaskTypeLabel(taskType: string) {
  if (taskType === "fact_check") return "Fact-check";
  if (taskType === "populate") return "Populate";
  if (taskType === "polish") return "Polish";
  if (taskType === "review") return "Review";
  return taskType.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}
