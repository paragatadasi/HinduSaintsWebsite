"use server";

import { Prisma } from "@/lib/generated/prisma/client";
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

const queueModeSchema = z.enum(["import_missing_drafts", "import_guru_relationships", "import_airtable_cleanup"]);

export async function dryRunAirtableMirrorAction() {
  await requireAdminSession();
  const summary = await runAirtableMirrorImport({ ...getAirtableMirrorOptions(), dryRun: true });
  redirect(`/admin/airtable?mirrorDryRun=${encodeURIComponent(formatTableSummary(summary.tables))}`);
}

export async function writeAirtableMirrorAction(formData: FormData) {
  await requireProtectedAction(formData);
  const summary = await runAirtableMirrorImport({ ...getAirtableMirrorOptions(), dryRun: false });
  revalidatePath("/admin/airtable");
  redirect(`/admin/airtable?mirrorWrite=${encodeURIComponent(formatTableSummary(summary.tables))}`);
}

export async function resetAirtableCmsAction(formData: FormData) {
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
  redirect("/admin/airtable?reset=completed");
}

export async function queueAirtableImportAction(formData: FormData) {
  const parsed = await requireProtectedAction(formData);
  const mode = queueModeSchema.parse(formData.get("mode"));
  const activeJob = await db.airtableImportJob.findFirst({
    where: { status: { in: ["queued", "running"] } },
    orderBy: { createdAt: "desc" },
    select: { id: true }
  });
  if (activeJob) redirect("/admin/airtable?job=already-running");

  const job = await createAirtableImportJob({
    createdByEmail: parsed.email,
    mode: mode as AirtableImportMode
  });

  runAirtableImportJob(job.id).catch((error) => {
    console.error("Airtable reingest job failed", error);
  });

  revalidatePath("/admin/airtable");
  redirect(`/admin/airtable?job=${encodeURIComponent(mode)}`);
}

async function requireProtectedAction(formData: FormData) {
  const { email } = await requireAdminSession();
  const parsed = protectedActionSchema.parse({
    bulkDeletePassword: formData.get("bulkDeletePassword"),
    returnTo: formData.get("returnTo")
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

function toInputJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
