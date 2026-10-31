import test from "node:test";
import assert from "node:assert/strict";
import {caseContentsPreview,assertSelectedCaseContents,caseStagingReconciliation,caseContentsStaging} from "./museum-case-contents-domain";
import {museumPhysicalWriteAllowed} from "./museum-placement-access";
import type {CompanionRow} from "./spn-move-guide";
const loc=(code:string)=>({kind:"vitrine" as const,code,label:`Vitrine ${code}`});
const row=(sourceId:string):CompanionRow=>({sourceId,saintId:null,name:sourceId,current:loc("45"),original:loc("45"),currentBasis:"source",currentVersion:0,currentRevision:"a".repeat(64),sourceRevision:"b".repeat(64),fixedHousing:false,verifiedItemIds:[],identityChanged:false});
const refs=(r:ReturnType<typeof caseContentsPreview>["eligible"][number])=>{const {name,from,...record}=r;return record;};
test("selected contents preserves confirmed target placements and permits an exact subset",()=>{
 const target={...row("target"),currentBasis:"confirmed",currentVersion:2};
 const preview=caseContentsPreview([row("one"),row("two"),target],[{sourceId:"target",vitrine:"45"}],"45","selected_contents");
 assert.deepEqual(preview.eligible.map(r=>r.sourceId),["one","two"]);assert.deepEqual(preview.preservedSourceIds,["target"]);
 assertSelectedCaseContents([refs(preview.eligible[0])],preview.revision,preview);
 assert.throws(()=>assertSelectedCaseContents([{...refs(preview.eligible[0]),sourceId:"target"}],preview.revision,preview));
});
test("historical correction preserves every later confirmation, even an outgoing destination",()=>{
 const moved={...row("moved"),current:loc("1"),currentBasis:"confirmed",currentVersion:3};
 const staged={...row("staged"),current:{kind:"table" as const,code:"staging-area",label:"Staging area"},currentBasis:"confirmed",currentVersion:1};
 const inCase={...row("placed"),currentBasis:"confirmed",currentVersion:2};
 const preview=caseContentsPreview([row("residual"),moved,staged,inCase],[{sourceId:"placed",vitrine:"60"}],"45","historical");
 assert.deepEqual(preview.eligible.map(r=>r.sourceId),["residual"]);assert.equal(preview.preservedConfirmedCount,3);assert.equal(preview.alreadyStagedCount,1);
});
test("fixed, component housing, identity and verified item restrictions are never waived",()=>{
 const preview=caseContentsPreview([{...row("fixed"),fixedHousing:true},{...row("identity"),identityChanged:true},{...row("item"),verifiedItemIds:["item"]},{...row("compound"),movementBlockedReason:"Use scoped components"}],[],"45","selected_contents");
 assert.equal(preview.eligible.length,0);assert.equal(preview.blocked.length,4);
 assert.throws(()=>caseContentsPreview([row("held")],[],"68","selected_contents"));
});
test("stale revisions, duplicates and changed sources reject the entire selected batch",()=>{
 const original=caseContentsPreview([row("one"),row("two")],[],"45","selected_contents"),record=refs(original.eligible[0]);
 assert.throws(()=>assertSelectedCaseContents([record,record],original.revision,original));
 assert.throws(()=>assertSelectedCaseContents([{...record,saintId:"different"}],original.revision,original));
 for(const changed of [{...row("one"),sourceRevision:"c".repeat(64)},{...row("one"),currentBasis:"confirmed"}]){
  const preview=caseContentsPreview([changed,row("two")],[],"45","selected_contents");
  assert.throws(()=>assertSelectedCaseContents([record],original.revision,preview));
 }
});
test("historical subset requires receipt, valid date and both explicit acknowledgements",()=>{
 const preview=caseContentsPreview([row("one"),row("two")],[],"45","historical");
 const request={action:"case.staging.reconcile",museumId:"museum-spn",clientRequestId:"12345678-1234-4234-8234-123456789abc",vitrine:"45",preparationReceiptId:"prep",expectedRevision:preview.revision,records:[refs(preview.eligible[0])],reportedDate:"2026-10-31",historicalClearanceAcknowledged:true,currentStagingAcknowledged:true};
 assert.ok(caseStagingReconciliation.safeParse(request).success);
 for(const change of [{preparationReceiptId:undefined},{historicalClearanceAcknowledged:false},{currentStagingAcknowledged:false},{reportedDate:"2026-02-30"},{clearedVitrines:["45"]}])assert.equal(caseStagingReconciliation.safeParse({...request,...change}).success,false);
});
test("contents acknowledgement stays curator-only and separate from assistant placements",()=>{
 const ack=caseContentsStaging.parse({vitrine:"45",expectedRevision:"a".repeat(64),selectedContentsPhysicallyStaged:true,confirmedTargetPlacementsPreserved:true});
 const body={museumId:"museum-spn",guideContext:{guideVersion:"guide",contentDigest:"d",assignmentDigest:"a"},records:[{to:{kind:"vitrine",code:"45"}}],caseContentsStaging:ack};
 assert.equal(museumPhysicalWriteAllowed(["museum_assistant"],body),false);assert.equal(museumPhysicalWriteAllowed(["curator"],body),true);
 assert.equal(caseContentsStaging.safeParse({...ack,confirmedTargetPlacementsPreserved:false}).success,false);
});
