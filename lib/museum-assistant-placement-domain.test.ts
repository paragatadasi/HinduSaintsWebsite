import test from "node:test";
import assert from "node:assert/strict";
import {assertAssistantGuidePlacement,assertAssistantEffectiveDestination} from "./museum-assistant-placement-domain";
import {confirmMuseumPhysicalLocations} from "./museum-physical-locations";
const context={guideVersion:"current",contentDigest:"digest",assignmentDigest:"assignments"};
const guide={context,readOnly:false,physicalScope:{allowClear:false,destinations:{source:"45"}}};
const record={sourceId:"source",saintId:"saint",to:{kind:"vitrine",code:"45"}};
const input={guideContext:context,records:[record]};
test("assistant confirms one locked current-guide destination with no curator privileges",()=>{
 assert.doesNotThrow(()=>assertAssistantGuidePlacement(input,guide));
 assert.doesNotThrow(()=>assertAssistantEffectiveDestination(input,[{sourceId:"source",saintId:"saint",effectiveVitrine:"45"}]));
});
test("legacy no-scope, historical and changed-digest guides cannot authorize assistant writes",()=>{
 assert.throws(()=>assertAssistantGuidePlacement(input,{context}),/current move guide/);
 assert.throws(()=>assertAssistantGuidePlacement(input,{...guide,readOnly:true}),/current move guide/);
 for(const key of ["guideVersion","contentDigest","assignmentDigest"] as const)
  assert.throws(()=>assertAssistantGuidePlacement(input,{...guide,context:{...context,[key]:"changed"}}),/guide changed/);
});
test("clear, component, alternate, addition, staging, shelf and multiple-record payloads stay curator-only",()=>{
 for(const extra of [{clearedVitrines:["64"]},{initialCaseClearAcknowledged:true as const},{componentStagingAcknowledgements:[]},{retainedCaseClearanceAcknowledgement:{}},{alternativeDecision:{}},{curatorAddition:{}},{guideContext:undefined},{records:[]},{records:[record,record]},{records:[{...record,to:{kind:"table",code:"staging-area"}}]},{records:[{...record,to:{...record.to,shelf:"E"}}]}])
  assert.throws(()=>assertAssistantGuidePlacement({...input,...extra},guide));
});
test("a different source or destination in the same case cannot borrow guide authority",()=>{
 assert.throws(()=>assertAssistantGuidePlacement({...input,records:[{...record,sourceId:"other"}]},guide));
 assert.throws(()=>assertAssistantGuidePlacement({...input,records:[{...record,to:{...record.to,code:"1"}}]},guide));
});
test("later reviewed destinations, pending rows and changed identities supersede locked guide data",()=>{
 for(const rows of [[],[{sourceId:"source",saintId:"saint",effectiveVitrine:"1"}],[{sourceId:"source",saintId:"other",effectiveVitrine:"45"}],[{sourceId:"other",saintId:"saint",effectiveVitrine:"45"}],[{sourceId:"source",saintId:"saint",effectiveVitrine:"45"},{sourceId:"source",saintId:"saint",effectiveVitrine:"45"}]])
  assert.throws(()=>assertAssistantEffectiveDestination(input,rows),/destination changed or needs review/);
});
test("explicit source-only guide membership remains source keyed without inventing a saint",()=>{
 const sourceOnly={...input,records:[{...record,saintId:null}]};
 assert.doesNotThrow(()=>assertAssistantEffectiveDestination(sourceOnly,[{sourceId:"source",saintId:null,effectiveVitrine:"45"}]));
 assert.throws(()=>assertAssistantEffectiveDestination(sourceOnly,[{sourceId:"source",saintId:"new-link",effectiveVitrine:"45"}]));
});
test("direct domain callers without either capability fail before any database read",async()=>{
 let reads=0;
 await assert.rejects(()=>confirmMuseumPhysicalLocations({}, {id:"viewer",canManage:false},async()=>{reads++;throw new Error("Unexpected database read");}),/curator or assistant/);
 assert.equal(reads,0);
});
