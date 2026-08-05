"use server";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { z } from "zod";
import { assertCapability } from "@/lib/admin-access";
import { db } from "@/lib/db";

export async function reapplyConflict(formData: FormData) {
  const actor = await assertCapability("edit_content");
  const parsed = z.object({ conflictId: z.string().cuid(), returnTo: z.string().startsWith("/admin/") }).parse({ conflictId: formData.get("conflictId"), returnTo: formData.get("returnTo") });
  const conflict = await db.adminEditConflict.findFirst({ where: { id: parsed.conflictId, userId: actor.id } });
  if (!conflict) redirect(parsed.returnTo as Route);
  const attempted = conflict.attemptedValue as Record<string, unknown>;
  const allowed = allow(conflict.entityType, attempted);
  const model = conflict.entityType === "saint" ? db.saint : conflict.entityType === "tradition" ? db.tradition : conflict.entityType === "place" ? db.place : db.instagramItem;
  const result = await (model.updateMany as Function)({ where: { id: conflict.entityId, version: conflict.currentVersion }, data: { ...allowed, version: { increment: 1 } } });
  if (!result.count) {
    const current = await (model.findUnique as Function)({ where: { id: conflict.entityId } });
    if (current) await db.adminEditConflict.update({ where: { id: conflict.id }, data: { currentVersion: current.version, currentValue: JSON.parse(JSON.stringify(current)) } });
    redirect(`${parsed.returnTo}?conflict=${conflict.id}` as Route);
  }
  await db.adminEditConflict.delete({ where: { id: conflict.id } });
  redirect(parsed.returnTo as Route);
}

function allow(type: string, value: Record<string, unknown>) {
  const fields = type === "saint" ? ["displayName", "canonicalName", "shortDescription", "eraLabel", "birthDateRaw", "birthYear", "birthYearEnd", "birthMonth", "birthDay", "birthDatePrecision", "samadhiDateRaw", "samadhiYear", "samadhiYearEnd", "samadhiMonth", "samadhiDay", "samadhiDatePrecision", "dateNotes", "seoTitle", "seoDescription", "status"] : type === "tradition" ? ["name", "slug", "alternateNames", "parentTraditionId", "founderSaintId", "founderDisplayName", "origin", "eraLabel", "focus", "originPlaceId", "originPlaceLabel", "shortDescription", "historyMarkdown", "longIntroductionMarkdown", "foundingAcharyaMarkdown", "keyTeachingsMarkdown", "status", "seoTitle", "seoDescription", "publishedAt"] : type === "place" ? ["name", "slug", "alternateNames", "placeKind", "placeScope", "parentStateId", "country", "overviewMarkdown", "notes"] : ["status"];
  return Object.fromEntries(fields.filter((field) => field in value).map((field) => [field, value[field]]));
}
