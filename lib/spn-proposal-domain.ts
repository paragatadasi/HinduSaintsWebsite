import {createHash} from "node:crypto";
import {z} from "zod";
import type {MuseumSaintPlacement} from "./museum-proposals";
import {arrangementControl,type SavedArrangement} from "./museum-arrangement-domain";

const digest=(value:unknown)=>createHash("sha256").update(JSON.stringify(value)).digest("hex");
export const spnProposalInput=z.object({
 saintId:z.string().cuid(),revision:z.string().regex(/^[a-f0-9]{64}$/),
 section:z.string().trim().min(1).max(200),tier:z.enum(["Featured","Secondary","Tertiary"]),
 familyKey:z.string().max(300),reason:z.string().trim().min(1).max(4000)
});
export const spnProposalDecision=z.object({
 baselineRevision:z.string().regex(/^[a-f0-9]{64}$/),placementId:z.string(),saintId:z.string(),
 section:z.string(),tier:z.enum(["Featured","Secondary","Tertiary"]),familyKey:z.string(),familyLabel:z.string(),reason:z.string()
});
export type SpnProposalDecision=z.infer<typeof spnProposalDecision>;
export type SpnProposalReview={eventId:string;state:"applied"|"needs_review";reason:string;baselineRevision:string;baselineFamilyKey?:string};
export function spnBaselineRevision(row:MuseumSaintPlacement){
 return digest({id:row.id,saintId:row.saintId,sourceRecordId:row.sourceRecordId,section:row.section,tier:row.tier,
  familyId:row.familyId,curatorialFamily:row.curatorialFamily,reviewed:row.proposalReviewed,
  state:row.placementState,proposalRevision:row.arrangement?.proposalRevision});
}
export function spnReviewRevision(row:MuseumSaintPlacement){
 return digest({baseline:spnBaselineRevision(row),decision:row.spnProposal,arrangement:row.arrangement?.revision});
}
export function projectSpnProposal(row:MuseumSaintPlacement,event:{id:string;afterJson:unknown},saved:SavedArrangement|undefined):MuseumSaintPlacement{
 const parsed=spnProposalDecision.safeParse(event.afterJson);
 if(!parsed.success)return {...row,spnProposal:{eventId:event.id,state:"needs_review",reason:"The saved SPN decision needs review.",baselineRevision:spnBaselineRevision(row)}};
 const decision=parsed.data;
 const valid=decision.placementId===row.id&&decision.saintId===row.saintId&&decision.baselineRevision===spnBaselineRevision(row);
 const review:SpnProposalReview={eventId:event.id,state:valid?"applied":"needs_review",reason:decision.reason,baselineRevision:decision.baselineRevision,baselineFamilyKey:row.curatorialFamily||row.familyId};
 if(!valid)return {...row,spnProposal:review};
 const next: MuseumSaintPlacement={...row,section:decision.section,tier:decision.tier,
  familyId:decision.familyKey,curatorialFamily:decision.familyKey,groupLabel:decision.familyLabel,
  proposalReviewed:true,placementState:"Confirmed",spnProposal:review};
 if(decision.familyKey!==(row.curatorialFamily||row.familyId))next.displayMembership=undefined;
 if(row.arrangement)next.arrangement=arrangementControl(next,saved,{baseline:row.arrangement.proposalRevision,spnDecision:event.id});
 return next;
}
