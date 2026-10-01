import { z } from "zod";

// Private card contract. Unknown placement is never interpreted as vitrine zero.
export type MuseumCollectionCardItem = {
  id: string; label: string; inventoryCode: string | null;
  reviewStatus: "needs_review" | "verified";
  catalogMuseum: { id: string; name: string; slug: string };
  location: null | {
    id: string; museumId: string; museumName: string; museumSlug: string;
    code: string; label: string; kind: string; room: string | null;
  };
};
export const collectionObservationSchema = z.object({
  mappingVersion: z.string().trim().min(1).max(100),
  label: z.string().trim().min(1).max(500),
  inventoryCode: z.string().trim().min(1).max(200).nullable(),
  saintIds: z.array(z.string().min(1).max(100)).max(100),
  location: z.object({
    code: z.string().trim().min(1).max(200),
    label: z.string().trim().min(1).max(500),
    kind: z.enum(["room", "vitrine", "shelf", "storage", "other"]),
    room: z.string().trim().max(200).nullable()
  }).nullable()
}).strict();
export type CollectionObservation = z.infer<typeof collectionObservationSchema>;
export function stableCollectionJson(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(stableCollectionJson).join(",") + "]";
  if (value && typeof value === "object") return "{" + Object.entries(value)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => JSON.stringify(key) + ":" + stableCollectionJson(v)).join(",") + "}";
  return JSON.stringify(value) ?? "null";
}
