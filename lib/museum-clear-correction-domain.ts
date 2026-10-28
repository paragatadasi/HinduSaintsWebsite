import { z } from "zod";
import { physicalConfirmationReceipt, type UndoRow } from "./museum-physical-undo-domain";
import { sameMoveLocation } from "./museum-move-session-domain";
const correctionRecord = z.object({sourceId:z.string().min(1).max(200),saintId:z.string().nullable(),
 expectedCurrentRevision:z.string().regex(/^[a-f0-9]{64}$/),expectedSourceRevision:z.string().regex(/^[a-f0-9]{64}$/),expectedLocationVersion:z.number().int().nonnegative()}).strict();
export const clearCorrectionInput=z.object({action:z.literal("clear.correct"),museumId:z.literal("museum-spn"),clientRequestId:z.string().uuid(),
 receiptId:z.string().min(1).max(200),records:z.array(correctionRecord).min(1).max(200),mistakenClearAcknowledged:z.literal(true)}).strict();
type Row=UndoRow & {name:string;currentRevision:string;sourceRevision:string};
export function clearCorrectionOffers(rows:Row[],events:{id:string;afterJson:unknown}[]) {
 return events.flatMap(event=>{
  const parsed=physicalConfirmationReceipt.safeParse(event.afterJson);
  if(!parsed.success || !parsed.data.clearedVitrines?.length)return [];
  const data=parsed.data;
  return data.clearedVitrines!.flatMap(vitrine=>{
   const records=data.moves.flatMap(move=>{
    const prior=move.previousState,row=rows.find(r=>r.sourceId===move.sourceId);
    if(!row || row.identityChanged || row.verifiedItemIds.length || !prior || prior.basis!=="confirmed" || !prior.effectiveConfirmedAt ||
      prior.location?.kind!=="vitrine" || prior.location.code!==vitrine || !sameMoveLocation(prior.location,move.previous) ||
      move.location.kind!=="table" || move.location.code!=="staging-area" || row.currentBasis!=="confirmed" ||
      row.currentVersion!==move.version || row.currentConfirmed?.confirmedAt!==data.recordedAt || !sameMoveLocation(row.current,move.location) ||
      row.saintId!==move.saintId || row.sourceKey!==move.sourceKey || !sameMoveLocation(row.original,move.original) ||
      data.moves.filter(m=>m.sourceId===move.sourceId).length!==1)return [];
    return [{sourceId:row.sourceId,saintId:row.saintId,name:row.name,expectedCurrentRevision:row.currentRevision,
      expectedSourceRevision:row.sourceRevision,expectedLocationVersion:row.currentVersion,previous:prior.location,previousConfirmedAt:prior.effectiveConfirmedAt}];
   });
   return records.length ? [{receiptId:event.id,vitrine,records,excludedCount:data.moves.length-records.length}] : [];
  });
 });
}

export function clearCorrectionShelfApplies(note:{saintId:string|null;vitrine:string;physicalVersion:number},
 change:{saintId:string|null;previous:{code:string};expectedLocationVersion:number}) {
 return note.saintId===change.saintId && note.vitrine===change.previous.code && note.physicalVersion===change.expectedLocationVersion-1;
}
