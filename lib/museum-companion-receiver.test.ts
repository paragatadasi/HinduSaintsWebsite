import test from "node:test";
import assert from "node:assert/strict";
import {currentReceiverGuideDefinitions} from "./spn-starter-guide-registry";
import {ramakrishnaGuideContext} from "./spn-ramakrishna-guide";
import {assertPhaseClearance,phaseClearanceRequirements,phaseNeedsClearance} from "./museum-preparation-domain";

test("Vitrine 4 additions use the active East guide, not superseded component guides",()=>{
 const receivers=currentReceiverGuideDefinitions("4");
 assert.deepEqual(receivers.map(r=>r.context.guideVersion),[ramakrishnaGuideContext.guideVersion]);
 const records=[{sourceId:"search-added-saint",to:{kind:"vitrine",code:"4"}}];
 for(const receiver of receivers){
  const scope=receiver.physicalScope!;
  if(scope.allowClear&&scope.clearVitrines?.length&&phaseNeedsClearance(records,scope.clearanceRequiredDestinations)){
   const required=phaseClearanceRequirements(records,scope.clearVitrines,scope.clearancePerDestination);
   assert.doesNotThrow(()=>assertPhaseClearance({},required,receiver.context.guideVersion,[{guideVersion:ramakrishnaGuideContext.guideVersion,vitrine:"37",receiptId:"current-clearance",recordedAt:"2026-10-30T10:27:14Z"}],[],records));
   assert.throws(()=>assertPhaseClearance({},required,receiver.context.guideVersion,[],[],records));
  }
 }
});
test("combined East receivers do not duplicate old fill-first requirements",()=>{
 for(const code of ["75","23","73","37"]){
  const versions=currentReceiverGuideDefinitions(code).map(r=>r.context.guideVersion);
  assert.ok(versions.includes(ramakrishnaGuideContext.guideVersion));
  assert.ok(!versions.some(v=>v.startsWith("spn-fill-first-")||v.startsWith("spn-gosaiji-sai-")));
 }
});
