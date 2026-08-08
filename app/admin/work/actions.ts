"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { hasCapability } from "@/lib/permissions";

const contentTypes = ["saint", "tradition", "place", "instagram_item"] as const;
const states = ["assigned", "in_progress", "blocked", "completed", "cancelled"] as const;
const priorities = ["low", "normal", "high", "urgent"] as const;
const taskTypes = ["review", "edit", "research", "source_check", "publish"] as const;

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
  if (!hasCapability(actor.roles, "edit_content")) fail("Your role cannot claim editing work.");
  const id = z.string().cuid().safeParse(formData.get("assignmentId"));
  if (!id.success) fail("Invalid assignment.");
  const result = await db.contentAssignment.updateMany({ where: { id: id.data, assigneeId: null, state: "assigned" }, data: { assigneeId: actor.id } });
  if (!result.count) fail("That assignment is no longer available.");
  done("claimed");
}

export async function updateAssignment(formData: FormData) {
  const actor = await activeUser();
  const parsed = z.object({ assignmentId: z.string().cuid(), state: z.enum(states), assigneeId: z.string().cuid().optional() }).safeParse({ assignmentId: formData.get("assignmentId"), state: formData.get("state"), assigneeId: formData.get("assigneeId") || undefined });
  if (!parsed.success) fail("Invalid assignment update.");
  const assignment = await db.contentAssignment.findUnique({ where: { id: parsed.data.assignmentId } });
  if (!assignment) fail("That assignment no longer exists.");
  const manager = hasCapability(actor.roles, "manage_assignments");
  if (!manager && assignment.assigneeId !== actor.id) fail("You can update only your own work.");
  const assigneeId = manager ? parsed.data.assigneeId ?? assignment.assigneeId : assignment.assigneeId;
  if (manager && assigneeId && !(await db.user.count({ where: { id: assigneeId, active: true } }))) fail("Choose an active assignee.");
  const completed = parsed.data.state === "completed";
  await db.contentAssignment.update({ where: { id: assignment.id }, data: {
    state: parsed.data.state, assigneeId,
    completedAt: completed ? new Date() : null, completedById: completed ? actor.id : null
  } });
  done("updated");
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

function fail(message: string): never { redirect(workDashboardHref("error", message)); }
function done(value: string): never { revalidatePath("/admin"); redirect(workDashboardHref("updated", value)); }

function workDashboardHref(key: "error" | "updated", value: string) {
  const params = new URLSearchParams({ work: "mine", [key]: value });
  return `/admin?${params.toString()}#my-work` as Route;
}
