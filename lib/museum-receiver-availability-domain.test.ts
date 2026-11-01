import test from "node:test";
import assert from "node:assert/strict";
import {receiverAvailabilitySnapshot,receiverAvailabilityValid,receiverAvailabilityInput,assertReceiverAvailabilityRevision,assertReceiverReadiness} from "./museum-receiver-availability-domain";
import {assertPhaseClearance} from "./museum-preparation-domain";
import {museumPhysicalWriteAllowed} from "./museum-placement-access";
const context={guideVersion:"current",contentDigest:"a".repeat(64),assignmentDigest:"b".repeat(64)};
const at="2026-11-01T00:00:00Z";
const row=(sourceId:string,code="59")=>({sourceId,sourceRevision:"s",currentRevision:sourceId,currentVersion:0,current:{kind:"vitrine",code},currentBasis:"source",currentConfirmed:null as {confirmedAt:string}|null});
const initial=[row("retained"),row("incoming","20")];
const snap=(rows=initial,ids=["incoming"])=>receiverAvailabilitySnapshot(context,"59",rows,ids);
test("available space leaves occupants intact and permits the next approved arrival",()=>{
 const saved=snap();assert.equal(receiverAvailabilityValid(saved,at,snap()),true);
 const arrival={...row("incoming"),currentRevision:"arrived",currentVersion:1,currentBasis:"confirmed",currentConfirmed:{confirmedAt:"2026-11-01T00:01:00Z"}};
 assert.equal(receiverAvailabilityValid(saved,at,snap([initial[0],arrival])),true);
 assert.equal(receiverAvailabilityValid(saved,at,snap([initial[0],{...arrival,currentBasis:"source"}])),false);
 assert.equal(receiverAvailabilityValid(saved,at,snap([initial[0],{...arrival,currentConfirmed:{confirmedAt:"2026-10-30T00:00:00Z"}}])),false);
});
test("unexpected arrival, removal, undo, source or proposal changes invalidate space",()=>{
 const saved=snap();
 for(const current of [snap([...initial,row("outsider")]),snap([initial[1]]),snap([initial[0],{...initial[1],currentRevision:"undo",currentVersion:2}]),snap([initial[0],{...initial[1],sourceRevision:"changed"}]),snap(initial,[]),{...snap(),guideContext:{...context,assignmentDigest:"c".repeat(64)}}])assert.equal(receiverAvailabilityValid(saved,at,current),false);
});
test("stale contents and preparation versions reject acknowledgement",()=>{
 const current={...snap(),expectedPreparationVersion:2};
 assert.doesNotThrow(()=>assertReceiverAvailabilityRevision(current.revision,2,current));
 assert.throws(()=>assertReceiverAvailabilityRevision("stale",2,current));
 assert.throws(()=>assertReceiverAvailabilityRevision(current.revision,1,current));
});
test("availability satisfies only its receiver and never creates full-clear authority",()=>{
 assert.doesNotThrow(()=>assertPhaseClearance({},["59"],"current",[],[],[],["59"]));
 assert.throws(()=>assertPhaseClearance({},["47"],"current",[],[],[],["59"]));
 assert.throws(()=>assertPhaseClearance({clearedVitrines:["59"]},["59"],"current",[],[],[],["59"]));
});
test("invalid availability blocks even preparation-only receivers until a newer full clear or acknowledgement",()=>{
 const state={vitrine:"59",guideVersion:"current",valid:false,recordedAt:at};
 assert.throws(()=>assertReceiverReadiness([state],"current",["59"],[]));
 assert.throws(()=>assertReceiverReadiness([state],"current",["59"],[{...state,recordedAt:"2026-10-30T00:00:00Z"}]));
 assert.doesNotThrow(()=>assertReceiverReadiness([state],"current",["59"],[{...state,recordedAt:"2026-11-01T00:01:00Z"}]));
 assert.doesNotThrow(()=>assertReceiverReadiness([{...state,valid:true}],"current",["59"],[]));
 assert.doesNotThrow(()=>assertReceiverReadiness([state],"other",["59"],[]));
});
test("space acknowledgement requires management permission and cannot carry physical moves",()=>{
 const input={action:"receiver.availability",museumId:"museum-spn",clientRequestId:"12345678-1234-4234-8234-123456789abc",guideContext:context,vitrine:"59",expectedRevision:"a".repeat(64),expectedPreparationVersion:0,availableSpaceAcknowledged:true};
 assert.equal(receiverAvailabilityInput.safeParse(input).success,true);
 assert.equal(receiverAvailabilityInput.safeParse({...input,availableSpaceAcknowledged:false}).success,false);
 assert.equal(receiverAvailabilityInput.safeParse({...input,clearedVitrines:["59"]}).success,false);
 assert.equal(museumPhysicalWriteAllowed(["museum_assistant"],input),true);
 assert.equal(museumPhysicalWriteAllowed(["translator"],input),false);
});
