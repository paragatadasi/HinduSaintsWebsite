import test from "node:test";
import assert from "node:assert/strict";
import {buildVrindavanReviewBatches,vrindavanReviewBatch} from "./vrindavan-review-batches";
import type {IdentityMatch} from "./vrindavan-identity-domain";
const hash="a".repeat(64),other="b".repeat(64);
function row(id:string,category:IdentityMatch["category"]="possible",candidates=1,status="pending",snapshot=hash){return {row:{id,sourceKey:`vrindavan-workbook:${snapshot}:Sheet1:${id.replace(/\D/g,"")||1}`,status,itemId:null as string|null,observedAt:new Date("2026-10-03")},data:{sourceRow:Number(id.replace(/\D/g,"")||1),name:"Saint",saintIds:[] as string[]},identity:{category,method:"Test",candidates:Array.from({length:candidates},(_,i)=>({id:`saint${i}`,displayName:"Saint",canonicalName:"Saint",slug:"saint",status:"draft",aliases:[]}))},missingReviewedTarget:false};}
test("remaining batches retain pending/deferred and preserve confirmed decisions",()=>{
 const result=buildVrindavanReviewBatches([row("r1","clear",1,"identity_linked"),row("r2"),row("r3","ambiguous",2,"deferred")],hash);
 assert.equal(result.summary.confirmedRows,1);assert.equal(result.summary.remainingRows,2);
 assert.equal(result.batches.find(b=>b.key==="variants")?.rows.length,1);assert.equal(result.batches.find(b=>b.key==="competing")?.rows.length,1);
 assert.deepEqual(result.confirmed[0].data.saintIds,[]);
});
test("combined person and item-linked evidence override ordinary match confidence",()=>{
 assert.equal(vrindavanReviewBatch({...row("r1","clear"),data:{sourceRow:1,name:"Saint A & Saint B",saintIds:[]}}),"combined");
 assert.equal(vrindavanReviewBatch({...row("r1"),row:{...row("r1").row,itemId:"item"}}),"blocked");
 assert.equal(vrindavanReviewBatch(row("r1","possible",0)),"unmatched");
});
test("latest source observation supersedes old decisions and snapshots do not mix",()=>{
 const old=row("old1","clear",1,"identity_linked"),latest=row("new1","unmatched",0);
 latest.row.observedAt=new Date("2026-10-04");
 const result=buildVrindavanReviewBatches([old,latest,row("r2","clear",1,"pending",other)],hash);
 assert.deepEqual(result.current.map(p=>p.row.id),["new1"]);assert.equal(result.summary.confirmedRows,0);
 assert.throws(()=>buildVrindavanReviewBatches([old],"c".repeat(64)),/unavailable/);
});
test("confirmed unavailable links are alerts, not automatic rematches",()=>{
 const confirmed={...row("r1","unmatched",0,"identity_linked"),missingReviewedTarget:true};
 const result=buildVrindavanReviewBatches([confirmed],hash);
 assert.equal(result.confirmedLinkAlerts.length,1);assert.equal(result.remaining.length,0);
 assert.equal(result.repeatedNames.length,0);
});
