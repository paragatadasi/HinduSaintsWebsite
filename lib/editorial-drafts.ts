import { Prisma, type AdminEntityType } from "@/lib/generated/prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";

export const EDITORIAL_DRAFT_SECTIONS = {
  saint: {
    overview: ["displayName", "canonicalName"],
    public_fields: ["eraLabel", "birthDateRaw", "samadhiDateRaw", "dateNotes", "seoTitle", "seoDescription"],
    biography: ["biographyTitle", "shortDescription", "biographyMarkdown", "intent"],
    aliases: ["aliases"]
  },
  tradition: {
    overview: ["name", "alternateNames", "parentTraditionId", "status"],
    public_fields: ["founderSaintId", "founderDisplayName", "origin", "eraLabel", "focus", "originPlaceId", "originPlaceLabel", "seoTitle", "seoDescription"],
    long_form: ["shortDescription", "foundingAcharyaMarkdown", "historyMarkdown", "keyTeachingsMarkdown", "sourcesJson", "intent"]
  },
  place: {
    overview: ["name", "alternateNames", "placeScope", "parentStateId", "localityIds", "country"],
    public_fields: ["overviewMarkdown", "notes", "intent"]
  },
  instagram_item: {}
} as const;

export type EditorialDraftEntityType = keyof typeof EDITORIAL_DRAFT_SECTIONS;
export type EditorialDraftPayload = Record<string, string | string[]>;

export type EditorialDraftSnapshot = {
  id: string;
  baseVersion: number;
  revision: number;
  payload: EditorialDraftPayload;
  updatedAt: string;
  updatedBy: string;
};

const entityTypeSchema = z.enum(["saint", "tradition", "place", "instagram_item"]);
const payloadValueSchema = z.union([
  z.string().max(25_000),
  z.array(z.string().max(2_000)).max(500)
]);
const payloadSchema = z.record(payloadValueSchema).superRefine((payload, context) => {
  if (JSON.stringify(payload).length > 100_000) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Draft content is too large to autosave." });
  }
});

export const editorialDraftSaveSchema = z.object({
  entityType: entityTypeSchema,
  entityId: z.string().cuid(),
  section: z.string().min(1).max(80),
  baseVersion: z.number().int().positive(),
  draftId: z.string().cuid().nullable().optional(),
  revision: z.number().int().positive().nullable().optional(),
  rebase: z.boolean().optional().default(false),
  payload: payloadSchema
});

export type EditorialDraftSaveInput = z.infer<typeof editorialDraftSaveSchema>;

export type EditorialDraftSaveResult =
  | { status: "saved"; draft: EditorialDraftSnapshot }
  | { status: "draft_conflict"; draft: EditorialDraftSnapshot }
  | { status: "live_conflict"; currentVersion: number }
  | { status: "not_found" };

export function isEditorialDraftSection(entityType: AdminEntityType, section: string) {
  return Object.prototype.hasOwnProperty.call(EDITORIAL_DRAFT_SECTIONS[entityType], section);
}

export function sanitizeEditorialDraftPayload(
  entityType: AdminEntityType,
  section: string,
  payload: EditorialDraftPayload
) {
  if (!isEditorialDraftSection(entityType, section)) return null;
  const allowedFields = new Set((EDITORIAL_DRAFT_SECTIONS[entityType] as Record<string, readonly string[]>)[section]);
  return Object.fromEntries(Object.entries(payload).filter(([key]) => allowedFields.has(key))) as EditorialDraftPayload;
}

export async function getEditorialDraftMap(entityType: AdminEntityType, entityId: string) {
  const drafts = await db.adminEditorialDraft.findMany({
    where: { entityType, entityId },
    include: { updatedBy: { select: { name: true, email: true } } },
    orderBy: { updatedAt: "desc" }
  });

  return new Map(drafts.map((draft) => [draft.section, toSnapshot(draft)]));
}

