"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { z } from "zod";
import { assertSaintsVisibleToUser, getAdminUser } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { canUpdateAssignedWorkflow, hasCapability } from "@/lib/permissions";

const contentTypes = ["saint", "tradition", "place", "instagram_item"] as const;
const states = ["assigned", "in_progress", "blocked", "completed", "cancelled"] as const;
const priorities = ["low", "normal", "high", "urgent"] as const;
const taskTypes = ["review", "edit", "research", "source_check", "publish"] as const;
const workflowStatuses = ["needs_review", "fact_checked", "populated", "polished"] as const;
const readinessContentTypes = ["saint", "tradition", "place"] as const;
const activeAssignmentStates = ["assigned", "in_progress", "blocked"] as const;
const blockedReasonSchema = z.string().trim().max(1000).optional();

const assignmentStatusSchema = z.object({
  taskStatus: z.enum(states),
  blockedReason: blockedReasonSchema
}).superRefine((value, context) => {
  if (value.taskStatus === "blocked" && !value.blockedReason) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Explain what is blocking this task.", path: ["blockedReason"] });
  }
});

const createSchema = z.object({
  target: z.string().min(3),
  taskType: z.enum(taskTypes),
  assigneeId: z.string().cuid().optional(),
  priority: z.enum(priorities),
  dueDate: z.string().date().optional(),
  notes: z.string().trim().max(2000).optional()
});

export async function createAssignment(formData: FormData) {
  const actor = await activeUser();
  if (!hasCapability(actor.roles, "manage_assignments")) fail("You cannot assign work to other users.");
  const parsed = createSchema.safeParse({
    target: formData.get("target"), taskType: formData.get("taskType"),
    assigneeId: formData.get("assigneeId") || undefined, priority: formData.get("priority"),
    dueDate: formData.get("dueDate") || undefined, notes: formData.get("notes") || undefined
  });
  if (!parsed.success) fail("Choose valid content and assignment details.");
  const [rawType, contentId] = parsed.data.target.split(":");
  const contentType = z.enum(contentTypes).safeParse(rawType);
  if (!contentType.success || !contentId || !(await contentExists(contentType.data, contentId))) fail("That content record no longer exists.");
  if (parsed.data.assigneeId && !(await db.user.count({ where: { id: parsed.data.assigneeId, active: true } }))) fail("Choose an active assignee.");
  const duplicate = await db.contentAssignment.count({ where: { contentType: contentType.data, contentId, taskType: parsed.data.taskType, assigneeId: parsed.data.assigneeId ?? null, state: { in: ["assigned", "in_progress", "blocked"] } } });
  if (duplicate) fail("That active assignment already exists for this collaborator.");
  await db.contentAssignment.create({ data: {
    contentType: contentType.data, contentId, taskType: parsed.data.taskType,
    assigneeId: parsed.data.assigneeId, assignedById: actor.id, priority: parsed.data.priority,
    dueDate: parsed.data.dueDate ? new Date(`${parsed.data.dueDate}T12:00:00Z`) : null, notes: parsed.data.notes
  } });
  done("created");
}

export async function claimAssignment(formData: FormData) {
  const actor = await activeUser();
  if (!hasCapability(actor.roles, "self_assign_content") && !hasCapability(actor.roles, "edit_content")) fail("Your role cannot claim editing work.");
  const id = z.string().cuid().safeParse(formData.get("assignmentId"));
  if (!id.success) fail("Invalid assignment.");
  const assignment = await db.contentAssignment.findUnique({ where: { id: id.data } });
  if (!assignment) fail("That assignment is no longer available.");
  await assertAssignmentVisible(actor, assignment);
  const result = await db.contentAssignment.updateMany({ where: { id: id.data, assigneeId: null, state: "assigned" }, data: { assigneeId: actor.id } });
  if (!result.count) fail("That assignment is no longer available.");
  done("claimed");
}

export async function leaveAssignment(formData: FormData) {
  const actor = await activeUser();
  const parsed = z.object({
    assignmentId: z.string().cuid(),
    returnTo: z.string().optional()
  }).safeParse({
    assignmentId: formData.get("assignmentId"),
    returnTo: formData.get("returnTo") || undefined
  });
  if (!parsed.success) assignmentFail(formData, "That task could not be released.");

  const assignment = await db.contentAssignment.findUnique({ where: { id: parsed.data.assignmentId } });
  if (!assignment) assignmentFail(formData, "That task no longer exists.");
  await assertAssignmentVisible(actor, assignment);

  const result = await db.contentAssignment.updateMany({
    where: {
      id: assignment.id,
      assigneeId: actor.id,
      state: { in: [...activeAssignmentStates] }
    },
    data: {
      assigneeId: null,
      blockedReason: null,
      completedAt: null,
      completedById: null,
      state: "assigned"
    }
  });
  if (!result.count) assignmentFail(formData, "You are no longer assigned to that active task.");

  if (parsed.data.returnTo) detailDone(parsed.data.returnTo, "released");
  done("released");
}

