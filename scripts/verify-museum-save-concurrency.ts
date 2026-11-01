import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {readFile,readdir} from "node:fs/promises";
import dotenv from "dotenv";
import pg from "pg";
import type {MoveSnapshot} from "../lib/museum-move-session-domain";

dotenv.config({path: ".env.local", quiet: true});
const url = new URL(process.env.DATABASE_URL ?? "postgresql://invalid/invalid");
if (!["localhost","127.0.0.1","[::1]"].includes(url.hostname) || !/^\/museum_physical_test_concurrency_[a-z0-9_]+$/.test(url.pathname))
  throw new Error("Use a fresh disposable localhost museum_physical_test_concurrency_ database.");
const sql = new pg.Client({connectionString: url.href});
await sql.connect();
assert.equal((await sql.query("SELECT COUNT(*)::int AS n FROM information_schema.tables WHERE table_schema='public'")).rows[0].n, 0);
for (const name of (await readdir("prisma/migrations")).filter(name => /^\d/.test(name)).sort())
  await sql.query(await readFile(`prisma/migrations/${name}/migration.sql`, "utf8"));
await sql.end();

const {db} = await import("../lib/db");
const api = await import("../lib/museum-physical-locations");
const {saveCompanionWork} = await import("../lib/museum-companion-work");
const {SPN_WEBSITE_AIRTABLE_BASE_ID} = await import("../lib/museum-vitrine-source");
const {withMuseumTransactionReads} = await import("../lib/museum-transaction-reads");
const {readMuseumData} = await import("../lib/museum-working-data");
const {buildLatestSpnReview} = await import("../lib/spn-reviewed-proposal");
const approvedTarget=buildLatestSpnReview([]).rows.find(row=>row.effectiveVitrine==="50"&&row.saintId)!;
assert.ok(approvedTarget,"A current approved V50 target is required for this fixture");
const actor = {id: "concurrency-curator", canManage: true};
const vitrine = (code: string) => ({kind: "vitrine" as const, code, label: `Vitrine ${code}`});
const ids = ["a","b","c","d","same","replay","incoming","outgoing","shelf-a","shelf-b","clear-a","incoming-a","clear-b","incoming-b","residual","later-move","not-in-case",approvedTarget.sourceId];
const snapshot: MoveSnapshot = {
  proposalVersion: "concurrency-test", title: "Local concurrency fixture", vitrineCodes: ["1","2","3","4","5","6","50"],
  guidance: {version: "test", reviewStatus: "local fixture"},
  rows: ids.map(sourceId => ({sourceId, saintId: sourceId===approvedTarget.sourceId?approvedTarget.saintId:"fixture-saint", name: sourceId,
    sourceKey: `${SPN_WEBSITE_AIRTABLE_BASE_ID}:Saints:${sourceId}`,
    sourceReported: vitrine(["residual","later-move",approvedTarget.sourceId].includes(sourceId)?"50":sourceId === "outgoing" ? "3" : sourceId === "clear-a" ? "5" : sourceId === "clear-b" ? "6" : "1"), destination: vitrine("2"), holdReason: "", fixedHousing: false}))
};
let active = 0, peak = 0, loaderCalls = 0;
const loader = async () => {
  active++; peak = Math.max(peak, active); loaderCalls++;
  try { await new Promise(resolve => setTimeout(resolve, 100)); return structuredClone(snapshot); }
  finally { active--; }
};
const request = async (sourceId: string, target: string) => {
  const row = (await api.readPhysicalLocationView(loader, db, [sourceId], false)).rows[0];
  return {museumId: "museum-spn" as const, clientRequestId: randomUUID(), confirmedDate: "2026-11-01", datePrecision: "date" as const,
    evidence: "Disposable local concurrent-user test", physicalConfirmation: true as const, inventoryAcknowledged: true as const,
    records: [{sourceId, saintId: row.saintId, expectedCurrentRevision: row.currentRevision,
      expectedSourceRevision: row.sourceRevision, expectedLocationVersion: row.currentVersion, to: vitrine(target)}]};
};
const isConflict = (result: PromiseSettledResult<unknown>) => result.status === "rejected" &&
  result.reason && typeof result.reason === "object" && result.reason.status === 409;
