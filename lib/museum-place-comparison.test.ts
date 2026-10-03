import assert from "node:assert/strict";
import test from "node:test";
import {compareMuseumSourcePlace,type SaintComparisonPlace} from "./museum-place-comparison";
const place:SaintComparisonPlace={id:"pandharpur",name:"Pandharpur",alternateNames:[],region:"Maharashtra",country:"India",placeKind:"locality",placeType:"primary"};
test("expanded source place overlaps known locality without asserting a correction",()=>{
 const result=compareMuseumSourcePlace("Gopalpur, Pandharpur",[place],[place]);
 assert.equal(result.category,"overlapping_association");assert.equal(result.matchesPrimary,true);assert.equal(result.needsResearch,false);
 assert.equal(result.catalogueCandidates[0].id,place.id);
});
test("country suffix and supplied aliases compare to existing locality",()=>{
 assert.equal(compareMuseumSourcePlace("Pandharpur",[{...place,name:"Pandharpur, India"}],[place]).category,"existing_association");
 assert.equal(compareMuseumSourcePlace("Brindavan",[{...place,name:"Vrindavan",alternateNames:["Brindavan"]}],[place]).category,"existing_association");
});
test("a different place is research evidence, not a silent replacement",()=>{
 const result=compareMuseumSourcePlace("Vrindavan",[place],[place,{...place,id:"vraj",name:"Vrindavan"}]);
 assert.equal(result.category,"different_or_unrecognized");assert.equal(result.needsResearch,true);assert.deepEqual(result.matchedPlaceIds,[]);
 assert.equal(result.catalogueCandidates[0].id,"vraj");assert.equal(place.name,"Pandharpur");
});
test("missing source geography does not justify adjustment",()=>{
 const result=compareMuseumSourcePlace("",[place],[place]);assert.equal(result.category,"missing_source_place");assert.equal(result.needsResearch,false);assert.deepEqual(result.catalogueCandidates,[]);
});
test("spiritual-region names never masquerade as locality agreement",()=>{
 assert.equal(compareMuseumSourcePlace("Pandharpur",[{...place,placeKind:"spiritual_region"}],[{...place,placeKind:"spiritual_region"}]).category,"different_or_unrecognized");
});