export async function updateAssignment(formData: FormData) {
  const actor = await activeUser();
  const parsed = z.object({
    assignmentId: z.string().cuid(),
    assigneeId: z.string().cuid().optional()
  }).and(assignmentStatusSchema).safeParse({
    assignmentId: formData.get("assignmentId"),
    assigneeId: formData.get("assigneeId") || undefined,
    blockedReason: formData.get("blockedReason") || undefined,
    taskStatus: formData.get("taskStatus")
  });
  if (!parsed.success) fail(parsed.error.issues[0]?.message || "Choose a valid task status.");
  const assignment = await db.contentAssignment.findUnique({ where: { id: parsed.data.assignmentId } });
  if (!assignment) fail("That assignment no longer exists.");
  await assertAssignmentVisible(actor, assignment);
  const manager = hasCapability(actor.roles, "manage_assignments");
  if (!manager && assignment.assigneeId !== actor.id) fail("You can update only your own work.");
  const assigneeId = manager ? parsed.data.assigneeId ?? assignment.assigneeId : assignment.assigneeId;
  if (manager && assigneeId && !(await db.user.count({ where: { id: assigneeId, active: true } }))) fail("Choose an active assignee.");
  await db.contentAssignment.update({ where: { id: assignment.id }, data: {
    ...assignmentStatusData(parsed.data.taskStatus, parsed.data.blockedReason, actor.id),
    assigneeId
  } });
  done("updated");
}

export async function selfAssignContent(formData: FormData) {
  const actor = await activeUser();
  if (!hasCapability(actor.roles, "self_assign_content")) detailFail(formData, "Your role cannot claim this review.");
  const parsed = z.object({
    contentType: z.enum(readinessContentTypes),
    contentId: z.string().cuid(),
    returnTo: z.string()
  }).safeParse({
    contentType: formData.get("contentType"),
    contentId: formData.get("contentId"),
    returnTo: formData.get("returnTo")
  });
  if (!parsed.success) detailFail(formData, "That review could not be assigned.");

  await assertAssignmentVisible(actor, parsed.data);
  if (!(await contentExists(parsed.data.contentType, parsed.data.contentId))) detailFail(formData, "That content record no longer exists.");

  const existing = await db.contentAssignment.findFirst({
    where: {
      contentType: parsed.data.contentType,
      contentId: parsed.data.contentId,
      assigneeId: actor.id,
      state: { in: [...activeAssignmentStates] }
    },
    select: { id: true }
  });
  if (!existing) {
    const available = await db.contentAssignment.findFirst({
      where: {
        contentType: parsed.data.contentType,
        contentId: parsed.data.contentId,
        assigneeId: null,
        state: "assigned"
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      select: { id: true }
    });
    if (available) {
      await db.contentAssignment.updateMany({
        where: { id: available.id, assigneeId: null, state: "assigned" },
        data: { assigneeId: actor.id }
      });
    } else {
      await db.contentAssignment.create({
        data: {
          contentType: parsed.data.contentType,
          contentId: parsed.data.contentId,
          taskType: "review",
          assigneeId: actor.id,
          assignedById: actor.id
        }
      });
    }
  }
  detailDone(parsed.data.returnTo, "assigned");
}

export async function updateContentWorkflowStatus(formData: FormData) {
  const actor = await activeUser();
  if (!hasCapability(actor.roles, "update_assigned_workflow")) detailFail(formData, "Your role cannot update this workflow.");
  const parsed = z.object({
    contentType: z.enum(readinessContentTypes),
    contentId: z.string().cuid(),
    workflowStatus: z.enum(workflowStatuses),
    assignmentId: z.string().cuid().optional(),
    taskStatus: z.enum(states).optional(),
    blockedReason: blockedReasonSchema,
    returnTo: z.string()
  }).superRefine((value, context) => {
    if (Boolean(value.assignmentId) !== Boolean(value.taskStatus)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Choose a valid task status.", path: ["taskStatus"] });
    }
    if (value.taskStatus === "blocked" && !value.blockedReason) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Explain what is blocking this task.", path: ["blockedReason"] });
    }
  }).safeParse({
    contentType: formData.get("contentType"),
    contentId: formData.get("contentId"),
    workflowStatus: formData.get("workflowStatus"),
    assignmentId: formData.get("assignmentId") || undefined,
    taskStatus: formData.get("taskStatus") || undefined,
    blockedReason: formData.get("blockedReason") || undefined,
    returnTo: formData.get("returnTo")
  });
  if (!parsed.success) detailFail(formData, parsed.error.issues[0]?.message || "Choose valid workflow updates.");

  await assertAssignmentVisible(actor, parsed.data);
  const activeAssignments = await db.contentAssignment.findMany({
    where: {
      contentType: parsed.data.contentType,
      contentId: parsed.data.contentId,
      state: { in: [...activeAssignmentStates] }
    },
    select: { id: true, assigneeId: true }
  });
  if (!canUpdateAssignedWorkflow(actor.roles, actor.id, activeAssignments.map((assignment) => assignment.assigneeId))) {
    detailFail(formData, "Assign this review to yourself before changing its workflow.");
  }
  const assignment = parsed.data.assignmentId
    ? activeAssignments.find((candidate) => candidate.id === parsed.data.assignmentId)
    : null;
  if (parsed.data.assignmentId && !assignment) detailFail(formData, "That task is no longer active.");
  if (assignment && !hasCapability(actor.roles, "manage_assignments") && assignment.assigneeId !== actor.id) {
    detailFail(formData, "You can update only your own task status.");
  }

  const data = { workflowStatus: parsed.data.workflowStatus };
  await db.$transaction(async (tx) => {
    if (parsed.data.contentType === "saint") await tx.saint.update({ where: { id: parsed.data.contentId }, data });
    if (parsed.data.contentType === "tradition") await tx.tradition.update({ where: { id: parsed.data.contentId }, data });
    if (parsed.data.contentType === "place") await tx.place.update({ where: { id: parsed.data.contentId }, data });
    if (assignment && parsed.data.taskStatus) {
      await tx.contentAssignment.update({
        where: { id: assignment.id },
        data: assignmentStatusData(parsed.data.taskStatus, parsed.data.blockedReason, actor.id)
      });
    }
  });
  detailDone(parsed.data.returnTo, "workflow");
}

