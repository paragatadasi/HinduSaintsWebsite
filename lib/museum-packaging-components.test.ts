import test from "node:test";
import assert from "node:assert/strict";
import {summarizePackagingComponents} from "./museum-packaging-components";
import {classifyRelicPackaging} from "./museum-relic-packaging";
const source=(id:string,text:string,quantityText="99")=>({id,packaging:classifyRelicPackaging(text),quantityText});
test("mixed source labels contribute one of each distinct component while retaining one entry",()=>{
 const result=summarizePackagingComponents([source("a","Small Frame / Box"),source("b","Box / Frame"),source("c","Small Frame / Paduka"),source("d","Bag / Frame"),source("e","Urn"),source("f","Box / no picture")]);
 assert.deepEqual(result.components,{frame:2,small_frame:2,box:3,bag:1,urn:1,paduka:1});assert.equal(result.sourceEntries,6);assert.equal(result.mixedEntries,4);assert.equal(result.reviewEntries,0);
});
test("shared IDs and repeated label tokens never multiply components or relic quantities",()=>{
 const a=source("shared","Frame / Frame / Box","20");const result=summarizePackagingComponents([a,a,{...a,quantityText:"1"},source("distinct","Frame")]);assert.equal(result.sourceEntries,2);assert.equal(result.components.frame,2);assert.equal(result.components.box,1);
});
test("Sheet1 retains authority and secondary disagreement remains visible",()=>{
 const result=summarizePackagingComponents([{id:"a",packaging:classifyRelicPackaging("Small Frame / Box","Frame")}]);assert.equal(result.components.small_frame,1);assert.equal(result.components.box,1);assert.equal(result.components.frame,0);assert.equal(result.discrepancyEntries,1);
});
test("unknown and conflicting entries are held without guessing partial object counts",()=>{
 const result=summarizePackagingComponents([source("blank",""),source("picture","no picture"),source("partial","Frame / mystery"),source("conflict","Frame"),source("conflict","Box"),source("conflict","Box")]);assert.equal(result.sourceEntries,4);assert.equal(result.unknownEntries,3);assert.equal(result.conflictingEntries,1);assert.equal(result.reviewEntries,4);assert.ok(Object.values(result.components).every(n=>n===0));
});
test("normalized equivalent labels deduplicate and ordinary/small frames stay distinct",()=>{
 const result=summarizePackagingComponents([source("a","Small Frame / Box"),source("a"," box/small   frame "),source("b","Frame / Small Frame")]);assert.equal(result.conflictingEntries,0);assert.equal(result.components.small_frame,2);assert.equal(result.components.frame,1);assert.equal(result.components.box,1);
});