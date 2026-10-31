import {z} from "zod";
import {MuseumMoveSessionError} from "./museum-move-session-domain";

export const retainedCaseClearanceAcknowledgement=z.object({vitrine:z.literal("64"),allOriginPiecesIncludingWalkingSticksStaged:z.literal(true)}).strict();
type ClearInput={retainedCaseClearanceAcknowledgement?:z.infer<typeof retainedCaseClearanceAcknowledgement>;clearedVitrines?:string[];initialCaseClearAcknowledged?:true;guideContext?:unknown;alternativeDecision?:unknown;curatorAddition?:unknown;records:{sourceId:string;to:{kind:string;code:string}}[]};
export function retainedCaseClearanceAllowed(input:ClearInput){
 return Boolean(input.retainedCaseClearanceAcknowledgement?.vitrine==="64"&&input.retainedCaseClearanceAcknowledgement.allOriginPiecesIncludingWalkingSticksStaged&&
  input.initialCaseClearAcknowledged&&input.clearedVitrines?.length===1&&input.clearedVitrines[0]==="64"&&
  !input.guideContext&&!input.alternativeDecision&&!input.curatorAddition&&input.records.length&&input.records.every(r=>r.to.kind==="table"&&r.to.code==="staging-area"));
}
export function assertRetainedCaseClearance(input:ClearInput,rows?:{sourceId:string;current:{kind:string;code:string}|null}[]){
 if(!input.retainedCaseClearanceAcknowledgement)return;
 if(!retainedCaseClearanceAllowed(input))throw new MuseumMoveSessionError(400,"Confirm only the Vitrine 64 contents, including walking sticks housed there, moved to staging.");
 if(rows&&input.records.some(record=>!rows.some(row=>row.sourceId===record.sourceId&&row.current?.kind==="vitrine"&&row.current.code==="64")))
  throw new MuseumMoveSessionError(409,"The Vitrine 64 contents changed. Reload before confirming its clearing.");
}
