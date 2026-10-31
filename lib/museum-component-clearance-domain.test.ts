import test from "node:test";
import assert from "node:assert/strict";
import { componentStagingAcknowledgements, assertComponentClearanceScope, isComponentClearance, projectComponentPlacement, v20ComponentSourceIds, type ComponentPlacement } from "./museum-component-clearance-domain";
import { assertSpnMovementAllowed } from "./spn-movement-holds";
import {componentClearanceScope,v19ComponentBinding,v42ComponentBinding} from "./museum-component-clearance-domain";
const origin={kind:"vitrine" as const,code:"20",label:"Vitrine 20",shelf:"A"};
const staging={kind:"table" as const,code:"staging-area",label:"Staging area"};
const ack={sourceId:v20ComponentSourceIds[0],scope:"vitrine_20_contents_only" as const,allOriginPiecesStaged:true as const,walkingSticksNotInVitrine:true as const};
const input={clearedVitrines:["20"],initialCaseClearAcknowledged:true as const,componentStagingAcknowledgements:[ack],records:[{sourceId:ack.sourceId,to:staging}]};
const row={sourceId:ack.sourceId,current:origin,fixedHousing:false,verifiedItemIds:[] as string[],identityChanged:false};
const component:ComponentPlacement={sourceId:ack.sourceId,receiptId:"receipt",recordedAt:"2026-10-30T12:00:00Z",revision:"component-revision",origin,location:staging,scope:ack.scope,excludedWalkingSticks:{location:null,status:"unverified"},expectedSourceRevision:"source",previousCurrentRevision:"before",previousLocationVersion:0};

test("V19 supports only the captured saint/source and origin, leaving other mixed holdings restricted",()=>{
 const source={...row,...v19ComponentBinding,current:{...origin,code:"19",label:"Vitrine 19"}};
 const scopedAck={...ack,sourceId:source.sourceId,scope:"vitrine_19_contents_only" as const};
 const scopedInput={...input,clearedVitrines:["19"],componentStagingAcknowledgements:[scopedAck],records:[{sourceId:source.sourceId,to:staging}]};
 assert.equal(componentClearanceScope(source),scopedAck.scope);
 assert.ok(componentStagingAcknowledgements.safeParse([scopedAck]).success);
 assert.equal(isComponentClearance(scopedInput,source),true);
 for(const changed of [{saintId:"other"},{sourceRevision:"changed"},{current:{...origin,code:"42"}},{identityChanged:true},{fixedHousing:true},{verifiedItemIds:["item"]}]){
  assert.equal(componentClearanceScope({...source,...changed}),null);
  assert.throws(()=>isComponentClearance(scopedInput,{...source,...changed}));
 }
 assert.equal(componentStagingAcknowledgements.safeParse([{...scopedAck,scope:ack.scope}]).success,false);
 assert.throws(()=>assertComponentClearanceScope({...scopedInput,clearedVitrines:["20"]}));
 assert.equal(componentClearanceScope({...source,sourceId:"reck86EKve5tFAi6R",current:{...origin,code:"42"}}),null);
 assert.equal(componentClearanceScope({...source,sourceId:"recsm43oeUdKNUMqs",current:{...origin,code:"64"}}),null);
 assert.throws(()=>assertSpnMovementAllowed(source.sourceId,source.current,staging),/stick housing/);
});

test("V19 partial receipt keeps whole collection and external sticks unknown",()=>{
 const source={current:{...origin,code:"19"},currentBasis:"source",currentConfirmed:null,currentVersion:0,currentRevision:"before",sourceRevision:v19ComponentBinding.sourceRevision};
 const receipt:ComponentPlacement={...component,sourceId:v19ComponentBinding.sourceId,scope:"vitrine_19_contents_only",origin:source.current,expectedSourceRevision:source.sourceRevision};
 const projected=projectComponentPlacement(source,receipt);
 assert.equal(projected.current,null);assert.equal(projected.currentVersion,0);
 assert.equal(projected.componentPlacement?.origin.code,"19");
 assert.equal(projected.componentPlacement?.location.code,"staging-area");
 assert.deepEqual(projected.componentPlacement?.excludedWalkingSticks,{location:null,status:"unverified"});
 assert.equal(source.current.code,"19");
 assert.equal(projectComponentPlacement({...source,currentRevision:"later-curator"},receipt).componentPlacement,null);
});

