import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { hasCapability } from "@/lib/permissions";
import { getUserDisplayName, userDisplayNameSelect } from "@/lib/user-display-name";

const schema = z.object({ entityType: z.enum(["saint", "tradition", "place", "instagram_item"]), entityId: z.string().cuid(), mode: z.enum(["viewing", "editing"]).default("viewing") });

export async function GET(request: Request) {
  const user = await getAdminUser();
  if (!user?.active || !hasCapability(user.roles, "view_content")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url); const parsed = schema.omit({ mode: true }).safeParse({ entityType: url.searchParams.get("entityType"), entityId: url.searchParams.get("entityId") });
  if (!parsed.success) return NextResponse.json({ error: "Invalid presence target" }, { status: 400 });
  const rows = await db.adminPresence.findMany({ where: { ...parsed.data, expiresAt: { gt: new Date() } }, include: { user: { select: { id: true, ...userDisplayNameSelect } } }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ users: rows.map((row) => ({ id: row.user.id, label: getUserDisplayName(row.user), mode: row.mode })) });
}

export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user?.active || !hasCapability(user.roles, "view_content")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid presence target" }, { status: 400 });
  const mode = parsed.data.mode === "editing" && hasCapability(user.roles, "edit_content") ? "editing" : "viewing";
  const expiresAt = new Date(Date.now() + 90_000);
  await db.adminPresence.upsert({ where: { entityType_entityId_userId: { entityType: parsed.data.entityType, entityId: parsed.data.entityId, userId: user.id } }, create: { ...parsed.data, mode, userId: user.id, expiresAt }, update: { mode, expiresAt } });
  await db.adminPresence.deleteMany({ where: { expiresAt: { lt: new Date(Date.now() - 300_000) } } });
  return NextResponse.json({ ok: true });
}