export async function saveEditorialDraft(
  actorId: string,
  rawInput: EditorialDraftSaveInput
): Promise<EditorialDraftSaveResult> {
  const input = editorialDraftSaveSchema.parse(rawInput);
  const payload = sanitizeEditorialDraftPayload(input.entityType, input.section, input.payload);
  if (!payload) throw new Error("Unsupported editorial draft section.");

  const currentVersion = await getEntityVersion(input.entityType, input.entityId);
  if (currentVersion == null) return { status: "not_found" };
  if (currentVersion !== input.baseVersion) return { status: "live_conflict", currentVersion };

  const existing = await db.adminEditorialDraft.findUnique({
    where: { entityType_entityId_section: { entityType: input.entityType, entityId: input.entityId, section: input.section } },
    include: { updatedBy: { select: { name: true, email: true } } }
  });

  if (existing) {
    if (input.draftId !== existing.id || input.revision !== existing.revision) {
      return { status: "draft_conflict", draft: toSnapshot(existing) };
    }
    if (existing.baseVersion !== currentVersion && !input.rebase) return { status: "live_conflict", currentVersion };

    const updated = await db.adminEditorialDraft.updateMany({
      where: { id: existing.id, revision: existing.revision, baseVersion: existing.baseVersion },
      data: { payload, baseVersion: currentVersion, updatedById: actorId, revision: { increment: 1 } }
    });
    if (!updated.count) {
      const winner = await getEditorialDraft(input.entityType, input.entityId, input.section);
      if (winner) return { status: "draft_conflict", draft: winner };
      return { status: "live_conflict", currentVersion };
    }

    const saved = await getEditorialDraft(input.entityType, input.entityId, input.section);
    if (!saved) return { status: "not_found" };
    return { status: "saved", draft: saved };
  }

  if (input.draftId || input.revision) {
    return { status: "live_conflict", currentVersion };
  }

  try {
    const created = await db.adminEditorialDraft.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId,
        section: input.section,
        payload,
        baseVersion: currentVersion,
        createdById: actorId,
        updatedById: actorId
      },
      include: { updatedBy: { select: { name: true, email: true } } }
    });
    return { status: "saved", draft: toSnapshot(created) };
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
    const winner = await getEditorialDraft(input.entityType, input.entityId, input.section);
    if (winner) return { status: "draft_conflict", draft: winner };
    throw error;
  }
}

export async function clearEditorialDraft(entityType: AdminEntityType, entityId: string, section: string) {
  if (!isEditorialDraftSection(entityType, section)) return;
  await db.adminEditorialDraft.deleteMany({ where: { entityType, entityId, section } });
}

export async function clearEditorialDraftFromForm(entityType: AdminEntityType, entityId: string, formData: FormData) {
  const section = formData.get("_draftSection");
  if (typeof section !== "string") return;
  await clearEditorialDraft(entityType, entityId, section);
}

export function draftString(draft: EditorialDraftSnapshot | undefined, key: string, fallback = "") {
  const value = draft?.payload[key];
  return typeof value === "string" ? value : fallback;
}

export function draftStrings(draft: EditorialDraftSnapshot | undefined, key: string, fallback: string[] = []) {
  const value = draft?.payload[key];
  return Array.isArray(value) ? value : fallback;
}

async function getEditorialDraft(entityType: AdminEntityType, entityId: string, section: string) {
  const draft = await db.adminEditorialDraft.findUnique({
    where: { entityType_entityId_section: { entityType, entityId, section } },
    include: { updatedBy: { select: { name: true, email: true } } }
  });
  return draft ? toSnapshot(draft) : null;
}

async function getEntityVersion(entityType: AdminEntityType, entityId: string) {
  if (entityType === "saint") return (await db.saint.findUnique({ where: { id: entityId }, select: { version: true } }))?.version;
  if (entityType === "tradition") return (await db.tradition.findUnique({ where: { id: entityId }, select: { version: true } }))?.version;
  if (entityType === "place") return (await db.place.findUnique({ where: { id: entityId }, select: { version: true } }))?.version;
  return (await db.instagramItem.findUnique({ where: { id: entityId }, select: { version: true } }))?.version;
}

function toSnapshot(draft: {
  id: string;
  baseVersion: number;
  revision: number;
  payload: Prisma.JsonValue;
  updatedAt: Date;
  updatedBy: { name: string | null; email: string };
}): EditorialDraftSnapshot {
  return {
    id: draft.id,
    baseVersion: draft.baseVersion,
    revision: draft.revision,
    payload: draft.payload as EditorialDraftPayload,
    updatedAt: draft.updatedAt.toISOString(),
    updatedBy: draft.updatedBy.name || draft.updatedBy.email
  };
}
