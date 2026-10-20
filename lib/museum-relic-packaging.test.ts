import test from "node:test";
import assert from "node:assert/strict";
import {classifyRelicPackaging,summarizeRelicPackaging} from "./museum-relic-packaging";
import {plannerPackagingCounts,type PlannerRow} from "./museum-move-planner-domain";
test("column E distinguishes ordinary, small and mixed frames without assigning dimensions",()=>{
 assert.equal(classifyRelicPackaging("Frame").type,"frame");assert.equal(classifyRelicPackaging("Frame").size,"unspecified");
 assert.equal(classifyRelicPackaging("Small Frame / Paduka").type,"small_frame");assert.equal(classifyRelicPackaging("Small Frame / Box").size,"small");
 for(const text of ["Box / Frame","Frame / box","Box/Frame","Bag / Frame"]){const result=classifyRelicPackaging(text);assert.equal(result.type,"mixed_frame");assert.equal(result.hasOtherContainers,true);}
 for(const text of ["Box","Box / no picture","Urn"]){assert.equal(classifyRelicPackaging(text).type,"unframed");}
});
test("unknown labels and blanks remain unknown; no-picture does not assert absence of a frame",()=>{
 for(const text of [null,"", "no picture","no frame","framed?",42])assert.equal(classifyRelicPackaging(text).type,"unknown");
 const raw="  Frame  ";assert.equal(classifyRelicPackaging(raw).rawText,raw);assert.equal(classifyRelicPackaging(raw).sourceColumn,"E");
});
test("Sheet1 wins over contradictory comparison-sheet evidence, which remains inspectable",()=>{
 for(const [main,other] of [["Frame","Box / Frame"],["Box/Frame","Box"],["Box","Box / Frame"],["Frame","Box"]]){const result=classifyRelicPackaging(main,other);assert.equal(result.type,classifyRelicPackaging(main).type);assert.equal(result.reviewRequired,false);assert.equal(result.secondaryDisagrees,true);assert.equal(result.preferredSheet,"Sheet1");assert.equal(result.secondaryText,other);}
 assert.equal(classifyRelicPackaging("Box/Frame","Frame / box").type,"mixed_frame");assert.equal(classifyRelicPackaging("Frame","").type,"frame");assert.equal(classifyRelicPackaging("Box / no picture","Box").type,"unframed");
});
test("summaries deduplicate shared source IDs, preserve distinct observations and never multiply quantity",()=>{
 const a={id:"a",packaging:classifyRelicPackaging("Frame"),quantityText:"10"};
 const result=summarizeRelicPackaging([a,a,{id:"b",packaging:classifyRelicPackaging("Frame"),quantityText:"1"},{id:"c",packaging:classifyRelicPackaging("Box/Frame"),quantityText:"3"},{id:"d",packaging:classifyRelicPackaging("Small Frame / Box")},{id:"e",packaging:classifyRelicPackaging("Box")},{id:"f",packaging:classifyRelicPackaging("")},{id:"g",packaging:classifyRelicPackaging("Frame","Box")}]);
 assert.deepEqual(result,{sourceEntries:7,frameEntries:3,smallFrameEntries:1,mixedFrameEntries:1,unframedEntries:1,unknownEntries:1,conflictingEntries:0,reportedFrameEntries:5,reviewEntries:1,discrepancyEntries:1});
 assert.equal(summarizeRelicPackaging([{id:"shared",packagingText:"Frame"},{id:"shared",packagingText:"Box"}]).conflictingEntries,1);
});
test("family and section planner summaries deduplicate a multisubject source row",()=>{
 const source={id:"shared",packaging:classifyRelicPackaging("Frame")};const rows=[{saintId:"one",sources:[source]},{saintId:"two",sources:[source,{id:"other",packaging:classifyRelicPackaging("Box")}]}] as PlannerRow[];
 assert.equal(plannerPackagingCounts(rows).sourceEntries,2);assert.equal(plannerPackagingCounts(rows).frameEntries,1);assert.equal(plannerPackagingCounts([]).sourceEntries,0);
});
