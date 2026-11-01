import test from "node:test";
import assert from "node:assert/strict";
import {companionClearFields} from "./museum-clearing-request";
import {assertPhaseClearance,phaseClearanceRequirements} from "./museum-preparation-domain";
import {west40To44GuideDefinition} from "./spn-west40-44-guide";
import {junagadhGuideDefinition} from "./spn-junagadh-guide";

test("ordinary clearing acknowledgement satisfies the phase guard without a required-clear card",()=>{
 const rows=[{sourceId:"old-occupant",current:{kind:"vitrine",code:"59"}}];
 assert.throws(()=>assertPhaseClearance({clearedVitrines:["59"]},["59"],"guide",[],rows,rows),/Confirm that/);
 assert.doesNotThrow(()=>assertPhaseClearance(companionClearFields(["59"]),["59"],"guide",[],rows,rows));
 assert.deepEqual(companionClearFields(),{});
 assert.deepEqual(companionClearFields([]),{});
 assert.throws(()=>assertPhaseClearance(companionClearFields(["59"]),["59"],"guide",[],[{...rows[0],current:{kind:"vitrine",code:"47"}}],rows),/clearing list changed/);
});

test("each new Western case can be filled after its own clearing",()=>{
 for(const definition of [west40To44GuideDefinition,junagadhGuideDefinition]){
  const scope=definition.physicalScope!;const code=scope.clearVitrines![0];
  const required=phaseClearanceRequirements([{to:{kind:"vitrine",code}}],scope.clearVitrines!,scope.clearancePerDestination);
  assert.deepEqual(required,[code]);
  assert.doesNotThrow(()=>assertPhaseClearance({},required,definition.context.guideVersion,[{guideVersion:definition.context.guideVersion,vitrine:code,receiptId:"saved",recordedAt:"2026-11-01"}],[],[]));
 }
});
