"use server";

import { Prisma } from "@/lib/generated/prisma/client";
import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { verifyBulkDeletePassword } from "@/lib/admin-secrets";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createAirtableImportJob, runAirtableImportJob, type AirtableImportMode } from "@/lib/airtable-saint-import";
import { runAirtableMirrorImport } from "../../../scripts/import-airtable";
import { resetAirtableCmsImport } from "../../../scripts/reset-airtable-cms-import";

const protectedActionSchema = z.object({
  bulkDeletePassword: z.string().min(1),
  returnTo: z.string().startsWith("/admin/airtable").optional()
});

const queueModeSchema = z.enum(["import_missing_drafts", "import_airtable_cleanup"]);

export async function dryRunAirtableMirrorAction() {
  await requireAdminSession();
  let target = "/admin/airtable";
  try {
    const summary = await runAirtableMirrorImport({ ...getAirtableMirrorOptions(), dryRun: true });
    target = `/admin/airtable?mirrorDryRun=${encodeURIComponent(formatTableSummary(summary.tables))}`;
  } catch (error) {
    target = errorRedirect("mirrorError", error);
  }
  redirect(target as Route);
}

export async function writeAirtableMirrorAction(formData: FormData) {
  let target = "/admin/airtable";
  try {
    await requireProtectedAction(formData);
    const summary = await runAirtableMirrorImport({ ...getAirtableMirrorOptions(), dryRun: false });
    revalidatePath("/admin/airtable");
    target = `/admin/airtable?mirrorWrite=${encodeURIComponent(formatTableSummary(summary.tables))}`;
  } catch (error) {
    target = errorRedirect("mirrorError", error);
  }
  redirect(target as Route);
}

export async function resetAirtableCmsAction(formData: FormData) {
  let target = "/admin/airtable";
  try {
    const parsed = await requireProtectedAction(formData);
    await resetAirtableCmsImport({ keepJobs: formData.get("keepJobs") === "on" });
    await db.auditEvent.create({
      data: {
        userId: parsed.email,
        action: "reset_airtable_cms_import",
        entityType: "AirtableImport",
        entityId: "airtable-cms-reset",
        beforeJson: Prisma.JsonNull,
        afterJson: toInputJson({ keepJobs: formData.get("keepJobs") === "on" })
      }
    });
    revalidatePath("/admin/airtable");
    revalidatePath("/admin/saints");
    target = "/admin/airtable?reset=completed";
  } catch (error) {
    target = errorRedirect("resetError", error);
  }
  redirect(target as Route);
}

export async function queueAirtableImportAction(formData: FormData) {
  let target = "/admin/airtable";
  try {
    const parsed = await requireProtectedAction(formData);
    const mode = queueModeSchema.parse(formData.get("mode"));
    const activeJob = await db.airtableImportJob.findFirst({
      where: { status: { in: ["queued", "running"] } },
      orderBy: { createdAt: "desc" },
      select: { id: true }
    });
    if (activeJob) {
      target = "/admin/airtable?job=already-running";
    } else {
      const job = await createAirtableImportJob({
        createdByEmail: parsed.email,
        mode: mode as AirtableImportMode
      });

      runAirtableImportJob(job.id).catch((error) => {
        console.error("Airtable reingest job failed", error);
      });

      revalidatePath("/admin/airtable");
      target = `/admin/airtable?job=${encodeURIComponent(mode)}`;
    }
  } catch (error) {
    target = errorRedirect("jobError", error);
  }
  redirect(target as Route);
}

async function requireProtectedAction(formData: FormData) {
  const { email } = await requireAdminSession();
  const parsed = protectedActionSchema.parse({
    bulkDeletePassword: formData.get("bulkDeletePassword"),
    returnTo: emptyToUndefined(formData.get("returnTo"))
  });
  if (!(await verifyBulkDeletePassword(parsed.bulkDeletePassword))) {
    throw new Error("The bulk delete password was incorrect.");
  }
  return { email };
}

async function requireAdminSession() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/admin");
  return { email };
}

function getAirtableMirrorOptions() {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const token = process.env.AIRTABLE_ACCESS_TOKEN ?? process.env.AIRTABLE_PAT ?? process.env.AIRTABLE_API_KEY;
  const tables = listFromCsv(process.env.AIRTABLE_TABLES || "Saints");

  if (!baseId) throw new Error("Missing AIRTABLE_BASE_ID.");
  if (!token) throw new Error("Missing AIRTABLE_ACCESS_TOKEN, AIRTABLE_PAT, or AIRTABLE_API_KEY.");
  if (tables.length === 0) throw new Error("Missing AIRTABLE_TABLES.");

  return {
    baseId,
    token,
    tables,
    view: process.env.AIRTABLE_VIEW,
    dryRun: true
  };
}

function listFromCsv(value: string | undefined) {
  return (value ?? "").split(",").map((item) => item.trim()).filter(Boolean);
}

function formatTableSummary(tables: Record<string, number>) {
  return Object.entries(tables).map(([table, count]) => `${table}: ${count}`).join(", ");
}

function errorRedirect(key: "mirrorError" | "resetError" | "jobError", error: unknown) {
  return `/admin/airtable?${key}=${encodeURIComponent(errorMessage(error))}`;
}

function errorMessage(error: unknown) {
  if (error instanceof z.ZodError) return "The submitted form was incomplete or invalid.";
  if (error instanceof Error) return error.message;
  return "The Airtable action failed.";
}

function emptyToUndefined(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function toInputJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
