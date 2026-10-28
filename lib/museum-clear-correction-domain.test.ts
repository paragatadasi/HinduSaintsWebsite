import test from "node:test";
import assert from "node:assert/strict";
import {clearCorrectionOffers,clearCorrectionInput,clearCorrectionShelfApplies} from "./museum-clear-correction-domain";
const at="2026-10-28T16:32:25.061Z",priorAt="2026-10-28T10:17:05.761Z";
const original={kind:"vitrine" as const,code:"51",label:"Vitrine 51",shelf:"B"};
const previous={kind:"vitrine" as const,code:"2",label:"Vitrine 2",shelf:"3.10"};
const staging={kind:"table" as const,code:"staging-area",label:"Staging area"};
const row={sourceId:"source",sourceKey:"base:source",saintId:"saint",name:"Saint",original,current:staging,currentBasis:"confirmed",currentVersion:2,
 currentConfirmed:{confirmedAt:at},identityChanged:false,verifiedItemIds:[] as string[],currentRevision:"a".repeat(64),sourceRevision:"b".repeat(64)};
const move={sourceId:"source",sourceKey:"base:source",saintId:"saint",original,previous,location:staging,version:2,
 previousState:{basis:"confirmed",location:previous,effectiveConfirmedAt:priorAt}};
const event={id:"receipt",afterJson:{museumId:"museum-spn",recordedAt:at,clearedVitrines:["2"],moves:[move]}};
test("clearing correction exposes only proven prior confirmed entries, preserving timestamps and shelf text",()=>{
 const sourceOnly={...move,sourceId:"outgoing",previousState:{basis:"source",location:previous,effectiveConfirmedAt:null}};
 const offers=clearCorrectionOffers([row,{...row,sourceId:"outgoing"}],[{...event,afterJson:{...event.afterJson,moves:[move,sourceOnly]}}]);
 assert.equal(offers.length,1);assert.equal(offers[0].records.length,1);assert.equal(offers[0].excludedCount,1);
 assert.equal(offers[0].records[0].previousConfirmedAt,priorAt);assert.equal(offers[0].records[0].previous.shelf,"3.10");
});
test("changed source, current location, receipt version or identity removes correction offer",()=>{
 for(const changed of [{...row,currentVersion:3},{...row,current:previous},{...row,currentConfirmed:{confirmedAt:priorAt}},
  {...row,saintId:"different"},{...row,sourceKey:"other"},{...row,original:previous},{...row,identityChanged:true},{...row,verifiedItemIds:["item"]}])
  assert.deepEqual(clearCorrectionOffers([changed],[event]),[]);
});
test("ordinary moves, unproven historical prior states, duplicate source moves and wrong-case prior states are excluded",()=>{
 for(const afterJson of [{...event.afterJson,clearedVitrines:[]},{...event.afterJson,moves:[move,move]},
  {...event.afterJson,moves:[{...move,previousState:undefined}]},{...event.afterJson,moves:[{...move,previousState:{...move.previousState,location:original}}]},
  {...event.afterJson,museumId:"museum-vrindavan"}])assert.deepEqual(clearCorrectionOffers([row],[{...event,afterJson}]),[]);
});
test("correction input requires explicit scope and acknowledgement; rejects invented destination",()=>{
 const record={sourceId:row.sourceId,saintId:row.saintId,expectedCurrentRevision:row.currentRevision,expectedSourceRevision:row.sourceRevision,expectedLocationVersion:2};
 const input={action:"clear.correct",museumId:"museum-spn",clientRequestId:"a9230f9a-f7ba-4c60-864a-c3b462c4f1dd",receiptId:"receipt",records:[record],mistakenClearAcknowledged:true};
 assert.equal(clearCorrectionInput.safeParse(input).success,true);
 for(const extra of [{records:[]},{mistakenClearAcknowledged:false},{to:previous},{records:[{...record,previous}]}])assert.equal(clearCorrectionInput.safeParse({...input,...extra}).success,false);
});

test("only the exact prior shelf binding can be restored; later notes stay independent",()=>{
 const change={saintId:"saint",previous:{code:"2"},expectedLocationVersion:2};
 const note={saintId:"saint",vitrine:"2",physicalVersion:1};
 assert.equal(clearCorrectionShelfApplies(note,change),true);
 for(const other of [{...note,physicalVersion:2},{...note,saintId:"different"},{...note,vitrine:"78"}])assert.equal(clearCorrectionShelfApplies(other,change),false);
});
