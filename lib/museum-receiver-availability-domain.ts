import {createHash} from "node:crypto";
import {z} from "zod";
import {MuseumMoveSessionError} from "./museum-move-session-domain";

export const receiverGuideContext=z.object({guideVersion:z.string().min(1).max(200),contentDigest:z.string().regex(/^[a-f0-9]{64}$/),assignmentDigest:z.string().regex(/^[a-f0-9]{64}$/)}).strict();
export const receiverAvailabilityInput=z.object({action:z.literal("receiver.availability"),museumId:z.literal("museum-spn"),clientRequestId:z.string().uuid(),guideContext:receiverGuideContext,vitrine:z.string().min(1).max(20),expectedRevision:z.string().regex(/^[a-f0-9]{64}$/),expectedPreparationVersion:z.number().int().nonnegative(),availableSpaceAcknowledged:z.literal(true)}).strict();
type Row={sourceId:string;sourceRevision:string;currentRevision:string;currentVersion:number;current:{kind:string;code:string}|null;currentBasis:string;currentConfirmed?:{confirmedAt:string}|null};
export type ReceiverAvailability={guideContext:z.infer<typeof receiverGuideContext>;vitrine:string;occupants:{sourceId:string;currentRevision:string;basis:string;confirmedAt:string|null}[];incoming:{sourceId:string;sourceRevision:string;currentRevision:string;currentVersion:number}[]};
const digest=(value:unknown)=>createHash("sha256").update(JSON.stringify(value)).digest("hex");
export function receiverAvailabilitySnapshot(guideContext:ReceiverAvailability["guideContext"],vitrine:string,rows:Row[],incomingIds:string[]){
 const occupants=rows.filter(r=>r.current?.kind==="vitrine"&&r.current.code===vitrine).map(r=>({sourceId:r.sourceId,currentRevision:r.currentRevision,basis:r.currentBasis,confirmedAt:r.currentConfirmed?.confirmedAt??null})).sort((a,b)=>a.sourceId.localeCompare(b.sourceId));
 const incoming=rows.filter(r=>incomingIds.includes(r.sourceId)).map(r=>({sourceId:r.sourceId,sourceRevision:r.sourceRevision,currentRevision:r.currentRevision,currentVersion:r.currentVersion})).sort((a,b)=>a.sourceId.localeCompare(b.sourceId));
 const availability={guideContext,vitrine,occupants,incoming};
 return {...availability,revision:digest(availability)};
}
export function receiverAvailabilityValid(saved:ReceiverAvailability,recordedAt:string,current:ReturnType<typeof receiverAvailabilitySnapshot>){
 const roster=(rows:ReceiverAvailability["incoming"])=>rows.map(({sourceId,sourceRevision})=>({sourceId,sourceRevision}));
 if(saved.vitrine!==current.vitrine||JSON.stringify(saved.guideContext)!==JSON.stringify(current.guideContext)||JSON.stringify(roster(saved.incoming))!==JSON.stringify(roster(current.incoming)))return false;
 if(saved.incoming.some(old=>{const row=current.incoming.find(r=>r.sourceId===old.sourceId);return !row||(row.currentRevision!==old.currentRevision&&!(row.currentVersion===old.currentVersion+1&&current.occupants.some(o=>o.sourceId===row.sourceId)));}))return false;
 if(saved.occupants.some(old=>!current.occupants.some(row=>row.sourceId===old.sourceId&&row.currentRevision===old.currentRevision)))return false;
 return current.occupants.every(row=>saved.occupants.some(old=>old.sourceId===row.sourceId)||(current.incoming.some(incoming=>incoming.sourceId===row.sourceId)&&row.basis==="confirmed"&&row.confirmedAt!==null&&Date.parse(row.confirmedAt)>=Date.parse(recordedAt)))&&Number.isFinite(Date.parse(recordedAt));
}
export function assertReceiverAvailabilityRevision(expectedRevision:string,expectedVersion:number,current:{revision:string;expectedPreparationVersion:number}){
 if(expectedRevision!==current.revision||expectedVersion!==current.expectedPreparationVersion)throw new MuseumMoveSessionError(409,"The contents, proposals or space acknowledgement changed. Refresh this vitrine and check the available space again.");
}
export function assertReceiverReadiness(states:{vitrine:string;guideVersion:string;valid:boolean;recordedAt:string}[],guideVersion:string,codes:string[],clearances:{vitrine:string;guideVersion:string;recordedAt:string}[]){
 if(states.some(state=>state.guideVersion===guideVersion&&codes.includes(state.vitrine)&&!state.valid&&!clearances.some(clear=>clear.vitrine===state.vitrine&&clear.guideVersion===guideVersion&&Date.parse(clear.recordedAt)>=Date.parse(state.recordedAt))))throw new MuseumMoveSessionError(409,"The available-space acknowledgement is no longer current. Refresh this vitrine and confirm space again before placing incoming relics.");
}
