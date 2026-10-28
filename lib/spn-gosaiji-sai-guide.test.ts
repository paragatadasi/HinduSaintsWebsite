import test from "node:test";
import assert from "node:assert/strict";
import {gosaijiSaiMoveGuide as guide,gosaijiSaiGuideDefinition as definition,projectGosaijiSaiGuide} from "./spn-gosaiji-sai-guide";
import type {CompanionRow} from "./spn-move-guide";
test("Gosaiji and Sai phase preserves the approved 10/15 source partition and relationship qualifications",()=>{
 assert.deepEqual(guide.vitrines.map(v=>[v.code,v.families.flatMap(g=>g.sourceIds).length]),[["37",10],["4",15]]);
 assert.equal(new Set(guide.entries.map(e=>e.sourceId)).size,25);
 assert.deepEqual(definition.physicalScope?.clearVitrines,["37"]);
 const edges=guide.vitrines.flatMap(v=>v.families.flatMap(g=>g.edges??[]));
 assert.equal(edges.filter(e=>e.fromSourceId==="recZxEDfwSCOpkXyC"&&e.label==="source-recorded disciple").length,2);
 assert.ok(edges.some(e=>e.toSourceId==="recwXrEbirWApVteB"&&e.label.endsWith("*")));
 assert.ok(edges.some(e=>e.fromSourceId==="recmnzklbsFkmcOUh"&&e.toSourceId==="rece342T8PgvjAtX9"&&e.label.startsWith("family")));
 assert.ok(!edges.some(e=>e.fromSourceId==="recDQE3wQ8BNrmIpR"&&e.toSourceId==="rec9cGrqgBRNKmfQV"));
 assert.match(guide.vitrines[1].summary,/5.47 \/ 5/);
 assert.equal(guide.entries.filter(e=>e.name.includes("Yogmaya")).length,2);
 assert.equal(guide.entries.find(e=>e.sourceId==="recRZkHSnl8nDNArl")?.saintId,null);
});
test("phase projection takes current ledger locations and blocks changed identity without fabricating staging",()=>{
 const entry=guide.entries[0];
 const row:CompanionRow={sourceId:entry.sourceId,saintId:entry.saintId,name:entry.name,original:{kind:"vitrine",code:"4",label:"Vitrine 4"},current:{kind:"vitrine",code:"12",label:"Vitrine 12"},currentBasis:"confirmed",currentVersion:3,currentRevision:"x",sourceRevision:"y",fixedHousing:false,verifiedItemIds:[],identityChanged:false};
 const projected=projectGosaijiSaiGuide([],{rows:[row],unmappedCurrentLocations:[]});
 assert.equal(projected.entries[0].currentLocation?.code,"12");
 assert.equal(projected.entries[0].destination,"37");
 assert.equal(projected.reportedPlacements.length,0);
 const stale=projectGosaijiSaiGuide([],{rows:[{...row,identityChanged:true}],unmappedCurrentLocations:[]});
 assert.equal(stale.entries[0].currentLocation,null);
 assert.match(stale.entries[0].movementBlockedReason??"",/identity/);
});
