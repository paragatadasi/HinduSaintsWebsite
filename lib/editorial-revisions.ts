import { z } from "zod";
import type { Prisma } from "@/lib/generated/prisma/client";

export const sourceRevisionSchema = z.object({
  sourceId: z.string().cuid().optional(),
  citationKey: z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/).optional(),
  title: z.string().trim().min(1).max(300),
  sourceType: z.enum(["book", "article", "website", "scripture", "oral_tradition", "other"]),
  author: z.string().trim().max(200).optional(),
  publisher: z.string().trim().max(200).optional(),
  publicationYear: z.number().int().min(0).max(3000).optional(),
  url: z.string().trim().url().max(1000).optional(),
  note: z.string().trim().max(1000).optional()
});

export const saintNarrativeRevisionSchema = z.object({
  shortDescription: z.string().trim().max(500).optional(),
  biographyTitle: z.string().trim().min(1).max(200),
  biographyMarkdown: z.string().trim().min(1).max(20_000),
  sources: z.array(sourceRevisionSchema).max(100)
}).superRefine((revision, context) => {
  const configuredKeys = new Set(revision.sources.flatMap((source) => [source.citationKey, source.sourceId].filter((key): key is string => Boolean(key))));
  const referencedKeys = [...revision.biographyMarkdown.matchAll(/#source-ref-([a-zA-Z0-9_-]{1,128})/g)].map((match) => match[1]);
  for (const key of referencedKeys) {
    if (!configuredKeys.has(key)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Biography citations must use an associated source.", path: ["biographyMarkdown"] });
      break;
    }
  }
});

export const traditionNarrativeRevisionSchema = z.object({
  shortDescription: z.string().trim().max(500).optional(),
  foundingAcharyaMarkdown: z.string().trim().max(20_000).optional(),
  historyMarkdown: z.string().trim().max(20_000).optional(),
  keyTeachingsMarkdown: z.string().trim().max(20_000).optional(),
  sources: z.array(sourceRevisionSchema).max(100)
});

export const placeNarrativeRevisionSchema = z.object({
  overviewMarkdown: z.string().trim().max(20_000).optional()
});

export type SourceRevision = z.infer<typeof sourceRevisionSchema>;
export type SaintNarrativeRevision = z.infer<typeof saintNarrativeRevisionSchema>;
export type TraditionNarrativeRevision = z.infer<typeof traditionNarrativeRevisionSchema>;
export type PlaceNarrativeRevision = z.infer<typeof placeNarrativeRevisionSchema>;

export class EditorialRevisionConflictError extends Error {
  constructor() {
    super("The published narrative changed after this revision began.");
    this.name = "EditorialRevisionConflictError";
  }
}

export const EDITORIAL_REVISION_SECTIONS = {
  saint: "narrative",
  tradition: "narrative",
  place: "narrative"
} as const;

export function getEditorialRevisionActiveKey(entityType: keyof typeof EDITORIAL_REVISION_SECTIONS, entityId: string) {
  return `${entityType}:${entityId}:${EDITORIAL_REVISION_SECTIONS[entityType]}`;
}

export function parseSourcesJson(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string" || !raw.trim()) return [];
  return z.array(sourceRevisionSchema).max(100).parse(JSON.parse(raw));
}

export function editorialSnapshotsMatch(left: unknown, right: unknown) {
  return stableJson(left) === stableJson(right);
}

export async function resolvePublishedRevisionSource(tx: Prisma.TransactionClient, draft: SourceRevision) {
  if (draft.sourceId) {
    const existing = await tx.source.findUnique({ where: { id: draft.sourceId } });
    if (existing && editorialSnapshotsMatch({
      title: existing.title,
      sourceType: existing.sourceType,
      author: existing.author ?? undefined,
      publisher: existing.publisher ?? undefined,
      publicationYear: existing.publicationYear ?? undefined,
      url: existing.url ?? undefined
    }, {
      title: draft.title,
      sourceType: draft.sourceType,
      author: draft.author,
      publisher: draft.publisher,
      publicationYear: draft.publicationYear,
      url: draft.url
    })) return existing.id;
  }

  return (await tx.source.create({
    data: {
      title: draft.title,
      sourceType: draft.sourceType,
      author: draft.author ?? null,
      publisher: draft.publisher ?? null,
      publicationYear: draft.publicationYear ?? null,
      url: draft.url ?? null,
      notes: draft.note ?? null
    },
    select: { id: true }
  })).id;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
      .map(([key, child]) => `${JSON.stringify(key)}:${stableJson(child)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
