import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {db} from "../lib/db";
import {starterMoveGuide as guide} from "../lib/spn-starter-move-guide";
const url=new URL(process.env.DATABASE_URL??"http://invalid");
if(url.hostname!=="localhost"||url.pathname!=="/museum_intake_test_20261027")throw new Error("Use only the disposable companion test database.");
const base="http://localhost:3008";
const user=await db.user.create({data:{email:`move-http-${randomUUID()}@example.invalid`,roles:["curator"]}});
const token=randomUUID();await db.session.create({data:{userId:user.id,sessionToken:token,expires:new Date(Date.now()+600000)}});
const request=(path:string,body?:unknown)=>fetch(base+path,{method:body?"POST":"GET",headers:{Cookie:`authjs.session-token=${token}`,Origin:base,...(body?{"Content-Type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{})});
let sourceId:string|undefined;
let suggestionId:string|undefined;
try{
 const physicalPath="/api/admin/museum-physical-locations";
 const get=await request(physicalPath);assert.equal(get.status,200,await get.clone().text());const before=await get.json();
 const row=before.rows.find((r:{saintId:string|null;fixedHousing:boolean;verifiedItemIds:string[];currentVersion:number;sourceId:string})=>!r.saintId&&!r.fixedHousing&&!r.verifiedItemIds.length&&!r.currentVersion&&guide.entries.some(e=>e.sourceId===r.sourceId));
 assert.ok(row);sourceId=row.sourceId;
 const context={guideVersion:guide.version,contentDigest:guide.contentDigest,assignmentDigest:guide.assignmentDigest};
 const body={museumId:"museum-spn",clientRequestId:randomUUID(),confirmedDate:"2026-10-27",datePrecision:"date",evidence:"Disposable HTTP integration test",physicalConfirmation:true,inventoryAcknowledged:true,guideContext:context,records:[{sourceId:row.sourceId,saintId:null,expectedCurrentRevision:row.currentRevision,expectedSourceRevision:row.sourceRevision,expectedLocationVersion:row.currentVersion,to:{kind:"vitrine",code:"27",label:"Vitrine 27"}}]};
 const saved=await request(physicalPath,body);assert.equal(saved.status,200,await saved.clone().text());
 const replay=await request(physicalPath,body);assert.equal(replay.status,200);assert.equal((await replay.json()).replayed,true);
 const reopened=await(await request(physicalPath+"?sourceId="+row.sourceId)).json();assert.equal(reopened.rows[0].current.code,"27");assert.equal(reopened.rows[0].currentBasis,"confirmed");assert.deepEqual(reopened.rows[0].original,row.original);
 const stale=await request(physicalPath,{...body,clientRequestId:randomUUID()});assert.equal(stale.status,409);
 const decisionsPath="/api/admin/museum-guide-decisions";
 const initial=await(await request(decisionsPath+"?guideVersion="+guide.version)).json();
 const candidate=initial.suggestions.find((s:{id:string})=>!initial.decisions.some((d:{suggestionId:string})=>d.suggestionId===s.id));assert.ok(candidate);suggestionId=candidate.id;
 const decisionBody={museumId:"museum-spn",...context,suggestionId,expectedVersion:0,clientRequestId:randomUUID(),decision:"deferred"};
 const decided=await request(decisionsPath,decisionBody);assert.equal(decided.status,200,await decided.clone().text());
 const refreshed=await(await request(decisionsPath+"?guideVersion="+guide.version)).json();assert.equal(refreshed.decisions.find((d:{suggestionId:string})=>d.suggestionId===suggestionId).decision,"deferred");
 const afterDecision=await(await request(physicalPath+"?sourceId="+row.sourceId)).json();assert.equal(afterDecision.rows[0].currentRevision,reopened.rows[0].currentRevision);
 console.log("PASS: authenticated physical save, reopen, exact retry, stale conflict, durable defer and unchanged physical location.");
}finally{
 if(sourceId)await db.museumMoveCurrentLocation.deleteMany({where:{museumId:"museum-spn",sourceId}});
 if(suggestionId)await db.museumGuideSuggestionDecision.deleteMany({where:{museumId:"museum-spn",guideVersion:guide.version,suggestionId}});
 await db.auditEvent.deleteMany({where:{userId:user.id}});await db.session.deleteMany({where:{userId:user.id}});await db.user.delete({where:{id:user.id}});await db.$disconnect();
}
