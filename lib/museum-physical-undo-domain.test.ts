import test from "node:test";
import assert from "node:assert/strict";
import { physicalUndoInput, physicalUndoOffer, type UndoRow } from "./museum-physical-undo-domain";
import { resolveMuseumPhysicalCurrent } from "./museum-physical-location-current";
const from={kind:"vitrine" as const,code:"1",label:"Vitrine 1"};
const to={kind:"vitrine" as const,code:"80",label:"Vitrine 80"};
const at="2026-10-28T10:00:00.000Z";
const row:UndoRow={sourceId:"source",sourceKey:"base:source",saintId:"saint",original:from,current:to,currentBasis:"confirmed",currentVersion:1,
  currentConfirmed:{confirmedAt:at},identityChanged:false,verifiedItemIds:[],legacyConfirmed:null};
const event={id:"receipt",afterJson:{museumId:"museum-spn",recordedAt:at,clearedVitrines:[],moves:[{sourceId:"source",sourceKey:"base:source",saintId:"saint",original:from,previous:from,location:to,version:1}]}};
test("historical first check can recover source basis only when original and prior match without legacy confirmation",()=>{
 assert.equal(physicalUndoOffer(row,[event]).previousBasis,"source");
 assert.equal(physicalUndoOffer({...row,legacyConfirmed:{location:from}},[event]).available,false);
 assert.equal(physicalUndoOffer({...row,original:null},[event]).available,false);
});
test("stale receipt, changed identity, newer location and whole-clear event cannot be undone",()=>{
 for(const r of [{...row,currentVersion:2},{...row,identityChanged:true},{...row,saintId:"another"},{...row,current:from},{...row,verifiedItemIds:["item"]}]) assert.equal(physicalUndoOffer(r,[event]).available,false);
 assert.equal(physicalUndoOffer(row,[{...event,afterJson:{...event.afterJson,clearedVitrines:["1"]}}]).available,false);
});
test("new receipt restores exact prior confirmed metadata; older unprovable prior confirmations remain held",()=>{
 const prior="2026-10-27T10:00:00.000Z";
 const newer={...event,afterJson:{...event.afterJson,moves:[{...event.afterJson.moves[0],version:3,previousState:{basis:"confirmed",location:from,effectiveConfirmedAt:prior}}]}};
 const offer=physicalUndoOffer({...row,currentVersion:3},[newer]);assert.equal(offer.available,true);assert.equal(offer.previousConfirmedAt,prior);
 assert.equal(physicalUndoOffer({...row,currentVersion:3},[{...newer,afterJson:{...newer.afterJson,moves:[{...event.afterJson.moves[0],version:3}]}}]).available,false);
});
test("restored source and unknown retain monotonic version without becoming physical confirmations",()=>{
 for(const basis of ["source","unknown"] as const){const loc=basis==="source"?from:null;
 const r=resolveMuseumPhysicalCurrent(from,{location:{kind:"restored_recorded_state",basis,location:loc,effectiveConfirmedAt:null},version:2,confirmedAt:new Date(at)},null);
 assert.equal(r.currentBasis,basis);assert.deepEqual(r.current,loc);assert.equal(r.currentConfirmed,null);assert.equal(r.currentVersion,2);}
});
test("restored prior confirmation keeps its date and a newer legacy confirmation wins",()=>{
 const restored={location:{kind:"restored_recorded_state",basis:"confirmed",location:from,effectiveConfirmedAt:"2026-10-26T10:00:00.000Z"},version:4,confirmedAt:new Date(at)};
 assert.equal(resolveMuseumPhysicalCurrent(from,restored,null).currentConfirmed?.confirmedAt,"2026-10-26T10:00:00.000Z");
 assert.deepEqual(resolveMuseumPhysicalCurrent(from,restored,{location:to,confirmedAt:"2026-10-27T10:00:00.000Z",scope:"source"}).current,to);
});
test("undo requires explicit mistake acknowledgement and rejects target-location injection",()=>{
 const input={action:"undo",museumId:"museum-spn",clientRequestId:"a9230f9a-f7ba-4c60-864a-c3b462c4f1dd",receiptId:"receipt",sourceId:"source",saintId:"saint",expectedCurrentRevision:"a".repeat(64),expectedSourceRevision:"b".repeat(64),expectedLocationVersion:1,mistakenCheckAcknowledged:true};
 assert.equal(physicalUndoInput.safeParse(input).success,true);assert.equal(physicalUndoInput.safeParse({...input,mistakenCheckAcknowledged:false}).success,false);assert.equal(physicalUndoInput.safeParse({...input,to}).success,false);
});
