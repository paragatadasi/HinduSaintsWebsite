import assert from "node:assert/strict";
import test from "node:test";
import {projectVrindavanInventoryEntry, type InventoryObservationInput} from "./museum-source-inventory-domain";
const museum={id:"museum-vrindavan",name:"Vrindavan Museum",slug:"vrindavan"};
const row:InventoryObservationInput={id:"observation1",museumId:museum.id,sourceKey:`vrindavan-workbook:${"a".repeat(64)}:Sheet1:2`,status:"identity_linked",itemId:null,reviewedAt:new Date("2026-10-03T00:00:00Z"),rawJson:{cells:["Saint","Puri","Cloth and beads","2 pieces","Box",17,"3.4"]},normalizedJson:{mappingVersion:"vrindavan-identity-v1",sourceName:"Inventory.xlsx",sourceRow:2,name:"Saint",place:"Puri",relic:"Cloth and beads",quantity:"2 pieces",display:"17",position:"3.4",comments:"Keep together",warnings:["Source evidence warning"],saintIds:["saint1"],note:null}};
const data=row.normalizedJson as Record<string,unknown>;
test("confirmed source inventory preserves quantity, source geography, compound descriptions and exact position without inventing items",()=>{
 const entry=projectVrindavanInventoryEntry(row,museum,new Set(["saint1"]))!;
 assert.equal(entry.physicalItemId,null);assert.equal(entry.relicDescription,"Cloth and beads");
 assert.equal(entry.quantityText,"2 pieces");assert.equal(entry.packagingText,"Box");assert.equal(entry.sourcePlaceText,"Puri");
 assert.equal(entry.sourceLocation?.code,"17/3.4");assert.equal(entry.sourceLocation?.positionText,"3.4");
 assert.equal(entry.sourceLocation?.museumId,"museum-vrindavan");assert.equal(entry.sourceLocation?.evidence,"source_reported");
 assert.equal(entry.comments,"Keep together");assert.deepEqual(entry.saintIds,["saint1"]);
});
test("pending or foreign-museum observations cannot enter the confirmed Vrindavan pilot",()=>{
 for(const status of ["pending","deferred","imported"])assert.equal(projectVrindavanInventoryEntry({...row,status},museum,new Set()),null);
 assert.equal(projectVrindavanInventoryEntry({...row,museumId:"museum-spn"},museum,new Set()),null);
 assert.equal(projectVrindavanInventoryEntry(row,{...museum,id:"museum-spn"},new Set()),null);
 assert.equal(projectVrindavanInventoryEntry({...row,sourceKey:"airtable:source"},museum,new Set()),null);
});
test("removed or archived targets remain visible as warnings without active saint linkage",()=>{
 const entry=projectVrindavanInventoryEntry(row,museum,new Set())!;
 assert.deepEqual(entry.saintIds,[]);assert.deepEqual(entry.unavailableSaintIds,["saint1"]);assert.equal(entry.warnings.length,2);
});
test("unknown display remains unknown; a position cannot manufacture a location",()=>{
 const entry=projectVrindavanInventoryEntry({...row,normalizedJson:{...data,display:""}},museum,new Set(["saint1"]))!;
 assert.equal(entry.sourceLocation,null);assert.equal(entry.positionText,"3.4");assert.ok(entry.warnings.some(w=>w.includes("without a display")));
});
test("source identity/row mismatch and absent or duplicate identity decisions are rejected",()=>{
 for(const patch of [{sourceRow:3},{saintIds:[]},{saintIds:["saint1","saint1"]},{mappingVersion:"unsupported"}])
 assert.equal(projectVrindavanInventoryEntry({...row,normalizedJson:{...data,...patch}},museum,new Set(["saint1"])),null);
});
test("display and position labels cannot collide through delimiter characters",()=>{
 const entry=projectVrindavanInventoryEntry({...row,normalizedJson:{...data,display:"1/2",position:"A/B"}},museum,new Set(["saint1"]))!;
 assert.equal(entry.sourceLocation?.code,"1%2F2/A%2FB");assert.equal(entry.sourceLocation?.displayText,"1/2");
});