function assignmentStatusData(taskStatus: typeof states[number], blockedReason: string | undefined, actorId: string) {
  const completed = taskStatus === "completed";
  return {
    blockedReason: taskStatus === "blocked" ? blockedReason : null,
    completedAt: completed ? new Date() : null,
    completedById: completed ? actorId : null,
    state: taskStatus
  };
}

async function activeUser() {
  const user = await getAdminUser();
  if (!user?.active) fail("Sign in with an active admin account.");
  return user;
}

async function contentExists(type: typeof contentTypes[number], id: string) {
  if (type === "saint") return Boolean(await db.saint.findUnique({ where: { id }, select: { id: true } }));
  if (type === "tradition") return Boolean(await db.tradition.findUnique({ where: { id }, select: { id: true } }));
  if (type === "place") return Boolean(await db.place.findUnique({ where: { id }, select: { id: true } }));
  return Boolean(await db.instagramItem.findUnique({ where: { id }, select: { id: true } }));
}

async function assertAssignmentVisible(
  actor: NonNullable<Awaited<ReturnType<typeof getAdminUser>>>,
  assignment: { contentId: string; contentType: string }
) {
  if (assignment.contentType === "saint") {
    await assertSaintsVisibleToUser(actor, [assignment.contentId]);
    return;
  }
  if (assignment.contentType === "instagram_item" && !hasCapability(actor.roles, "view_instagram_review")) {
    fail("You do not have access to that assignment.");
  }
  if ((assignment.contentType === "tradition" || assignment.contentType === "place") && !hasCapability(actor.roles, "view_content")) {
    fail("You do not have access to that assignment.");
  }
}

function fail(message: string): never { redirect(workDashboardHref("error", message)); }
function done(value: string): never { revalidatePath("/admin"); redirect(workDashboardHref("updated", value)); }

function detailFail(formData: FormData, message: string): never {
  redirect(detailHref(formData.get("returnTo"), "assignmentError", message));
}

function assignmentFail(formData: FormData, message: string): never {
  if (formData.get("returnTo")) detailFail(formData, message);
  fail(message);
}

function detailDone(returnTo: string, value: string): never {
  revalidatePath(returnTo);
  revalidatePath("/admin");
  redirect(detailHref(returnTo, "assignmentUpdated", value));
}

function detailHref(value: FormDataEntryValue | null, key: "assignmentError" | "assignmentUpdated", message: string) {
  const returnTo = typeof value === "string" && /^\/admin\/(saints|traditions|places)\/[a-z0-9-]+$/.test(value)
    ? value
    : "/admin";
  const params = new URLSearchParams({ [key]: message });
  return `${returnTo}?${params.toString()}` as Route;
}

function workDashboardHref(key: "error" | "updated", value: string) {
  const params = new URLSearchParams({ work: "mine", [key]: value });
  return `/admin?${params.toString()}#my-work` as Route;
}
