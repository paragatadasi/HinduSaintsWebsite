import test from "node:test";
import assert from "node:assert/strict";
import type {MuseumSourceInventoryEntry} from "./museum-source-inventory-domain";
import {projectVrindavanInventoryReadiness} from "./vrindavan-inventory-readiness-domain";
import {REVIEWED_MUSEUM_BATCH} from "./reviewed-museum-correction-domain";
const entry={saintIds:["somappar"],unavailableSaintIds:[],physicalItemId:null,relicDescription:"Cloth / mala",quantityText:"3",displayText:"17",positionText:"3.4",sourcePlaceText:"Mayapur",comments:"",warnings:[],sourceLocation:{code:"17/3.4"}} as unknown as MuseumSourceInventoryEntry;
test("source text never becomes verified physical objects or placement",()=>{
 const row=projectVrindavanInventoryReadiness(entry);
 assert.equal(row.quantityKind,"positive_integer_text");assert.equal(row.quantityText,"3");assert.equal(row.positionText,"3.4");
 assert.equal(row.physicalPlacementVerified,false);assert.ok(row.reviewReasons.includes("physical_object_identity_required"));
 assert.equal(entry.physicalItemId,null);
});
test("compound and missing quantities require interpretation, not numeric coercion",()=>{
 for(const value of ["","1 / 2","2-3","3.4","0"]){const row=projectVrindavanInventoryReadiness({...entry,quantityText:value});assert.ok(row.reviewReasons.includes("quantity_clarification_required"));assert.equal(row.quantityText,value);}
});
test("reviewed source error is saint-scoped and preserves raw source geography",()=>{
 const decision={batch:REVIEWED_MUSEUM_BATCH,saintId:"somappar",section:null,note:"Retain Madurai",sourcePlaceError:"Mayapur"} as const;
 const row=projectVrindavanInventoryReadiness({...entry,saintIds:["somappar","other"],sourcePlaceText:" MAYAPUR "},[decision]);
 assert.deepEqual(row.sourceGeographyUsableForSaintIds,["other"]);assert.equal(row.sourcePlaceText," MAYAPUR ");
 assert.equal(row.geographyReviews[0].sourcePlaceExcluded,true);
 assert.deepEqual(projectVrindavanInventoryReadiness({...entry,sourcePlaceText:"Madurai"},[decision]).sourceGeographyUsableForSaintIds,["somappar"]);
});
test("unavailable identities, missing location and notes remain review reasons",()=>{
 const row=projectVrindavanInventoryReadiness({...entry,saintIds:[],unavailableSaintIds:["archived"],sourceLocation:null,comments:"Moved?"});
 assert.ok(row.reviewReasons.includes("identity_reconciliation_required"));assert.ok(row.reviewReasons.includes("source_display_missing"));assert.ok(row.reviewReasons.includes("source_notes_require_review"));
});
