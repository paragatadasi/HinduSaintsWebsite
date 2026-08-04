"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { z } from "zod";
import { Prisma } from "@/lib/generated/prisma/client";
import { auth } from "@/lib/auth";
import { assertCapability } from "@/lib/admin-access";
import { db } from "@/lib/db";

const workflowSchema = z.object({
  feedbackId: z.string().cuid(),
  intent: z.enum(["start_review", "assign_self", "resolve", "spam", "reopen", "archive"]),
  resolutionNote: z.string().trim().max(2000).optional(),
  returnTo: z.string().trim().max(1000).optional()
});

export async function updateFeedbackWorkflow(formData: FormData) {
  const { email } = await requireAdminSession();
  const parsed = workflowSchema.parse({
    feedbackId: formData.get("feedbackId"),
    intent: formData.get("intent"),
    resolutionNote: emptyToUndefined(formData.get("resolutionNote")),
    returnTo: emptyToUndefined(formData.get("returnTo"))
  });
  const before = await db.feedbackSubmission.findUnique({
    where: { id: parsed.feedbackId },
    select: {
      status: true,
      assignedToEmail: true,
      resolutionNote: true,
      resolvedAt: true,
      resolvedByEmail: true
    }
  });

  if (!before) redirect("/admin/feedback");
  if (!canApplyIntent(before.status, parsed.intent)) {
    const returnTo = getReturnTo(parsed.returnTo, parsed.feedbackId);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=invalid_transition` as Route);
  }

  const now = new Date();
  const data = getWorkflowUpdate(parsed.intent, parsed.resolutionNote, email, now, before);

  await db.$transaction(async (tx) => {
    const updated = await tx.feedbackSubmission.update({
      where: { id: parsed.feedbackId },
      data,
      select: {
        status: true,
        assignedToEmail: true,
        resolutionNote: true,
        resolvedAt: true,
        resolvedByEmail: true
      }
    });

    await tx.auditEvent.create({
      data: {
        userId: email,
        action: `feedback_${parsed.intent}`,
        entityType: "FeedbackSubmission",
        entityId: parsed.feedbackId,
        beforeJson: toInputJson(before),
        afterJson: toInputJson(updated)
      }
    });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/feedback");
  revalidatePath(`/admin/feedback/${parsed.feedbackId}`);
  const returnTo = getReturnTo(parsed.returnTo, parsed.feedbackId);
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}updated=${parsed.intent}` as Route);
}

function getWorkflowUpdate(
  intent: z.infer<typeof workflowSchema>["intent"],
  resolutionNote: string | undefined,
  email: string,
  now: Date,
  before: {
    assignedToEmail: string | null;
    resolvedAt: Date | null;
  }
): Prisma.FeedbackSubmissionUpdateInput {
  if (intent === "start_review") {
    return {
      status: "in_review",
      assignedToEmail: before.assignedToEmail ?? email,
      resolvedAt: null,
      resolvedByEmail: null
    };
  }

  if (intent === "assign_self") {
    return { assignedToEmail: email };
  }

  if (intent === "resolve") {
    return {
      status: "resolved",
      assignedToEmail: before.assignedToEmail ?? email,
      resolutionNote,
      resolvedAt: now,
      resolvedByEmail: email
    };
  }

  if (intent === "spam") {
    return {
      status: "spam",
      assignedToEmail: before.assignedToEmail ?? email,
      resolutionNote,
      resolvedAt: now,
      resolvedByEmail: email
    };
  }

  if (intent === "archive") {
    return {
      status: "archived",
      resolvedAt: before.resolvedAt ?? now,
      resolvedByEmail: email
    };
  }

  return {
    status: "new",
    assignedToEmail: null,
    resolutionNote: null,
    resolvedAt: null,
    resolvedByEmail: null
  };
}

function canApplyIntent(
  status: "new" | "in_review" | "resolved" | "spam" | "archived",
  intent: z.infer<typeof workflowSchema>["intent"]
) {
  if (intent === "start_review") return status === "new";
  if (intent === "assign_self" || intent === "resolve" || intent === "spam") {
    return status === "new" || status === "in_review";
  }
  if (intent === "archive") return status === "resolved" || status === "spam";
  return status === "resolved" || status === "spam" || status === "archived";
}

async function requireAdminSession() {
  await assertCapability("edit_content");
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/admin");
  return { email };
}

function getReturnTo(value: string | undefined, feedbackId: string) {
  if (value?.startsWith("/admin/feedback/")) return value;
  return `/admin/feedback/${feedbackId}`;
}

function emptyToUndefined(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function toInputJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
