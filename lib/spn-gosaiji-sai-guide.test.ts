import test from "node:test";
import assert from "node:assert/strict";
import {gosaijiSaiMoveGuide as guide,gosaijiSaiGuideDefinition as definition,projectGosaijiSaiGuide} from "./spn-gosaiji-sai-guide";
import type {CompanionRow} from "./spn-move-guide";
test("Gosaiji and Sai phase preserves the approved 10/15 source partition and relationship qualifications",()=>{
 assert.deepEqual(guide.vitrines.map(v=>[v.code,v.families.flatMap(g=>g.sourceIds).length]),[["75",10],["37",10],["4",15]]);
 assert.equal(new Set(guide.entries.map(e=>e.sourceId)).size,35);
 assert.deepEqual(definition.physicalScope?.clearVitrines,["37"]);
 const edges=guide.vitrines.flatMap(v=>v.families.flatMap(g=>g.edges??[]));
 assert.equal(edges.filter(e=>e.fromSourceId==="recZxEDfwSCOpkXyC"&&e.label==="source-recorded disciple").length,2);
 assert.ok(edges.some(e=>e.toSourceId==="recwXrEbirWApVteB"&&e.label.endsWith("*")));
 assert.ok(edges.some(e=>e.fromSourceId==="recmnzklbsFkmcOUh"&&e.toSourceId==="rece342T8PgvjAtX9"&&e.label.startsWith("family")));
 assert.ok(!edges.some(e=>e.fromSourceId==="recDQE3wQ8BNrmIpR"&&e.toSourceId==="rec9cGrqgBRNKmfQV"));
 assert.match(guide.vitrines[2].summary,/5.47 \/ 5/);
 assert.equal(guide.entries.filter(e=>e.name.includes("Yogmaya")).length,2);
 assert.equal(guide.entries.find(e=>e.sourceId==="recRZkHSnl8nDNArl")?.saintId,null);
});
test("phase projection takes current ledger locations and blocks changed identity without fabricating staging",()=>{
 const entry=guide.entries.find(e=>e.destination==="37")!;
 const row:CompanionRow={sourceId:entry.sourceId,saintId:entry.saintId,name:entry.name,original:{kind:"vitrine",code:"4",label:"Vitrine 4"},current:{kind:"vitrine",code:"12",label:"Vitrine 12"},currentBasis:"confirmed",currentVersion:3,currentRevision:"x",sourceRevision:"y",fixedHousing:false,verifiedItemIds:[],identityChanged:false};
 const projected=projectGosaijiSaiGuide([],{rows:[row],unmappedCurrentLocations:[]});
 assert.equal(projected.entries.find(e=>e.sourceId===entry.sourceId)!.currentLocation?.code,"12");
 assert.equal(projected.entries.find(e=>e.sourceId===entry.sourceId)!.destination,"37");
 assert.equal(projected.reportedPlacements.length,0);
 const stale=projectGosaijiSaiGuide([],{rows:[{...row,identityChanged:true}],unmappedCurrentLocations:[]});
 assert.equal(stale.entries.find(e=>e.sourceId===entry.sourceId)!.currentLocation,null);
 assert.match(stale.entries.find(e=>e.sourceId===entry.sourceId)!.movementBlockedReason??"",/identity/);
});

test("Vitrine 75 comes first with availability acknowledgement and attributed staging only",()=>{
 assert.deepEqual(definition.physicalScope?.clearanceRequiredDestinations,["37","4"]);
 assert.deepEqual(definition.physicalScope?.preparationVitrines,["75"]);
 const entries=guide.entries.filter(e=>e.destination==="75");
 assert.equal(entries.filter(e=>e.reportedOrigin).length,7);
 assert.equal(guide.reportedPlacements.length,0);
 assert.equal(entries.find(e=>e.sourceId==="recqrHsjXJuayrZml")?.tier,"Secondary");
 const edges=guide.vitrines[0].families.flatMap(g=>g.edges??[]);
 assert.ok(edges.some(e=>e.toSourceId==="recgjan7BxjyG7CeZ"&&e.label==="host at Panihati"));
 assert.ok(!edges.some(e=>e.fromSourceId==="rec896V7fs1lwnSkY"||e.toSourceId==="rec896V7fs1lwnSkY"));
});
