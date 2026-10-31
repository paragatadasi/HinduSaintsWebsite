import {createHash} from "node:crypto";
import {z} from "zod";
import {MuseumMoveSessionError} from "./museum-move-session-domain";
import {historicalStagingRecord} from "./museum-historical-staging-domain";
import {spnCaseExecutionHold} from "./museum-case-execution-holds";
import type {CompanionRow} from "./spn-move-guide";

export const optionalContentsVitrines=["1","4","11","23","36","45","73"];
export const caseContentsStaging=z.object({vitrine:z.string().min(1).max(20),expectedRevision:z.string().regex(/^[a-f0-9]{64}$/),selectedContentsPhysicallyStaged:z.literal(true),confirmedTargetPlacementsPreserved:z.literal(true)}).strict();
const reportDate=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value=>{const date=new Date(value+"T12:00:00Z");return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;});
export const caseStagingReconciliation=z.object({action:z.literal("case.staging.reconcile"),museumId:z.literal("museum-spn"),clientRequestId:z.string().uuid(),vitrine:z.string().min(1).max(20),preparationReceiptId:z.string().min(1).max(200),expectedRevision:z.string().regex(/^[a-f0-9]{64}$/),records:z.array(historicalStagingRecord).min(1).max(200),reportedDate:reportDate,historicalClearanceAcknowledged:z.literal(true),currentStagingAcknowledged:z.literal(true)}).strict();
export type CasePreparationEvidence={receiptId:string;vitrine:string;prepared:true;recordedAt:string;physicalMoveClaim:false;emptyCaseClaim:false};
export function caseContentsPreview(rows:CompanionRow[],destinations:{sourceId:string;vitrine:string}[],vitrine:string,mode:"selected_contents"|"historical",preparation?:CasePreparationEvidence){
 if(!optionalContentsVitrines.includes(vitrine))throw new MuseumMoveSessionError(400,"Use this vitrine's existing clearing or item workflow.");
 const eligible:(z.infer<typeof historicalStagingRecord>&{name:string;from:NonNullable<CompanionRow["current"]>})[]=[],blocked:{sourceId:string;name:string;reason:string}[]=[],preserved:string[]=[];
 const byId=new Map(destinations.map(row=>[row.sourceId,row.vitrine]));
 for(const row of rows){
  if(mode==="historical"&&row.currentBasis==="confirmed"&&(row.original?.code===vitrine||row.current?.kind==="vitrine"&&row.current.code===vitrine)){preserved.push(row.sourceId);continue;}
  if(row.current?.kind!=="vitrine"||row.current.code!==vitrine)continue;
  if(row.currentBasis==="confirmed"&&(!byId.has(row.sourceId)||byId.get(row.sourceId)===vitrine)){preserved.push(row.sourceId);continue;}
  const reason=spnCaseExecutionHold(vitrine)||(row.identityChanged?"The source identity changed.":row.verifiedItemIds.length?"Use the verified inventory item workflow.":row.fixedHousing?"Use the fixed-display workflow.":row.componentPlacement?"Use the scoped component workflow.":row.movementBlockedReason)||(mode==="historical"&&(row.currentBasis!=="source"||row.original?.kind!=="vitrine"||row.original.code!==vitrine)?"The historical source origin needs review.":null);
  if(reason){blocked.push({sourceId:row.sourceId,name:row.name,reason});continue;}
  eligible.push({sourceId:row.sourceId,saintId:row.saintId,name:row.name,from:row.current,expectedCurrentRevision:row.currentRevision,expectedSourceRevision:row.sourceRevision,expectedLocationVersion:row.currentVersion});
 }
 eligible.sort((a,b)=>a.sourceId.localeCompare(b.sourceId));blocked.sort((a,b)=>a.sourceId.localeCompare(b.sourceId));preserved.sort();
 const revision=createHash("sha256").update(JSON.stringify({vitrine,mode,preparation,eligible,blocked,preserved})).digest("hex");
 return {museumId:"museum-spn" as const,mode,vitrine,revision,eligible,blocked,preservedSourceIds:preserved,preservedConfirmedCount:preserved.length,alreadyStagedCount:rows.filter(r=>r.original?.kind==="vitrine"&&r.original.code===vitrine&&r.current?.kind==="table"&&r.current.code==="staging-area").length,preparation:preparation??null};
}
export function assertSelectedCaseContents(records:z.infer<typeof historicalStagingRecord>[],revision:string,preview:ReturnType<typeof caseContentsPreview>){
 const ids=new Set(records.map(row=>row.sourceId));
 if(!records.length||ids.size!==records.length||revision!==preview.revision||records.some(record=>{const match=preview.eligible.find(row=>row.sourceId===record.sourceId);return !match||Object.entries(record).some(([key,value])=>key in match&&match[key as keyof typeof match]!==value);}))
  throw new MuseumMoveSessionError(409,"These contents or destinations changed. Reload the preview and check the selected records again.");
}
