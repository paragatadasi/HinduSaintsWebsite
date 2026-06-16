"use server";

import nodemailer from "nodemailer";
import { z } from "zod";

const CONTACT_EMAIL = "hindusaints@gmail.com";

export type FeedbackFormState = {
  message: string;
  status: "idle" | "success" | "error";
};

const feedbackSchema = z.object({
  name: z.string().trim().max(120).optional(),
  replyTo: z.string().trim().email().max(254).optional(),
  message: z.string().trim().min(1, "Share a note before sending.").max(5000),
  pagePath: z.string().trim().max(500).optional(),
  saintName: z.string().trim().max(200).optional(),
  company: z.string().max(0).optional()
});

export async function sendFeedback(
  _state: FeedbackFormState,
  formData: FormData
): Promise<FeedbackFormState> {
  const parsed = feedbackSchema.safeParse({
    name: emptyToUndefined(formData.get("name")),
    replyTo: emptyToUndefined(formData.get("email")),
    message: formData.get("message"),
    pagePath: emptyToUndefined(formData.get("page")),
    saintName: emptyToUndefined(formData.get("saint")),
    company: emptyToUndefined(formData.get("company"))
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Please check the feedback form and try again."
    };
  }

  const smtpUser = process.env.FEEDBACK_EMAIL_USER;
  const smtpPass = process.env.FEEDBACK_EMAIL_APP_PASSWORD;
  const toEmail = process.env.FEEDBACK_EMAIL_TO ?? CONTACT_EMAIL;
  const fromEmail = process.env.FEEDBACK_EMAIL_FROM ?? smtpUser;

  if (!smtpUser || !smtpPass || !fromEmail) {
    return {
      status: "error",
      message: "Email is not configured yet. Please use the direct email link below."
    };
  }

  const feedback = parsed.data;
  const transporter = nodemailer.createTransport({
    host: process.env.FEEDBACK_EMAIL_HOST ?? "smtp.gmail.com",
    port: Number(process.env.FEEDBACK_EMAIL_PORT ?? 465),
    secure: (process.env.FEEDBACK_EMAIL_SECURE ?? "true") !== "false",
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });

  const subject = feedback.saintName
    ? `Feedback for ${feedback.saintName}`
    : "Hindu Saints Archive feedback";

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: toEmail,
      replyTo: feedback.replyTo,
      subject,
      text: [
        feedback.saintName ? `Saint: ${feedback.saintName}` : null,
        feedback.pagePath ? `Page: ${feedback.pagePath}` : null,
        feedback.name ? `Name: ${feedback.name}` : null,
        feedback.replyTo ? `Reply-to: ${feedback.replyTo}` : null,
        "",
        "Feedback:",
        feedback.message
      ]
        .filter((part) => part !== null)
        .join("\n")
    });
  } catch (error) {
    console.error("Feedback email failed", error);
    return {
      status: "error",
      message: "Email could not be sent right now. Please use the direct email link below."
    };
  }

  return {
    status: "success",
    message: "Thank you. Your feedback was sent to the editorial inbox."
  };
}

function emptyToUndefined(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}
