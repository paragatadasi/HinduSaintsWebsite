"use server";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { resolveFeedbackContext } from "@/lib/feedback-context";

export type FeedbackFormState = {
  message: string;
  reference?: string;
  status: "idle" | "success" | "error";
};

const feedbackSchema = z.object({
  submissionKey: z.string().uuid(),
  category: z.enum([
    "correction",
    "source_citation",
    "name_spelling",
    "missing_information",
    "technical_issue",
    "other"
  ]),
  name: z.string().trim().max(120).optional(),
  replyTo: z.string().trim().email().max(254).optional(),
  message: z.string().trim().min(1, "Share a note before sending.").max(5000),
  supportingSourceUrl: z.string().trim().url().max(1000).optional().refine(
    (value) => !value || value.startsWith("https://") || value.startsWith("http://"),
    "Supporting source must use http or https."
  ),
  pagePath: z.string().trim().max(500).optional(),
  entityType: z.enum(["saint", "tradition", "place"]).optional(),
  entitySlug: z.string().trim().max(200).optional(),
  company: z.string().max(0).optional()
});

export async function sendFeedback(
  _state: FeedbackFormState,
  formData: FormData
): Promise<FeedbackFormState> {
  const parsed = feedbackSchema.safeParse({
    submissionKey: formData.get("submissionKey"),
    category: formData.get("category"),
    name: emptyToUndefined(formData.get("name")),
    replyTo: emptyToUndefined(formData.get("email")),
    message: formData.get("message"),
    supportingSourceUrl: emptyToUndefined(formData.get("supportingSourceUrl")),
    pagePath: emptyToUndefined(formData.get("page")),
    entityType: emptyToUndefined(formData.get("entityType")),
    entitySlug: emptyToUndefined(formData.get("entitySlug")),
    company: emptyToUndefined(formData.get("company"))
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Please check the feedback form and try again."
    };
  }

  const existingSubmission = await db.feedbackSubmission.findUnique({
    where: { submissionKey: parsed.data.submissionKey },
    select: { id: true }
  });
  if (existingSubmission) {
    return {
      status: "success",
      message: "Thank you. Your feedback was received by the editorial team.",
      reference: existingSubmission.id.slice(-8).toUpperCase()
    };
  }

  const requestHeaders = await headers();
  const abuseFingerprint = getAbuseFingerprint(requestHeaders);
  if (abuseFingerprint) {
    const recentCount = await db.feedbackSubmission.count({
      where: {
        abuseFingerprint,
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) }
      }
    });

    if (recentCount >= 5) {
      return {
        status: "error",
        message: "Too many feedback notes were submitted recently. Please try again in a few minutes."
      };
    }
  }

  const feedback = parsed.data;
  const context = await resolveFeedbackContext({
    entityType: feedback.entityType,
    entitySlug: feedback.entitySlug,
    pagePath: feedback.pagePath
  });

  try {
    const submission = await db.feedbackSubmission.upsert({
      where: { submissionKey: feedback.submissionKey },
      update: {},
      create: {
        submissionKey: feedback.submissionKey,
        category: feedback.category,
        message: feedback.message,
        supportingSourceUrl: feedback.supportingSourceUrl,
        submitterName: feedback.name,
        submitterEmail: feedback.replyTo,
        pagePath: context?.pagePath,
        pageTitle: context?.pageTitle,
        entityType: context?.entityType,
        entityId: context?.entityId,
        entitySlug: context?.entitySlug,
        abuseFingerprint
      },
      select: { id: true }
    });

    return {
      status: "success",
      message: "Thank you. Your feedback was received by the editorial team.",
      reference: submission.id.slice(-8).toUpperCase()
    };
  } catch (error) {
    console.error("Feedback submission failed", error);
    return {
      status: "error",
      message: "Feedback could not be saved right now. Please try again shortly."
    };
  }
}

function emptyToUndefined(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function getAbuseFingerprint(requestHeaders: Headers) {
  const secret = process.env.FEEDBACK_RATE_LIMIT_SECRET ?? process.env.AUTH_SECRET;
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientIp = forwardedFor ?? requestHeaders.get("x-real-ip")?.trim();
  if (!secret || !clientIp) return undefined;
  return createHmac("sha256", secret).update(clientIp).digest("hex");
}
