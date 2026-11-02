import assert from "node:assert/strict";
import test from "node:test";
import {confirmedCompanionDestination,confirmedCompanionDestinations} from "./museum-confirmed-destination";
import type {ComponentPlacement} from "./museum-component-clearance-domain";
const row={sourceId:"source",sourceRevision:"revision",identityChanged:false,currentBasis:"confirmed",current:{kind:"vitrine",code:"40",shelf:"B"},currentConfirmed:{confirmedAt:"2026-11-02T10:00:00.000Z"}};
test("confirmed placement replaces an older plan but preserves a later deliberate plan",()=>{
 assert.equal(confirmedCompanionDestination(row,"2026-11-01T10:00:00.000Z")?.vitrine,"40");
 assert.equal(confirmedCompanionDestination(row,"2026-11-02T10:01:00.000Z"),null);
 assert.equal(confirmedCompanionDestination(row,row.currentConfirmed.confirmedAt),null);
});
test("source-only inventory, changed identities and staging are not confirmed receiving destinations",()=>{
 assert.equal(confirmedCompanionDestination({...row,currentBasis:"source",currentConfirmed:null}),null);
 assert.equal(confirmedCompanionDestination({...row,identityChanged:true}),null);
 assert.equal(confirmedCompanionDestination({...row,current:{kind:"table",code:"staging-area"}}),null);
});
const component:ComponentPlacement={sourceId:"source",expectedSourceRevision:"revision",recordedAt:"2026-11-02T11:00:00.000Z",scope:"vitrine_64_contents_only",location:{kind:"vitrine",code:"40",label:"Vitrine 40"},origin:{kind:"vitrine",code:"64",label:"Vitrine 64"},receiptId:"receipt",revision:"component",previousCurrentRevision:"old",previousLocationVersion:0,excludedWalkingSticks:{location:null,status:"unverified"}};
test("component confirmation projects only its pinned scope, never the separately housed source",()=>{
 const result=confirmedCompanionDestination({...row,current:{kind:"vitrine",code:"64"},componentPlacement:component});
 assert.equal(result?.vitrine,"40");assert.equal(result?.componentScope,"vitrine_64_contents_only");
 assert.equal(confirmedCompanionDestination({...row,componentPlacement:{...component,expectedSourceRevision:"stale"}}),null);
 assert.equal(confirmedCompanionDestination({...row,componentPlacement:{...component,location:{kind:"table",code:"staging-area",label:"Staging area"}}}),null);
});

test("batch projection preserves later placement-level decisions and excludes private or suppressed sources",()=>{
 const sources=[row,{...row,sourceId:"private"}];
 assert.deepEqual(confirmedCompanionDestinations(sources,[],new Map([["placement","2026-11-02T12:00:00.000Z"]]),[{id:"placement",sourceRecordId:"source"}],id=>id==="private"),[]);
 assert.equal(confirmedCompanionDestinations([row],[],new Map(),[],()=>false)[0].vitrine,"40");
});
