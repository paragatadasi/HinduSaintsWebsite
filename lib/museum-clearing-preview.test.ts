import test from "node:test";
import assert from "node:assert/strict";
import {clearingPreview,clearingSavedMessage} from "./museum-clearing-preview";
import {isPlaced} from "./spn-move-guide";
import type {CompanionRow} from "./spn-move-guide";
const row=(sourceId:string,code="50",currentBasis="source"):CompanionRow=>({sourceId,saintId:null,name:sourceId,current:{kind:"vitrine",code,label:code},original:{kind:"vitrine",code:"50",label:"50"},currentBasis,currentVersion:0,currentRevision:"r",sourceRevision:"s",identityChanged:false,fixedHousing:false,verifiedItemIds:[]});
test("bulk preview stages residuals and preserves target placements and later moves",()=>{
 const result=clearingPreview([row("old"),row("placed","50","confirmed"),row("elsewhere","9","confirmed"),row("unknown","50","confirmed"),row("outgoing","50","confirmed")],[{sourceId:"placed",destination:"50"},{sourceId:"outgoing",destination:"51"}],"50");
 assert.deepEqual(result.remaining.map(r=>r.sourceId),["old","outgoing"]);
 assert.deepEqual(result.preserved.map(r=>r.sourceId),["placed","unknown"]);
});
test("all-preserved and empty cases have no staging targets and summary does not claim empty",()=>{
 assert.equal(clearingPreview([row("placed","50","confirmed")],[{sourceId:"placed",destination:"50"}],"50").remaining.length,0);
 assert.deepEqual(clearingPreview([],[],"50"),{remaining:[],preserved:[]});
 assert.equal(clearingSavedMessage({stagedCount:2,preservedCount:3}),"2 staged · 3 placements preserved.");
});

 test("component placement follows the selected pieces without relocating the separate collection",()=>{
 const pieces:CompanionRow={...row("pieces"),current:null,componentPlacement:{sourceId:"pieces",receiptId:"receipt",recordedAt:"2026-11-01",revision:"component",origin:{kind:"vitrine",code:"19",label:"Vitrine 19"},location:{kind:"vitrine",code:"47",label:"Vitrine 47"},scope:"vitrine_19_contents_only",excludedWalkingSticks:{location:null,status:"unverified"},expectedSourceRevision:"s",previousCurrentRevision:"r",previousLocationVersion:0}};
 assert.equal(isPlaced(pieces,"47"),true);
 assert.equal(isPlaced(pieces,"19"),false);
 assert.equal(clearingPreview([pieces],[{sourceId:"pieces",destination:"47"}],"47").preserved.length,1);
 assert.equal(clearingPreview([pieces],[{sourceId:"pieces",destination:"48"}],"47").remaining.length,1);
 assert.equal(clearingPreview([pieces],[],"19").remaining.length,0);
 assert.equal(pieces.current,null);
 assert.deepEqual(pieces.componentPlacement?.excludedWalkingSticks,{location:null,status:"unverified"});
 });