test("V42 captured source can stage only its origin contents after curator acknowledgement",()=>{
 const source={...row,...v42ComponentBinding,current:{...origin,code:"42"}};
 const scope="vitrine_42_contents_only" as const;
 const scopedInput={...input,clearedVitrines:["42"],componentStagingAcknowledgements:[{...ack,sourceId:source.sourceId,scope}],records:[{sourceId:source.sourceId,to:staging}]};
 assert.equal(componentClearanceScope(source),scope);assert.equal(isComponentClearance(scopedInput,source),true);
 assert.ok(componentStagingAcknowledgements.safeParse(scopedInput.componentStagingAcknowledgements).success);
 for(const mutation of [{saintId:"changed"},{sourceRevision:"changed"},{current:{...origin,code:"19"}}])assert.equal(componentClearanceScope({...source,...mutation}),null);
 assert.throws(()=>assertComponentClearanceScope({...scopedInput,clearedVitrines:["64"]}));
 assert.throws(()=>assertSpnMovementAllowed(source.sourceId,source.current,staging),/stick housing/);
});

test("only exact V20-held components can be acknowledged, never unnamed parts or other holdings",()=>{
 assert.ok(componentStagingAcknowledgements.safeParse([ack]).success);
 assert.equal(componentStagingAcknowledgements.safeParse([{...ack,sourceId:"another"}]).success,false);
 assert.equal(componentStagingAcknowledgements.safeParse([{...ack,walkingSticksNotInVitrine:false}]).success,false);
 assert.equal(componentStagingAcknowledgements.safeParse([ack,ack]).success,false);
 assert.equal(isComponentClearance(input,row),true);
 for(const mutation of [{clearedVitrines:["19"]},{clearedVitrines:["20","19"]},{initialCaseClearAcknowledged:undefined},{records:[]},{records:[{sourceId:ack.sourceId,to:{...origin,code:"26"}}]}])
   assert.throws(()=>assertComponentClearanceScope({...input,...mutation}));
});
test("identity, item, housing and changed-origin protections still apply",()=>{
 for(const changed of [{current:{...origin,code:"19"}},{current:staging},{identityChanged:true},{fixedHousing:true},{verifiedItemIds:["item"]}])
   assert.throws(()=>isComponentClearance(input,{...row,...changed}));
 assert.equal(isComponentClearance({...input,componentStagingAcknowledgements:[]},row),false);
 assert.throws(()=>assertSpnMovementAllowed(row.sourceId,staging,{...origin,code:"26"}),/stick housing/);
 assert.throws(()=>assertSpnMovementAllowed(v20ComponentSourceIds[1],staging,{...origin,code:"37"}),/arm-support.*housing/);
});
test("partial projection records no whole-source location or walking-stick location",()=>{
 const original={current:origin,currentBasis:"source",currentConfirmed:null,currentVersion:0,currentRevision:"before",sourceRevision:"source"};
 const projected=projectComponentPlacement(original,component);
 assert.equal(projected.current,null);assert.equal(projected.currentConfirmed,null);assert.equal(projected.currentBasis,"unknown");
 assert.equal(projected.componentPlacement?.location.code,"staging-area");assert.equal(projected.componentPlacement?.excludedWalkingSticks.location,null);
 assert.equal(projected.currentVersion,0);assert.deepEqual(original.current,origin);assert.equal(projected.currentRevision,"component-revision");
 for(const changed of [{currentRevision:"newer"},{currentVersion:1},{sourceRevision:"new-source"}])
   assert.equal(projectComponentPlacement({...original,...changed},component).componentPlacement,null);
});
