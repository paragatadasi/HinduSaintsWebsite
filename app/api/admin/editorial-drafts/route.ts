import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin-access";
import {
  clearEditorialDraft,
  editorialDraftSaveSchema,
  isEditorialDraftSection,
  saveEditorialDraft
} from "@/lib/editorial-drafts";
import { hasCapability } from "@/lib/permissions";

const discardSchema = z.object({
  entityType: z.enum(["saint", "tradition", "place", "instagram_item"]),
  entityId: z.string().cuid(),
  section: z.string().min(1).max(80)
});

export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user?.active) return NextResponse.json({ error: "session_expired" }, { status: 401 });
  if (!hasCapability(user.roles, "edit_content")) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const parsed = editorialDraftSaveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !isEditorialDraftSection(parsed.data.entityType, parsed.data.section)) {
    return NextResponse.json({ error: "invalid_draft", issues: parsed.success ? undefined : parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const result = await saveEditorialDraft(user.id, parsed.data);
    if (result.status === "draft_conflict" || result.status === "live_conflict") {
      return NextResponse.json(result, { status: 409 });
    }
    if (result.status === "not_found") return NextResponse.json(result, { status: 404 });
    return NextResponse.json(result);
  } catch (error) {
    const eventId = crypto.randomUUID();
    console.error("Editorial draft autosave failed", { eventId, userId: user.id, entityType: parsed.data.entityType, entityId: parsed.data.entityId, section: parsed.data.section, error });
    return NextResponse.json({ error: "save_failed", eventId }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await getAdminUser();
  if (!user?.active) return NextResponse.json({ error: "session_expired" }, { status: 401 });
  if (!hasCapability(user.roles, "edit_content")) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const parsed = discardSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !isEditorialDraftSection(parsed.data.entityType, parsed.data.section)) {
    return NextResponse.json({ error: "invalid_draft" }, { status: 400 });
  }

  await clearEditorialDraft(parsed.data.entityType, parsed.data.entityId, parsed.data.section);
  return NextResponse.json({ status: "discarded" });
}
