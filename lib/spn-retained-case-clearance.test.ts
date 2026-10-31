import test from "node:test";
import assert from "node:assert/strict";
import {retainedCaseClearanceAllowed,assertRetainedCaseClearance} from "./spn-retained-case-clearance";
import {componentClearanceScope,componentStagingAcknowledgements,isComponentClearance,v64ComponentBinding} from "./museum-component-clearance-domain";
import {spnCaseExecutionHold,spnPhysicalExecutionHold} from "./museum-case-execution-holds";
const staging={kind:"table" as const,code:"staging-area",label:"Staging area"};
const source={...v64ComponentBinding,current:{kind:"vitrine" as const,code:"64",label:"Vitrine 64",shelf:"E"},fixedHousing:false,verifiedItemIds:[] as string[],identityChanged:false};
const scope="vitrine_64_contents_including_sticks" as const;
const ack={sourceId:source.sourceId,scope,allOriginPiecesStaged:true as const,walkingSticksInVitrineStaged:true as const};
const input={retainedCaseClearanceAcknowledgement:{vitrine:"64" as const,allOriginPiecesIncludingWalkingSticksStaged:true as const},initialCaseClearAcknowledged:true as const,clearedVitrines:["64"],records:[{sourceId:source.sourceId,to:staging}],componentStagingAcknowledgements:[ack]};
test("only explicit standalone64 clearing to staging qualifies, with current origin checked",()=>{
 assert.equal(retainedCaseClearanceAllowed(input),true);assert.doesNotThrow(()=>assertRetainedCaseClearance(input,[source]));
 for(const mutation of [{retainedCaseClearanceAcknowledgement:undefined},{initialCaseClearAcknowledged:undefined},{clearedVitrines:["65"]},{clearedVitrines:["64","65"]},{guideContext:{}},{curatorAddition:{}},{alternativeDecision:{}},{records:[]},{records:[{sourceId:source.sourceId,to:{kind:"vitrine",code:"81"}}]}])assert.equal(retainedCaseClearanceAllowed({...input,...mutation}),false);
 assert.throws(()=>assertRetainedCaseClearance({...input,guideContext:{}}));
 assert.throws(()=>assertRetainedCaseClearance(input,[{...source,current:{...source.current,code:"65"}}]));
 assert.throws(()=>assertRetainedCaseClearance(input,[]));
});
test("64 component includes its housed stick and requires exact source binding",()=>{
 assert.ok(componentStagingAcknowledgements.safeParse([ack]).success);
 assert.equal(componentClearanceScope(source),scope);assert.equal(isComponentClearance(input,source),true);
 assert.equal(componentStagingAcknowledgements.safeParse([{...ack,walkingSticksNotInVitrine:true}]).success,false);
 assert.throws(()=>isComponentClearance({...input,retainedCaseClearanceAcknowledgement:undefined},source));
 for(const mutation of [{saintId:"other"},{sourceRevision:"changed"},{identityChanged:true},{fixedHousing:true},{verifiedItemIds:["item"]}])assert.equal(componentClearanceScope({...source,...mutation}),null);
});
test("ordinary retained-case movement and preparation holds remain intact",()=>{
 for(const code of ["64","65","66","67","68"]){
  assert.ok(spnCaseExecutionHold(code));
  assert.ok(spnPhysicalExecutionHold({kind:"vitrine",code},staging));
  assert.ok(spnPhysicalExecutionHold(staging,{kind:"vitrine",code}));
 }
});
