import "dotenv/config";
import assert from "node:assert/strict";
import {performance} from "node:perf_hooks";
import {readFile} from "node:fs/promises";
import type {Prisma as PrismaTypes} from "../lib/generated/prisma/client";
const database=new URL(process.env.DATABASE_URL||"postgresql://invalid/invalid");
if(!["localhost","127.0.0.1","[::1]"].includes(database.hostname)||!database.pathname.startsWith("/museum_revision_test"))throw new Error("Use a disposable localhost museum_revision_test database.");
const {PrismaClient}=await import("../lib/generated/prisma/client");
const {PrismaPg}=await import("@prisma/adapter-pg");
const client=new PrismaClient({adapter:new PrismaPg({connectionString:database.href}),log:[{emit:"event",level:"query"}]});
const runtimeQueries:string[]=[];let collecting=false;client.$on("query",event=>{if(collecting)runtimeQueries.push(event.query);});
Object.defineProperty(globalThis,"prisma",{value:client,writable:true,configurable:true});
const {db}=await import("../lib/db");
const {Prisma}=await import("../lib/generated/prisma/client");
const {MUSEUM_SNAPSHOT_TABLES}=await import("../lib/museum-snapshot-tables");
const {cachedByMuseumRevision,clearMuseumSnapshotCache,readMuseumRevision,withFreshMuseumSnapshotReads}=await import("../lib/museum-snapshot-cache");
const entityType="museum-revision-verify";
const audit=(client:PrismaTypes.TransactionClient=db)=>client.auditEvent.create({data:{action:"museum.revision.verify",entityType,entityId:"verify"}});
const repeatable={isolationLevel:Prisma.TransactionIsolationLevel.RepeatableRead,timeout:60000};
const revision=async()=>BigInt(await readMuseumRevision());
try{
 const triggers=await db.$queryRaw<{table:string;name:string;deferrable:boolean;deferred:boolean;function:string;enabled:string}[]>`
  SELECT c.relname AS table,t.tgname AS name,t.tgdeferrable AS deferrable,t.tginitdeferred AS deferred,p.proname AS function,t.tgenabled::text AS enabled
  FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_proc p ON p.oid=t.tgfoid
  WHERE n.nspname='public' AND t.tgname IN ('museum_revision','museum_revision_truncate') AND NOT t.tgisinternal`;
 assert.deepEqual([...new Set(triggers.map(row=>row.table))].sort(),[...MUSEUM_SNAPSHOT_TABLES].sort());
 for(const table of MUSEUM_SNAPSHOT_TABLES){
  const row=triggers.find(t=>t.table===table&&t.name==="museum_revision");
  assert.ok(row?.deferrable&&row.deferred&&row.enabled==="O"&&row.function==="museum_bump_revision");
  assert.ok(triggers.some(t=>t.table===table&&t.name==="museum_revision_truncate"&&t.enabled==="O"&&t.function==="museum_bump_revision"));
 }
 let before=await revision();await db.$transaction(async tx=>{await audit(tx);await audit(tx);await audit(tx);});assert.equal(await revision(),before+1n);
 before=await revision();await assert.rejects(db.$transaction(async tx=>{await audit(tx);throw Error("rollback");}));assert.equal(await revision(),before);
 before=await revision();await Promise.all(Array.from({length:4},()=>db.$transaction(async tx=>{await audit(tx);await audit(tx);})));assert.equal(await revision(),before+4n);
 before=await revision();await assert.rejects(db.$transaction(async tx=>{await tx.$executeRawUnsafe('TRUNCATE "MuseumFamilyProposalMove"');assert.equal(BigInt(await readMuseumRevision(tx)),before+1n);throw Error("rollback truncate");}));assert.equal(await revision(),before);
 clearMuseumSnapshotCache();let builds=0;
 const build=async()=>({build:++builds});
 const read=(client:PrismaTypes.TransactionClient=db)=>cachedByMuseumRevision("verify","v",client,build);
 const [a,b]=await Promise.all([read(),read()]);assert.equal(builds,1);assert.deepEqual(a,b);assert.notEqual(a,b);
 a.build=999;assert.equal((await read()).build,1);
 await db.$transaction(async tx=>{await tx.$executeRaw`SET TRANSACTION READ ONLY`;await read(tx);},repeatable);assert.equal(builds,1);
 await db.$transaction(async tx=>{await read(tx);await audit(tx);await read(tx);},repeatable);assert.equal(builds,3,"Read-write transactions bypass cache before and after writes");
 await read();assert.equal(builds,4,"Committed writes invalidate read-only cache");
 clearMuseumSnapshotCache();let failures=0;
 const failure=()=>cachedByMuseumRevision("failure","v",db,async()=>{failures++;throw Error("build failed");});
 await assert.rejects(failure());await assert.rejects(failure());assert.equal(failures,2);
 clearMuseumSnapshotCache();
 const privateCount=(client:PrismaTypes.TransactionClient)=>client.auditEvent.count({where:{entityType,entityId:"uncommitted"}});
 await assert.rejects(db.$transaction(async tx=>{
  const owned=await cachedByMuseumRevision("late-write","v",tx,async client=>{await client.auditEvent.create({data:{action:"museum.revision.verify",entityType,entityId:"uncommitted"}});return {count:await privateCount(client)};});
  assert.equal(owned.count,1);
  const observed=await cachedByMuseumRevision("late-write","v",db,async client=>({count:await privateCount(client)}));assert.equal(observed.count,0);
  throw Error("rollback owner");
 },repeatable));
 // This table is intentionally outside the revision trigger manifest. The warmed
 // value must not hide the prerequisite reads needed by PostgreSQL SSI in writers.
 await db.$executeRawUnsafe('CREATE TABLE museum_cache_write_guard_test (id integer PRIMARY KEY,available boolean NOT NULL)');
 await db.$executeRawUnsafe('INSERT INTO museum_cache_write_guard_test VALUES (1,true),(2,true)');
 const available=async(client:PrismaTypes.TransactionClient)=>{const [row]=await client.$queryRaw<{count:bigint}[]>`SELECT count(*) AS count FROM museum_cache_write_guard_test WHERE available`;return {count:Number(row.count)};};
 await cachedByMuseumRevision("write-guard","v",db,available);
 let arrived=0,release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});
 const transactions=await Promise.allSettled([1,2].map(id=>db.$transaction(async tx=>{
  const state=await cachedByMuseumRevision("write-guard","v",tx,available);
  arrived++;if(arrived===2)release();await gate;
  if(state.count>1)await tx.$executeRaw`UPDATE museum_cache_write_guard_test SET available=false WHERE id=${id}`;
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,timeout:60000})));
 assert.equal(transactions.filter(result=>result.status==="fulfilled").length,1,"One conflicting prerequisite writer must abort under SSI");
 assert.equal((await available(db)).count,1);
 const {readMuseumData}=await import("../lib/museum-working-data");
 const {readMuseumMoveSessionSource,registeredMoveProposal}=await import("../lib/museum-move-session-source");
 const observedQueries:string[]=[];
 // Query dependency coverage is collected through a Prisma extension, independent
 // of the heuristic import/relation scanner in the fast unit guard.
 const measured=db.$extends({query:{$allOperations:async({model,args,query})=>{if(model)observedQueries.push(model);return query(args);}}}) as unknown as PrismaTypes.TransactionClient;
 collecting=true;
 for(const reconcileFamilies of [false,true])for(const applyScopedProposals of [false,true])for(const indexSourceIdentities of [false,true]){
  await withFreshMuseumSnapshotReads(()=>readMuseumData(measured,{reconcileFamilies,applyScopedProposals,indexSourceIdentities}));
 }
 for(const indexSourceIdentities of [false,true])await withFreshMuseumSnapshotReads(()=>readMuseumMoveSessionSource(registeredMoveProposal.version,measured,{indexSourceIdentities}));
 collecting=false;
 const at=performance.now();const fresh=await withFreshMuseumSnapshotReads(()=>readMuseumData());
 clearMuseumSnapshotCache();const first=await readMuseumData();assert.deepEqual(first,fresh);
 const cached=await readMuseumData();assert.deepEqual(cached,fresh);
 const member=first.membersById.entries().next().value;assert.ok(member);
 const [memberId,record]=member;const original={...record};record.Name="Caller-local mutation";first.membersById.delete(memberId);
 assert.deepEqual((await readMuseumData()).membersById.get(memberId),original);
 const freshSource=await withFreshMuseumSnapshotReads(()=>readMuseumMoveSessionSource(registeredMoveProposal.version,db));
 assert.deepEqual(await readMuseumMoveSessionSource(registeredMoveProposal.version,db),freshSource);
 assert.deepEqual(await readMuseumMoveSessionSource(registeredMoveProposal.version,db),freshSource);
 const listed=new Set<string>([...MUSEUM_SNAPSHOT_TABLES,"MuseumDataRevision"]);
 const schema=await readFile("prisma/schema.prisma","utf8");const allModels=new Set([...schema.matchAll(/^model (\w+) \{/gm)].map(match=>match[1]));
 const observedTables=new Set(observedQueries);
 for(const query of runtimeQueries)for(const match of query.matchAll(/\b(?:FROM|JOIN)\s+(?:"\w+"\.)?"(\w+)"/gi))if(allModels.has(match[1]))observedTables.add(match[1]);
 assert.deepEqual([...observedTables].filter(model=>!listed.has(model)),[]);
 console.log(JSON.stringify({passed:true,tables:MUSEUM_SNAPSHOT_TABLES.length,readModelComparisonMilliseconds:performance.now()-at,observedModels:[...observedTables].sort(),checks:["installed trigger coverage and functions","one bump per commit and rollback","four concurrent commits","TRUNCATE immediate and rollback","read-only producer/waiter reuse","read-write bypass before first write","isolated mutable copies","uncommitted build never shared","warmed cache preserves SSI prerequisite reads","real working-data and source equivalence","every working-data variant model coverage"]},null,2));
}finally{
 await db.$executeRawUnsafe('DROP TABLE IF EXISTS museum_cache_write_guard_test');
 await db.auditEvent.deleteMany({where:{entityType}});await db.$disconnect();
}