try {
  await db.externalRecord.createMany({data: ids.map(id => ({sourceType: "airtable", externalId: `${SPN_WEBSITE_AIRTABLE_BASE_ID}:Saints:${id}`,
    entityType: "Saint", entityId: id===approvedTarget.sourceId?approvedTarget.saintId!:"fixture-saint", rawPayloadJson: {fixture: true}}))});
  const independent = await Promise.all([request("a","2"),request("b","4"),request("c","2"),request("d","4")]);
  peak = 0; loaderCalls = 0;
  let started = performance.now();
  const separate = await Promise.all(independent.map(input => api.confirmMuseumPhysicalLocations(input, actor, loader)));
  const independentMs = performance.now() - started;
  assert.ok(peak >= 2, "The four concurrent requests must allow overlapping save transactions");
  assert.deepEqual(separate.map(r => r.rows[0].current?.code), ["2","4","2","4"]);
  const distinctPeak = peak;

  const same = await request("same","2");
  const conflict = await Promise.allSettled([
    api.confirmMuseumPhysicalLocations(same, actor, loader),
    api.confirmMuseumPhysicalLocations({...same,clientRequestId: randomUUID(),records: same.records.map(r => ({...r,to:vitrine("4")}))}, actor, loader)
  ]);
  assert.equal(conflict.filter(r => r.status === "fulfilled").length, 1);
  assert.equal(conflict.filter(isConflict).length, 1);

  const replay = await request("replay","2");
  const replayed = await Promise.all([api.confirmMuseumPhysicalLocations(replay, actor, loader),api.confirmMuseumPhysicalLocations(replay, actor, loader)]);
  assert.equal(replayed[0].receipt?.id, replayed[1].receipt?.id);
  assert.equal(replayed.filter(r => r.replayed).length, 1);
  assert.equal(await db.auditEvent.count({where: {entityType:"MuseumPhysicalConfirmation",entityId:`museum-spn:${replay.clientRequestId}`}}), 1);
  await assert.rejects(api.confirmMuseumPhysicalLocations({...replay,evidence:"Changed request payload"}, actor, loader), /already recorded/);

  const incoming = await request("incoming","3");
  const outgoing = await request("outgoing","4");
  const clear = {...outgoing, clearedVitrines: ["3"], records: outgoing.records.map(r => ({...r,to:{kind:"table",code:"staging-area",label:"Staging area"}}))};
  const race = await Promise.allSettled([
    api.confirmMuseumPhysicalLocations(clear,actor,loader), api.confirmMuseumPhysicalLocations(incoming,actor,loader)
  ]);
  assert.equal(race[1].status,"fulfilled");
  assert.ok(race[0].status === "fulfilled" || isConflict(race[0]));
  const now = await api.readPhysicalLocationView(loader,db,undefined,false);
  assert.equal(now.rows.find(r=>r.sourceId==="incoming")?.current?.code,"3");
  if(race[0].status === "fulfilled") assert.equal(now.rows.find(r=>r.sourceId==="outgoing")?.current?.kind,"table");
  else assert.equal(now.rows.find(r=>r.sourceId==="outgoing")?.current?.code,"3");

  for (const clearFirst of [true,false]) {
    const suffix=clearFirst?"a":"b", code=clearFirst?"5":"6";
    const incomingRequest=await request(`incoming-${suffix}`,code);
    const out=await request(`clear-${suffix}`,"4");
    const clearRequest={...out,clearedVitrines:[code],records:out.records.map(r=>({...r,to:{kind:"table",code:"staging-area",label:"Staging area"}}))};
    let entered!:()=>void, release!:()=>void;
    const ready=new Promise<void>(resolve=>{entered=resolve;});
    const gate=new Promise<void>(resolve=>{release=resolve;});
    let first=true;
    const gatedLoader=async()=>{if(first){first=false;entered();await gate;}return loader();};
    const leading=api.confirmMuseumPhysicalLocations(clearFirst?clearRequest:incomingRequest,actor,gatedLoader);
    await ready;
    const trailing=api.confirmMuseumPhysicalLocations(clearFirst?incomingRequest:clearRequest,actor,loader);
    // Give the second service a connection while the first holds the barrier.
    await new Promise(resolve=>setTimeout(resolve,50));
    release();
    const ordered=await Promise.allSettled([leading,trailing]);
    assert.equal(ordered[0].status,"fulfilled");
    if(clearFirst)assert.equal(ordered[1].status,"fulfilled");
    else assert.equal(ordered[1].status,"fulfilled","A waiting residual clear preserves the new confirmed occupant");
    const checked=await api.readPhysicalLocationView(loader,db,[`incoming-${suffix}`,`clear-${suffix}`],false);
    assert.equal(checked.rows.find(r=>r.sourceId===`incoming-${suffix}`)?.current?.code,code);
    assert.equal(checked.rows.find(r=>r.sourceId===`clear-${suffix}`)?.current?.code,"staging-area");
  }

  // A stale whole-case request must preserve both a confirmed target in this
  // case and an occupant placed elsewhere after the request was prepared.
  const initial=await api.readPhysicalLocationView(loader,db,[approvedTarget.sourceId,"residual","later-move"],false);
  const clearRecords=initial.rows.map(row=>({sourceId:row.sourceId,saintId:row.saintId,expectedCurrentRevision:row.currentRevision,
    expectedSourceRevision:row.sourceRevision,expectedLocationVersion:row.currentVersion,to:{kind:"table" as const,code:"staging-area",label:"Staging area"}}));
  await api.confirmMuseumPhysicalLocations(await request(approvedTarget.sourceId,"50"),actor,loader);
  await api.confirmMuseumPhysicalLocations(await request("later-move","4"),actor,loader);
  const beforeProtected=await db.museumMoveCurrentLocation.findMany({where:{sourceId:{in:[approvedTarget.sourceId,"later-move"]}},orderBy:{sourceId:"asc"}});
  const residualRequest={...await request("residual","2"),clearedVitrines:["50"],records:clearRecords};
  const residualResult=await api.confirmMuseumPhysicalLocations(residualRequest,actor,loader);
  assert.equal(residualResult.residualClearing?.stagedCount,1);
  assert.deepEqual(residualResult.residualClearing?.preservedSourceIds,[approvedTarget.sourceId,"later-move"].sort());
  assert.equal((residualResult.receipt?.afterJson as {emptyCaseClaim:string}).emptyCaseClaim,"none");
  assert.deepEqual(await db.museumMoveCurrentLocation.findMany({where:{sourceId:{in:[approvedTarget.sourceId,"later-move"]}},orderBy:{sourceId:"asc"}}),beforeProtected);
  const residualReplay=await api.confirmMuseumPhysicalLocations(residualRequest,actor,loader);
  assert.equal(residualReplay.receipt?.id,residualResult.receipt?.id);
  assert.deepEqual(residualReplay.residualClearing,residualResult.residualClearing);
  const zero=await api.confirmMuseumPhysicalLocations({...residualRequest,clientRequestId:randomUUID(),records:[]},actor,loader);
  assert.equal(zero.residualClearing?.stagedCount,0);
  assert.equal(zero.residualClearing?.preservedCount,1);
  assert.ok(zero.receipt);
  const unrelated=await request("not-in-case","2");
  await assert.rejects(api.confirmMuseumPhysicalLocations({...unrelated,clearedVitrines:["50"],records:unrelated.records.map(record=>({...record,to:{kind:"table",code:"staging-area",label:"Staging area"}}))},actor,loader),/starting vitrine/);
  await assert.rejects(api.confirmMuseumPhysicalLocations({...unrelated,clearedVitrines:["50"]},actor,loader),/only moves remaining contents to staging/);
  const badSource={...residualRequest,clientRequestId:randomUUID(),records:[{...clearRecords.find(row=>row.sourceId===approvedTarget.sourceId)!,expectedSourceRevision:"0".repeat(64)}]};
  await assert.rejects(api.confirmMuseumPhysicalLocations(badSource,actor,loader),/identity or its evidence changed/);

  const tasks = await Promise.all(["a","b"].map(sourceId=>saveCompanionWork({action:"task.create",museumId:"museum-spn",clientRequestId:randomUUID(),sourceId,saintId:"fixture-saint",title:"Check label"},actor,loader)));
  assert.ok(tasks.every(r=>r.tasks.length===1));
  const task = tasks[0].tasks[0];
  const taskRequest = {action:"task.complete",museumId:"museum-spn",clientRequestId:randomUUID(),taskId:task.id,expectedVersion:task.version,completed:true};
  const taskRetry = await Promise.all([saveCompanionWork(taskRequest,actor,loader),saveCompanionWork(taskRequest,actor,loader)]);
  assert.equal(taskRetry[0].receipt.id,taskRetry[1].receipt.id);
  assert.equal(taskRetry.filter(r=>r.replayed).length,1);

  for (const id of ["shelf-a","shelf-b"]) await api.confirmMuseumPhysicalLocations(await request(id,"2"),actor,loader);
  const shelfRequests = await Promise.all(["shelf-a","shelf-b"].map(async sourceId=>{
    const r=(await api.readPhysicalLocationView(loader,db,[sourceId],false)).rows[0];
    return {action:"shelf.update",museumId:"museum-spn",clientRequestId:randomUUID(),sourceId,saintId:r.saintId,vitrine:"2",shelf:"B",expectedVersion:0,
      expectedCurrentRevision:r.currentRevision,expectedSourceRevision:r.sourceRevision,expectedLocationVersion:r.currentVersion};
  }));
  const shelves = await Promise.all(shelfRequests.map(r=>saveCompanionWork(r,actor,loader)));
  assert.ok(shelves.every(r=>r.shelves[0].shelf==="B"));
  const staleShelf = {...shelfRequests[0],clientRequestId:randomUUID(),expectedVersion:1};
  const moveRequest=await request("shelf-a","4");
  let moveEntered!:()=>void,releaseMove!:()=>void;
  const moveReady=new Promise<void>(resolve=>{moveEntered=resolve;});
  const moveGate=new Promise<void>(resolve=>{releaseMove=resolve;});
  let firstMoveRead=true;
  const moving=api.confirmMuseumPhysicalLocations(moveRequest,actor,async()=>{
    if(firstMoveRead){firstMoveRead=false;moveEntered();await moveGate;}return loader();
  });
  await moveReady;
  const waitingShelf=saveCompanionWork(staleShelf,actor,loader);
  const rejectedShelf=assert.rejects(waitingShelf,/Confirm this relic|location or source changed/);
  await new Promise(resolve=>setTimeout(resolve,50));
  releaseMove();
  await moving;
  await rejectedShelf;
  await assert.rejects(saveCompanionWork(staleShelf,actor,loader),/Confirm this relic|location or source changed/);

  const timings: {cached:boolean;milliseconds:number;loads:number}[] = [];
  for(const cached of [false,true]) {
    let loads=0; started=performance.now();
    await db.$transaction(async tx=>{
      const run=async()=>{for(let n=0;n<3;n++)await readMuseumData(tx,{onTiming:t=>{if(t.phase==="data_queries")loads++;}});};
      if(cached)await withMuseumTransactionReads(tx,run);else await run();
    },{timeout:60000});
    timings.push({cached,milliseconds:performance.now()-started,loads});
  }
  assert.deepEqual(timings.map(t=>t.loads),[3,1]);
  console.log(JSON.stringify({passed:true,independentMs,distinctPeak,readModelTimings:timings,
    checks:["independent saves overlap","same-source conflict","same-request replay","changed replay rejected","clear versus incoming placement","clear first then incoming","incoming first then waiting clear","independent tasks","task replay","independent shelf saves","waiting shelf versus physical move","stale shelf after physical move","bulk clear preserves in-place targets and later moves","residual receipt replay","zero-residual readiness","protected source conflict rejected"]},null,2));
} finally { await db.$disconnect(); }
