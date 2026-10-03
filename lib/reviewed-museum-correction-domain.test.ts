import assert from "node:assert/strict";
import test from "node:test";
import type {MuseumSaintPlacement} from "./museum-proposals";
import {applyReviewedMuseumProposal,reviewedDecisionSchema,REVIEWED_MUSEUM_BATCH,reviewedSaints} from "./reviewed-museum-correction-domain";
const row={id:"source",section:"Gujarat & Swaminarayan Traditions",alternatives:["Girnar & Nath Traditions"],rationale:"Old geography",note:"Old note",tier:"Tertiary",familyId:"",collectionItems:[]} as unknown as MuseumSaintPlacement;
test("reviewed Gaudiya lineage overrides geographic proposal without changing tier, family or inventory",()=>{
 const target=reviewedSaints[1],decision={batch:REVIEWED_MUSEUM_BATCH,saintId:target.id,section:target.section,note:target.note,sourcePlaceError:null};
 const changed=applyReviewedMuseumProposal(row,decision);
 assert.equal(changed.section,"Gaudiya Vaishnava");assert.equal(changed.tier,"Tertiary");assert.equal(changed.familyId,row.familyId);assert.equal(changed.collectionItems,row.collectionItems);
 assert.ok(changed.alternatives.includes(row.section));assert.equal(row.section,"Gujarat & Swaminarayan Traditions");
});
test("Somappar erroneous source geography produces no section override",()=>{
 const target=reviewedSaints[2];assert.equal(applyReviewedMuseumProposal(row,{batch:REVIEWED_MUSEUM_BATCH,saintId:target.id,section:null,note:target.note,sourcePlaceError:"Mayapur"}),row);
 assert.equal(applyReviewedMuseumProposal(row,undefined),row);
});
test("other batch data is excluded from approved decision projection",()=>{
 assert.equal(reviewedDecisionSchema.safeParse({batch:"unknown",saintId:"id",section:"Gaudiya",note:"",sourcePlaceError:null}).success,false);
});