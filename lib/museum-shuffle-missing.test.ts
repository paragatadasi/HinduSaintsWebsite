import test from "node:test";
import assert from "node:assert/strict";
import {shuffleMissingRecords} from "./museum-shuffle-missing";
import type {FinalReviewRecord} from "./museum-final-review-domain";
const record=(sourceId:string,code="61",extra:Partial<FinalReviewRecord>={}):FinalReviewRecord=>({
 sourceId,saintId:"s",sourceRevision:"a",name:sourceId,tier:"tertiary",section:"",region:"",city:"",relicDescription:"cloth and sandals",
 physical:{sourceId,saintId:"s",name:sourceId,original:{kind:"vitrine",code:"61",label:"Vitrine 61"},current:{kind:"vitrine",code,label:`Vitrine ${code}`},currentBasis:"confirmed",currentVersion:1,currentRevision:"b",sourceRevision:"a",fixedHousing:false,verifiedItemIds:[],identityChanged:false},
 effectiveDestination:{vitrine:"52",shelf:null,basis:"proposal"},reviewVersion:1,flag:{kind:"missing",status:"open",note:"Only sandals missing"},addressed:false,finallyReviewed:false,reviewedAt:null,decision:"pending",...extra
});
test("missing board uses live flags, ignores preliminary notes and preserves partial-set note",()=>{
 const partial=record("partial");
 const rows=[partial,record("resolved","61",{flag:{kind:"missing",status:"resolved",note:null}}),record("noted","61",{preliminaryNote:"Check storage"}),record("other","61",{flag:{kind:"other",status:"open",note:null}}),record("west","47"),record("recnN6SjH1pOAAXtj")];
 assert.deepEqual(shuffleMissingRecords(rows),[partial]);
 assert.equal(shuffleMissingRecords(rows)[0].flag?.note,"Only sandals missing");
});
test("current location wins over old island membership; staged record can retain island destination",()=>{
 const staged=record("staged");staged.physical.current={kind:"table",code:"staging-area",label:"Staging area"};
 assert.deepEqual(shuffleMissingRecords([record("moved-away","47"),staged]),[staged]);
 assert.equal(shuffleMissingRecords([record("blank-note","58",{preliminaryNote:"  "})]).length,1);
});
