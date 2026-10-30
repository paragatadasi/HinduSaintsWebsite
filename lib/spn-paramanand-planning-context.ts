import type {MuseumSaintPlacement} from "./museum-proposals";

export const paramanandReview={
 sourceId:"recVN6Ty3682Uz2g4",saintId:"cms0w7izk08cz07qi2x8scsz2",
 sourceRevision:"b85fd5572b7ebdb950d32378d23ed132690590d391fbb0c3c727153325defb52",
 proposalRevision:"aab76483bb9dcda0e7da07d239c74fe4373722329879434e472bdb8e002dff15",
 housingReason:"Review the arm-support’s size, housing and which object(s) this source record covers before recording a move of the whole display."
};
export type ParamanandPlanningContext={
 effectiveDestination:string|null;destinationState:"pending"|"proposed";
 historicalDestination:{code:"37";basis:"captured_v16"};
 recommendation:{code:"26";scope:"yoga_patta_arm_support";status:"recommended"|"needs_review";wholeSourceApproved:false;basis:string};
 movementReview:{state:"object_scope_and_housing_unverified";executionHeld:true;reason:string;action:"Review object and housing";confirmationNeeded:string[]};
 pendingReason:string|null;
};
export function paramanandPlanningContext(input:{source:{sourceId:string;saintId:string|null;sourceRevision:string;identityChanged:boolean};placement?:MuseumSaintPlacement;effectiveDestination:string|null;pendingReason?:string}):ParamanandPlanningContext|null{
 if(input.source.sourceId!==paramanandReview.sourceId)return null;
 const {source,placement}=input;
 const exact=source.saintId===paramanandReview.saintId&&!source.identityChanged&&placement?.saintId===paramanandReview.saintId&&placement.sourceRecordId===paramanandReview.sourceId&&
  !placement.linkIssue&&!placement.placementState?.startsWith("Conflicting")&&!placement.arrangementNeedsReview;
 const unchanged=exact&&source.sourceRevision===paramanandReview.sourceRevision&&placement.arrangement?.proposalRevision===paramanandReview.proposalRevision;
 const destination=exact?input.effectiveDestination:null;
 return {effectiveDestination:destination,destinationState:destination?"proposed":"pending",historicalDestination:{code:"37",basis:"captured_v16"},
  recommendation:{code:"26",scope:"yoga_patta_arm_support",status:unchanged?"recommended":"needs_review",wholeSourceApproved:false,
   basis:"29–30 October 2026 photo follow-up: Puri arm-support recommendation only. The source wording and photograph do not establish a separate walking staff or multiple objects."},
  movementReview:{state:"object_scope_and_housing_unverified",executionHeld:true,reason:paramanandReview.housingReason,action:"Review object and housing",confirmationNeeded:[
   "Confirm whether this exact source record covers only the pictured complete yoga-patta arm-support, or identify any additional objects.",
   "Confirm the object's size, housing and suitability for the recommended display.",
   "Report the current physical location separately; an accepted recommendation is not a move confirmation."
  ]},pendingReason:exact?(input.pendingReason??null):"Current source identity needs reconciliation."};
}
