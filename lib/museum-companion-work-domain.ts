import { z } from "zod";
import { MuseumMoveSessionError } from "./museum-move-session-domain";
const base = { museumId: z.literal("museum-spn"), clientRequestId: z.string().uuid() };
const source = { sourceId: z.string().min(1).max(200), saintId: z.string().nullable() };
export const companionWorkInput = z.discriminatedUnion("action", [
 z.object({ ...base, ...source, action: z.literal("task.create"), title: z.string().trim().min(1).max(500) }).strict(),
 z.object({ ...base, action: z.literal("task.complete"), taskId: z.string().min(1).max(200), expectedVersion: z.number().int().positive(), completed: z.boolean() }).strict(),
 z.object({ ...base, ...source, action: z.literal("shelf.update"), vitrine: z.string().trim().min(1).max(100), shelf: z.string().trim().max(100),
  expectedVersion: z.number().int().nonnegative(), expectedCurrentRevision: z.string().regex(/^[a-f0-9]{64}$/),
  expectedSourceRevision: z.string().regex(/^[a-f0-9]{64}$/), expectedLocationVersion: z.number().int().nonnegative() }).strict()
]);
export function assertShelfContext(row: { currentBasis: string; current: {kind:string;code:string}|null; currentVersion:number; currentRevision:string; sourceRevision:string },
 input: Extract<z.infer<typeof companionWorkInput>, {action:"shelf.update"}>) {
 if (row.currentBasis !== "confirmed" || row.current?.kind !== "vitrine" || row.current.code !== input.vitrine)
  throw new MuseumMoveSessionError(409,"Confirm this relic's vitrine before recording its final shelf.");
 if(row.currentVersion !== input.expectedLocationVersion || row.currentRevision !== input.expectedCurrentRevision || row.sourceRevision !== input.expectedSourceRevision)
  throw new MuseumMoveSessionError(409,"This relic's location or source changed. Reload before saving its shelf.");
}

export function companionShelfApplies(note: {sourceId:string;saintId:string|null;vitrine:string;physicalVersion:number},
 row: {sourceId:string;saintId:string|null;currentBasis:string;currentVersion:number;current:{kind:string;code:string}|null}) {
 return note.sourceId===row.sourceId && note.saintId===row.saintId && row.currentBasis==="confirmed" &&
  row.current?.kind==="vitrine" && note.vitrine===row.current.code && note.physicalVersion===row.currentVersion;
}
