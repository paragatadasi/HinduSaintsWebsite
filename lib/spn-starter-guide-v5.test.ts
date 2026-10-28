import test from "node:test";
import assert from "node:assert/strict";
import {registeredStarterGuide as current,readStarterGuideDefinition} from "./spn-starter-guide-registry";
import {registeredStarterGuide as previous} from "./spn-starter-guide-v4";
import {starterMoveGuide} from "./spn-starter-move-guide";
import {inheritGuideDecisions} from "./museum-guide-decision-inheritance";
import {assertSpnMovementAllowed} from "./spn-movement-holds";
const changed=new Set(["rec1bOVrWmAFek7Tn","recJepdkXi90kdROh","recIv4yKRknjgONrZ","rechBZw1LyW9TTX9L"]);
test("v5 preserves all136 observations and physical history; only approved source rows change",()=>{
 assert.equal(current.rows.length,136);assert.deepEqual(current.rows.map(r=>r.sourceId),previous.rows.map(r=>r.sourceId));
 assert.deepEqual(current.physicalConfirmations,previous.physicalConfirmations);assert.deepEqual(current.transitionRowsOutsideStarter,previous.transitionRowsOutsideStarter);
 for(const row of previous.rows){const next=current.rows.find(r=>r.sourceId===row.sourceId)!;
  if(!changed.has(row.sourceId))assert.deepEqual(next,row);
  assert.deepEqual(next.originalLocation,row.originalLocation);assert.deepEqual(next.currentLocation,row.currentLocation);
 }
 assert.equal(current.rows.find(r=>r.sourceId==="rec1bOVrWmAFek7Tn")?.vitrine,"28");
 assert.equal(current.rows.find(r=>r.sourceId==="recJepdkXi90kdROh")?.vitrine,"2");
 assert.equal(current.rows.find(r=>r.sourceId==="recIv4yKRknjgONrZ")?.vitrine,"78");
 assert.equal(current.rows.find(r=>r.sourceId==="recc9hYwqqmB3Di2r")?.vitrine,"36");
});
test("private Hemalata is held without deleting historical membership or allowing physical movement",()=>{
 const row=starterMoveGuide.entries.find(r=>r.sourceId==="rechBZw1LyW9TTX9L");assert.match(row?.movementBlockedReason??"",/Privately held/);
 assert.throws(()=>assertSpnMovementAllowed("rechBZw1LyW9TTX9L",null,{kind:"vitrine",code:"78",label:"Vitrine78"}),/Privately held/);
});
test("Harendranath joins exact Ramdas source branch; no namesake identity merge",()=>{
 const group=starterMoveGuide.vitrines.find(v=>v.code==="28")?.families.find(g=>g.id==="v3-radharaman-pathbari");
 assert.equal(group?.sourceIds.includes("rec1bOVrWmAFek7Tn"),true);
 assert.ok(group?.edges?.some(e=>e.fromSourceId==="recqPwPML5FbWMvaV"&&e.toSourceId==="rec1bOVrWmAFek7Tn"));
 assert.ok(group?.sourceIds.includes("recT2VuCD6lF7YwX0"));
});
test("v4 retains original digest read-only; changed destination decisions never inherit",()=>{
 const old=readStarterGuideDefinition(previous.version),next=readStarterGuideDefinition(current.version);assert.equal(old.readOnly,true);
 assert.equal(old.context.contentDigest,previous.contentDigest);assert.equal(next.previousVersions?.[0],previous.version);
 const id="row:rec1bOVrWmAFek7Tn";
 const inherited=inheritGuideDecisions(next,[],[{guide:old,decisions:[{suggestionId:id,decision:"declined",note:"Old78 scope",alternativeVitrine:null,alternativeShelf:null,version:1,updatedAt:new Date()}]}]);
 assert.equal(inherited.some(r=>r.suggestionId===id),false);
});
