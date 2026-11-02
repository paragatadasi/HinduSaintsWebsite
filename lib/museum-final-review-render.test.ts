import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {MuseumFinalReview} from "../components/admin/museum-final-review";
import type {FinalReviewRecord} from "./museum-final-review-view";

const record:FinalReviewRecord={sourceId:"one",name:"Test saint",tier:"Primary",section:"Test section",region:"East",city:"Puri",description:"Description",destination:"26",destinationShelf:null,addressed:false,flag:null,version:0,row:{sourceId:"one",name:"Test saint",saintId:"saint",original:{kind:"vitrine",code:"20",label:"Vitrine 20",shelf:"A"},current:{kind:"table",code:"staging-area",label:"Staging area"},currentBasis:"confirmed",currentVersion:1,currentRevision:"revision",sourceRevision:"source",fixedHousing:false,verifiedItemIds:[],identityChanged:false}};
function render(records:FinalReviewRecord[],mode:"final"|"unaddressed"="final"){
  return renderToStaticMarkup(React.createElement(MuseumFinalReview,{mode,records,vitrines:["20","26"],selected:"26",onSelect:()=>undefined,tones:{},canEdit:true,savingSources:new Set<string>(),pendingSources:new Set<string>(),errors:{},onAction:async()=>undefined,onRetry:async()=>undefined,renderWork:()=>null}));
}
test("final review keeps only the complete checklist and all three location labels",()=>{
  const html=render([record]);
  assert.match(html,/Complete vitrine checklist/);
  for(const label of ["Starting","Proposed","Current","Vitrine 20","Vitrine 26","Staging area"])assert.ok(html.includes(label));
  assert.doesNotMatch(html,/Confirm cleared|Shelf arrangement|Place the key saints/);
  assert.match(html,/aria-label="Finally review Test saint in Vitrine 26"/);
});
test("unaddressed renders flagged records separately and limits long lists",()=>{
  const records=Array.from({length:80},(_,index)=>({...record,sourceId:String(index),name:`Test saint ${index}`,flag:index===0?{type:"missing" as const,note:"Check staging"}:null}));
  const html=render(records,"unaddressed");
  assert.match(html,/Room layout/);
  assert.match(html,/All vitrines/);
  assert.match(html,/museum-companion__guide museum-review-panels/);
  assert.doesNotMatch(html,/Confirm cleared|Confirm space available/);
  assert.ok(html.indexOf("Flagged records")<html.indexOf("Remaining unaddressed records"));
  assert.equal((html.match(/museum-final-review__record/g)??[]).length,31);
  assert.match(html,/Check staging/);assert.match(html,/Resolve flag/);assert.match(html,/Page 1 of 3/);
});

test("already placed records remain unchecked until separately finally reviewed",()=>{
 const placed={...record,row:{...record.row,current:{kind:"vitrine" as const,code:"26",label:"Vitrine 26"}}};
 assert.doesNotMatch(render([placed]),/type="checkbox"[^>]*checked=""/);
 assert.match(render([{...placed,finallyReviewed:true}]),/type="checkbox"[^>]*checked=""/);
 assert.match(render([{...placed,finallyReviewed:true}]),/1 of 1 finally reviewed/);
});
