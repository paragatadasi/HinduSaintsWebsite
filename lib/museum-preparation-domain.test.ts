import test from "node:test";
import assert from "node:assert/strict";
import {preparationInput,projectPreparations,assertSafeCaseClear,assertPhaseClearance,projectPhaseClearances} from "./museum-preparation-domain";
import {museumIntakeRelicInput,preserveAdditionalSaints} from "./museum-intake-domain";
import {intakeRelicPayload,intakeRelicsEqual} from "./museum-intake-fields";
test("preparation survives placements and preserves independent readiness revocation",()=>{
 const event=(id:string,day:number,afterJson:unknown)=>({id,createdAt:new Date(Date.UTC(2026,9,day)),afterJson});
 const events=[event("clear",1,{museumId:"museum-spn",clearedVitrines:["2"]}),event("move",2,{museumId:"museum-spn",moves:[{location:{code:"2"}}]})];
 assert.deepEqual(projectPreparations(events).map(r=>[r.vitrine,r.prepared,r.version,r.basis]),[["2",true,0,"legacy_clear"]]);
 events.push(event("ack",3,{museumId:"museum-spn",vitrine:"2",prepared:false,version:1}));
 assert.equal(projectPreparations(events)[0].prepared,false);
 assert.equal(projectPreparations([...events].reverse())[0].version,1);
 events.push(event("clear-again",4,{museumId:"museum-spn",clearedVitrines:["2"]}));
 assert.equal(projectPreparations(events)[0].version,2);
 assert.equal(projectPreparations([event("other",1,{museumId:"museum-vrindavan",vitrine:"2",prepared:true,version:1})]).length,0);
});
test("whole clear rejects already confirmed placements but permits source-only preparation",()=>{
 const row={current:{kind:"vitrine",code:"2"},currentBasis:"confirmed"};
 assert.throws(()=>assertSafeCaseClear(["2"],[row]),/confirmed placements/);
 assert.doesNotThrow(()=>assertSafeCaseClear(["3"],[row]));
 assert.doesNotThrow(()=>assertSafeCaseClear(["2"],[{...row,currentBasis:"source"}]));
});
test("preparation validates version and does not accept location mutations",()=>{
 const input={action:"preparation.update",museumId:"museum-spn",clientRequestId:"a9230f9a-f7ba-4c60-864a-c3b462c4f1dd",vitrine:"2",prepared:true,expectedVersion:0};
 assert.equal(preparationInput.safeParse(input).success,true);
 for(const extra of [{expectedVersion:-1},{records:[]},{prepared:undefined},{museumId:"other"}])assert.equal(preparationInput.safeParse({...input,...extra}).success,false);
});
test("additional saints remain per-relic raw evidence and survive old clients",()=>{
 const prior={id:"relic1",relicDescription:"cloth",additionalSaintsRaw:"Sri A; Sri B"};
 assert.equal(museumIntakeRelicInput.parse(prior).additionalSaintsRaw,prior.additionalSaintsRaw);
 assert.equal(museumIntakeRelicInput.safeParse({...prior,additionalSaintsRaw:"x".repeat(2001)}).success,false);
 assert.equal(preserveAdditionalSaints({id:"relic1",relicDescription:"edited"},prior).additionalSaintsRaw,prior.additionalSaintsRaw);
 assert.equal(preserveAdditionalSaints({...prior,additionalSaintsRaw:""},prior).additionalSaintsRaw,"");
 assert.equal(intakeRelicPayload(prior).additionalSaintsRaw,prior.additionalSaintsRaw);
 assert.equal(intakeRelicsEqual([prior],[{...prior,additionalSaintsRaw:"Sri C"}]),false);
});

test("phase first-clear is explicit, limited to current occupants and never repeatable",()=>{
 const rows=[{sourceId:"outgoing",current:{kind:"vitrine",code:"37"}},{sourceId:"elsewhere",current:{kind:"vitrine",code:"4"}}];
 const input={clearedVitrines:["37"],initialCaseClearAcknowledged:true as const};
 assert.doesNotThrow(()=>assertPhaseClearance(input,["37"],"phase",[],rows,[{sourceId:"outgoing"}]));
 assert.throws(()=>assertPhaseClearance({clearedVitrines:["37"]},["37"],"phase",[],rows,[{sourceId:"outgoing"}]));
 assert.throws(()=>assertPhaseClearance(input,["37"],"phase",[],rows,[{sourceId:"elsewhere"}]));
 const receipts=[{guideVersion:"phase",vitrine:"37",receiptId:"receipt",recordedAt:"2026-10-28T10:00:00Z"}];
 assert.throws(()=>assertPhaseClearance(input,["37"],"phase",receipts,rows,[{sourceId:"outgoing"}]));
 assert.throws(()=>assertPhaseClearance({},["37"],"phase",[],rows,[]));
 assert.doesNotThrow(()=>assertPhaseClearance({},["37"],"phase",receipts,rows,[]));
 assert.throws(()=>assertPhaseClearance({},["37"],"different-phase",receipts,rows,[]));
});
test("preparation-only acknowledgements never satisfy the phase clearing prerequisite",()=>{
 const date=new Date("2026-10-28T10:00:00Z");
 const events=[{id:"prep",createdAt:date,afterJson:{museumId:"museum-spn",vitrine:"37",prepared:true,version:1}},
  {id:"clear",createdAt:date,afterJson:{museumId:"museum-spn",guideContext:{guideVersion:"phase"},clearedVitrines:["37"]}}];
 assert.deepEqual(projectPhaseClearances(events).map(r=>[r.guideVersion,r.vitrine,r.receiptId]),[["phase","37","clear"]]);
});
