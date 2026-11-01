import { z } from "zod";
import { moveLocation, sameMoveLocation } from "./museum-move-session-domain";
import type { MoveLocation } from "./museum-move-session-domain";
export const physicalUndoInput = z.object({ action: z.literal("undo"), museumId: z.literal("museum-spn"),
  clientRequestId: z.string().uuid(), receiptId: z.string().min(1).max(200), sourceId: z.string().min(1).max(200),
  saintId: z.string().nullable(), expectedCurrentRevision: z.string().regex(/^[a-f0-9]{64}$/),
  expectedSourceRevision: z.string().regex(/^[a-f0-9]{64}$/), expectedLocationVersion: z.number().int().nonnegative(),
  mistakenCheckAcknowledged: z.literal(true) }).strict();
const previousState = z.object({ basis: z.enum(["confirmed","source","unknown"]), location: moveLocation.nullable(),
  effectiveConfirmedAt: z.string().datetime().nullable() }).strict().refine(s => s.basis !== "confirmed" || Boolean(s.location && s.effectiveConfirmedAt));
const move = z.object({ sourceId:z.string(),sourceKey:z.string().nullable(),saintId:z.string().nullable(),
  original:moveLocation.nullable(),previous:moveLocation.nullable(),location:moveLocation,version:z.number().int().positive(),
  previousState:previousState.optional() });
export const physicalConfirmationReceipt = z.object({ museumId:z.literal("museum-spn"),recordedAt:z.string().datetime(),moves:z.array(move),
  clearedVitrines:z.array(z.string()).optional() });
export type UndoRow = {sourceId:string;sourceKey:string|null;saintId:string|null;original:MoveLocation|null;current:MoveLocation|null;
  currentBasis:string;currentVersion:number;currentConfirmed?:{confirmedAt:string}|null;identityChanged:boolean;
  verifiedItemIds:string[];legacyConfirmed?:unknown};
export type UndoOffer = {available:boolean;receiptId:string|null;previous:MoveLocation|null;previousBasis:string|null;
  previousConfirmedAt:string|null;reason:string|null};
type ParsedReceipt = {event:{id:string;afterJson:unknown};data:z.infer<typeof physicalConfirmationReceipt>;matches:z.infer<typeof move>[]};
// Callers pass the same receipt list for every row. Parse it once and index it by source, keeping receipt order,
// instead of re-validating every receipt for every row.
const receiptIndexes=new WeakMap<object,Map<string,ParsedReceipt[]>>();
function receiptsForSource(events:{id:string;afterJson:unknown}[],sourceId:string):ParsedReceipt[] {
  let index=receiptIndexes.get(events);
  if(!index){
    index=new Map();
    for(const event of events){
      const parsed=physicalConfirmationReceipt.safeParse(event.afterJson);if(!parsed.success)continue;
      for(const id of new Set(parsed.data.moves.map(m=>m.sourceId))){
        const entry={event,data:parsed.data,matches:parsed.data.moves.filter(m=>m.sourceId===id)};
        index.set(id,[...(index.get(id)??[]),entry]);
      }
    }
    receiptIndexes.set(events,index);
  }
  return index.get(sourceId)??[];
}

export function physicalUndoOffer(row:UndoRow, events:{id:string;afterJson:unknown}[]):UndoOffer {
  const unavailable = (reason:string):UndoOffer => ({available:false,receiptId:null,previous:null,previousBasis:null,previousConfirmedAt:null,reason});
  if(row.identityChanged) return unavailable("This source changed. Review its inventory history.");
  if(row.currentBasis!=="confirmed") return unavailable("There is no current placement check to undo.");
  for(const {event,data,matches} of receiptsForSource(events,row.sourceId)) {
    if(matches.length!==1)continue; const m=matches[0];
    if(m.version!==row.currentVersion || data.recordedAt!==row.currentConfirmed?.confirmedAt || !sameMoveLocation(m.location,row.current))continue;
    if(m.saintId!==row.saintId || m.sourceKey!==row.sourceKey || !sameMoveLocation(m.original,row.original)) return unavailable("The source evidence changed since this check. Review its history.");
    if(data.clearedVitrines?.length) return unavailable("This check belongs to a whole-vitrine clearing event. Review that event separately.");
    const prior=m.previousState ?? (m.version===1 && !row.legacyConfirmed && sameMoveLocation(m.previous,row.original)
      ? {basis:row.original?"source" as const:"unknown" as const,location:m.previous,effectiveConfirmedAt:null}:null);
    if(!prior)return unavailable("This older check does not retain enough prior-state evidence for a safe undo.");
    return {available:true,receiptId:event.id,previous:prior.location,previousBasis:prior.basis,previousConfirmedAt:prior.effectiveConfirmedAt,reason:null};
  }
  return unavailable("No matching current confirmation receipt was found. Review its history.");
}
