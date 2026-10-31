import "dotenv/config";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {readdir,readFile} from "node:fs/promises";
import pg from "pg";

const configured=new URL(process.env.DATABASE_URL??"postgresql://invalid/invalid");
if(!["localhost","127.0.0.1","[::1]"].includes(configured.hostname))throw new Error("Use a localhost development PostgreSQL server.");
const databaseName=`museum_guide_decision_test_${randomUUID().replaceAll("-","")}`;
assert.match(databaseName,/^museum_guide_decision_test_[a-f0-9]{32}$/);
const adminUrl=new URL(configured);adminUrl.pathname="/postgres";
const testUrl=new URL(configured);testUrl.pathname=`/${databaseName}`;
const admin=new pg.Client({connectionString:adminUrl.href,connectionTimeoutMillis:5000});
await admin.connect();
await admin.query(`CREATE DATABASE "${databaseName}"`);
const sql=new pg.Client({connectionString:testUrl.href});
let app:typeof import("../lib/db")|undefined;
try{
 await sql.connect();
 assert.equal((await sql.query("SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema='public'")).rows[0].n,0);
 const migration="20261031000000_museum_not_on_display_decision";
 for(const name of (await readdir("prisma/migrations")).filter(n=>/^\d/.test(n)).sort()){
  if(name!==migration)await sql.query(await readFile(`prisma/migrations/${name}/migration.sql`,"utf8"));
 }
 process.env.DATABASE_URL=testUrl.href;
 app=await import("../lib/db");
 const {saveMuseumGuideDecision,readMuseumGuideDecisions}=await import("../lib/museum-guide-decisions");
 const context={guideVersion:"local-decision-regression",contentDigest:"a".repeat(64),assignmentDigest:"b".repeat(64)};
 const loader=()=>({context,suggestions:["first","other"].map(id=>({id:`row:${id}`,kind:"row" as const,sourceIds:[id],targetVitrine:"23"}))});
 const curator={id:"local-decision-test-curator",canManage:true};
 const request=(decision:"declined"|"pending"|"not_on_display",expectedVersion:number,extra:Record<string,unknown>={})=>({museumId:"museum-spn",...context,suggestionId:"row:first",decision,expectedVersion,clientRequestId:randomUUID(),note:"Local test evidence",...extra});
 const first=await saveMuseumGuideDecision(request("declined",0,{alternativeVitrine:"26",alternativeShelf:"3.10"}),curator,loader);
 const other=await saveMuseumGuideDecision(request("declined",0,{suggestionId:"row:other",alternativeVitrine:"27",alternativeShelf:"B"}),curator,loader);
 const notDisplayed=request("not_on_display",1);
 await assert.rejects(saveMuseumGuideDecision(notDisplayed,curator,loader),/decision_check|check constraint/i);
 assert.equal(await app.db.auditEvent.count(),2,"A rejected write must leave no audit receipt.");
 assert.equal((await readMuseumGuideDecisions(context.guideVersion,loader)).decisions.find(r=>r.suggestionId==="row:first")!.version,1);
 await sql.query(await readFile(`prisma/migrations/${migration}/migration.sql`,"utf8"));
 const saved=await saveMuseumGuideDecision(notDisplayed,curator,loader);
 assert.equal(saved.replayed,false);assert.equal(saved.decision!.decision,"not_on_display");assert.equal(saved.decision!.version,2);
 assert.equal(saved.decision!.alternativeVitrine,null);assert.equal(saved.decision!.alternativeShelf,null);
 const retry=await saveMuseumGuideDecision(notDisplayed,curator,loader);
 assert.equal(retry.replayed,true);assert.equal(retry.receipt.id,saved.receipt.id);assert.equal(retry.decision!.version,2);
 assert.equal(await app.db.auditEvent.count(),3);
 assert.equal((await readMuseumGuideDecisions(context.guideVersion,loader)).decisions.find(r=>r.suggestionId==="row:first")!.decision,"not_on_display");
 await assert.rejects(saveMuseumGuideDecision(request("pending",1),curator,loader),/reviewed elsewhere/);
 const reset=await saveMuseumGuideDecision(request("pending",2),curator,loader);
 assert.equal(reset.decision!.decision,"pending");assert.equal(reset.decision!.version,3);
 const readback=await readMuseumGuideDecisions(context.guideVersion,loader);
 assert.deepEqual(readback.decisions.find(r=>r.suggestionId==="row:other"),{suggestionId:"row:other",decision:"declined",note:"Local test evidence",alternativeVitrine:"27",alternativeShelf:"B",version:1,updatedAt:other.decision!.updatedAt});
 const originalReceipt=await app.db.auditEvent.findUniqueOrThrow({where:{id:first.receipt.id}});
 assert.equal((originalReceipt.afterJson as {decision:{alternativeShelf:string}}).decision.alternativeShelf,"3.10");
 assert.ok(await app.db.auditEvent.findUnique({where:{id:saved.receipt.id}}));
 await assert.rejects(sql.query('UPDATE "MuseumGuideSuggestionDecision" SET "decision"=$1 WHERE "suggestionId"=$2',["invalid_state","row:first"]),error=>(error as {code:string}).code==="23514");
 assert.equal(await app.db.museumMoveCurrentLocation.count(),0);assert.equal(await app.db.museumArrangement.count(),0);assert.equal(await app.db.museumItemPlacement.count(),0);
 console.log(JSON.stringify({baselineFailureReproduced:true,save:true,retryIdempotent:true,readback:true,reset:true,staleVersionRejected:true,otherAlternativeUnchanged:true,historyPreserved:true,invalidStateRejected:true,physicalWrites:false,isolatedDatabase:true}));
}finally{
 await app?.db.$disconnect();
 await sql.end();
 await admin.query(`DROP DATABASE "${databaseName}"`);
 await admin.end();
}
