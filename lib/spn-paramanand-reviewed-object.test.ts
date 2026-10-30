import test from "node:test";
import assert from "node:assert/strict";
import {paramanandObjectReview as review,isReviewedParamanandArmSupport,paramanandHousingEvidence,paramanandProposalResolution,applyParamanandObjectProposal} from "./spn-paramanand-reviewed-object";
import {spnMovementBlockedReason,assertSpnMovementAllowed} from "./spn-movement-holds";
import {isComponentClearance} from "./museum-component-clearance-domain";
import type {MuseumSaintPlacement} from "./museum-proposals";
import type {ProposalObservation} from "./spn-room-proposal";
const source={sourceId:review.sourceId,saintId:review.saintId,sourceRevision:review.sourceRevision,housingEvidenceRevision:review.housingEvidenceRevision,identityChanged:false};
const origin={kind:"vitrine" as const,code:"20",label:"Vitrine 20",shelf:"B"};
const staging={kind:"table" as const,code:"staging-area",label:"Staging area"};
const placement=():MuseumSaintPlacement=>({id:review.sourceId,sourceRecordId:review.sourceId,saintId:review.saintId,name:"Sri Paramanand Das",section:review.capturedBaseline.section,tier:"Tertiary",familyId:"",curatorialFamily:"",alternatives:[],confidence:"High",rationale:"",note:"",familySize:0,spiritualRegions:[],sampradaya:"Gaudiya Vaishnava",normalizedPlaces:["Puri"],needsResearch:false,sourceHousingEvidenceRevision:review.housingEvidenceRevision,arrangement:{status:"Proposed",revision:review.capturedBaseline.revision,proposalRevision:review.capturedBaseline.proposalRevision,familyKey:"",vitrine:"",shelf:"",confirmedAt:null,inventoryAcknowledged:false}});
const proposal:ProposalObservation={sourceId:review.sourceId,saintId:review.saintId,name:"Sri Paramanand Das",vitrine:"37",tier:"Tertiary",section:review.capturedBaseline.section,sourceVitrine:"20",sourceShelf:"B",unresolved:true,allocationKind:"historical",share:null,state:"unknown",baseline:review.capturedBaseline};
test("reviewed complete arm-support releases only the exact fresh source evidence, not old snapshots",()=>{
 assert.equal(isReviewedParamanandArmSupport(source),true);assert.equal(spnMovementBlockedReason(review.sourceId,source),undefined);
 assert.doesNotThrow(()=>assertSpnMovementAllowed(review.sourceId,origin,staging,source));
 assert.throws(()=>assertSpnMovementAllowed(review.sourceId,origin,staging),/arm-support/);
 for(const changed of [{sourceId:"other"},{saintId:"other"},{sourceRevision:"changed"},{housingEvidenceRevision:"changed"},{housingEvidenceRevision:undefined},{identityChanged:true}])assert.equal(isReviewedParamanandArmSupport({...source,...changed}),false);
 assert.match(spnMovementBlockedReason("rec9vEn5oj7QZTXl0",source)!,/stick housing/);
});
test("fresh mirror description is required: changed object wording invalidates the reviewed housing scope",()=>{
 assert.equal(paramanandHousingEvidence({"Relics Description (move to other table)":" yoga patta- bole baba stick (to rest the arm while doing Japa) "}),review.housingEvidenceRevision);
 assert.notEqual(paramanandHousingEvidence({"Relics Description (move to other table)":"Arm-support AND separate staff"}),review.housingEvidenceRevision);
 assert.equal(paramanandHousingEvidence({}),undefined);
});
test("approved26 planning is baseline guarded, preserves raw history and never changes a physical location",()=>{
 const current=[placement()],before=structuredClone(current);
 assert.equal(paramanandProposalResolution(current).destination,"26");
 const [projected]=applyParamanandObjectProposal([proposal],current);assert.equal(projected.vitrine,"26");assert.equal(proposal.vitrine,"37");assert.deepEqual(current,before);
 current[0].arrangement!.vitrine="28";current[0].arrangement!.status="Planned";current[0].arrangement!.revision="newer";
 assert.equal(paramanandProposalResolution(current).destination,"28");
 current[0].sourceHousingEvidenceRevision="changed";assert.equal(paramanandProposalResolution(current).destination,null);
});
test("reviewed whole object cannot acquire a new partial V20 component receipt",()=>{
 const input={clearedVitrines:["20"],initialCaseClearAcknowledged:true as const,componentStagingAcknowledgements:[{sourceId:review.sourceId as "recVN6Ty3682Uz2g4",scope:"vitrine_20_contents_only" as const,allOriginPiecesStaged:true as const,walkingSticksNotInVitrine:true as const}],records:[{sourceId:review.sourceId,to:staging}]};
 assert.throws(()=>isComponentClearance(input,{...source,current:origin,fixedHousing:false,verifiedItemIds:[]}),/one complete arm-support/);
 assert.equal(isComponentClearance({...input,componentStagingAcknowledgements:[]},{...source,current:origin,fixedHousing:false,verifiedItemIds:[]}),false);
});
