import {z} from "zod";
import type {CompanionRow} from "./spn-move-guide";
import {MuseumMoveSessionError} from "./museum-move-session-domain";

export type FinalReviewProposal={sourceId:string;saintId:string|null;sourceRevision:string;vitrine:string;shelf:string|null;version:number;reviewVersion:number;updatedAt:string;componentScope?:NonNullable<CompanionRow["componentPlacement"]>["scope"]};
export type FinalReviewDecision={sourceId:string;saintId:string|null;sourceRevision:string;planVersion:number;vitrine:string|null;shelf:string|null;plannedAt:string|null;decision:FinalReviewRecord["decision"];decisionAt:string|null;decisionNote:string|null;finallyReviewed?:boolean};
export type FinalReviewFlag={kind:"missing"|"other";note:string|null;status:"open"|"resolved"};
export type FinalReviewRecord={
 sourceId:string;saintId:string|null;sourceRevision:string;
 name:string;tier:string;section:string;region:string;city:string;relicDescription:string;
 physical:CompanionRow;
 effectiveDestination:{vitrine:string;shelf:string|null;basis:"confirmed"|"final_review"|"proposal"}|null;
 reviewVersion:number;flag:FinalReviewFlag|null;addressed:boolean;finallyReviewed:boolean;reviewedAt:string|null;
 decision:"pending"|"declined"|"not_on_display"|"deferred";
};
export type FinalReviewSnapshot={museumId:"museum-spn";revision:string;records:FinalReviewRecord[];availableVitrines:string[];complete?:boolean;removedSourceIds?:string[]};
const common={museumId:z.literal("museum-spn"),sourceId:z.string().min(1).max(200),saintId:z.string().nullable(),expectedSourceRevision:z.string().regex(/^[a-f0-9]{64}$/),expectedReviewVersion:z.number().int().nonnegative(),clientRequestId:z.string().uuid()};
const note=z.string().trim().max(2000).optional();
export const finalReviewInput=z.discriminatedUnion("action",[
 z.object({...common,action:z.literal("proposal.set"),vitrine:z.string().trim().min(1).max(20),shelf:z.string().trim().max(100).optional(),expectedCurrentRevision:z.string().regex(/^[a-f0-9]{64}$/),expectedLocationVersion:z.number().int().nonnegative()}).strict(),
 z.object({...common,action:z.literal("review.confirm"),vitrine:z.string().trim().min(1).max(20),expectedCurrentRevision:z.string().regex(/^[a-f0-9]{64}$/),expectedLocationVersion:z.number().int().nonnegative()}).strict(),
 z.object({...common,action:z.literal("review.clear"),expectedCurrentRevision:z.string().regex(/^[a-f0-9]{64}$/),expectedLocationVersion:z.number().int().nonnegative()}).strict(),
 z.object({...common,action:z.literal("flag.set"),kind:z.enum(["missing","other"]),note}).strict(),
 z.object({...common,action:z.literal("flag.resolve")}).strict(),
 z.object({...common,action:z.literal("decision.set"),decision:z.enum(["declined","not_on_display","deferred"]),note}).strict()
]);
export type FinalReviewInput=z.infer<typeof finalReviewInput>;
export type FinalReviewMutationResult={record:FinalReviewRecord;receipt:{id:string};replayed:boolean;revision:string};
export function assertFinalReviewVersion(expected:number,actual:number){
 if(expected!==actual)throw new MuseumMoveSessionError(409,"This record was reviewed elsewhere. Reload its latest decision.");
}
export function finalReviewAddressed(row:CompanionRow,destination:string|null,decision:FinalReviewRecord["decision"]){
 if(decision==="declined"||decision==="not_on_display")return true;
 if(decision==="deferred")return false;
 const location=row.componentPlacement?.location??row.current;
 return (!!row.componentPlacement||row.currentBasis==="confirmed")&&location?.kind==="vitrine"&&location.code===destination;
}

export function effectiveFinalReviewDecision(state:{decision:string;decisionAt:unknown}|null,prior:FinalReviewRecord["decision"]):FinalReviewRecord["decision"]{
 const decision=state?.decisionAt?state.decision:prior;
 return ["pending","declined","not_on_display","deferred"].includes(decision)?decision as FinalReviewRecord["decision"]:"pending";
}

export type ReviewBinding={flagKind?:string|null;flagStatus?:string|null;decision?:string;reviewedAt:Date|null;reviewedVitrine:string|null;reviewedPlanVersion:number|null;reviewedPhysicalVersion:number|null;reviewedComponentRevision:string|null;planVersion:number};
export function isFinallyReviewed(row:CompanionRow,destination:string|null,state:ReviewBinding|null){
 if(!state?.reviewedAt||state.flagKind==="missing"&&state.flagStatus==="open"||state.decision&&state.decision!=="pending"||row.identityChanged||!destination||state.reviewedVitrine!==destination||state.reviewedPlanVersion!==state.planVersion)return false;
 const location=row.componentPlacement?.location??row.current;
 return (!!row.componentPlacement||row.currentBasis==="confirmed")&&location?.kind==="vitrine"&&location.code===destination&&state.reviewedPhysicalVersion===row.currentVersion&&state.reviewedComponentRevision===(row.componentPlacement?.revision??null);
}
