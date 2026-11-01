import {randomUUID} from "node:crypto";
import {AsyncLocalStorage} from "node:async_hooks";
import {db} from "./db";
import {Prisma} from "./generated/prisma/client";

type SharedValue<T>={shareable:true;value:T}|{shareable:false};
type CacheState={epoch:string;entries:Map<string,Map<string,Promise<SharedValue<unknown>>>>;fresh:AsyncLocalStorage<boolean>};
const globals=globalThis as typeof globalThis&{museumSnapshotCacheState?:CacheState};
const cache=globals.museumSnapshotCacheState??={epoch:randomUUID(),entries:new Map(),fresh:new AsyncLocalStorage<boolean>()};
const keptRevisions=2;
type RevisionState={revision:string;snapshotConsistent:boolean;transactionWrote:boolean;readOnly:boolean};
async function readRevisionState(client:Prisma.TransactionClient):Promise<RevisionState>{
 const [row]=await client.$queryRaw<{revision:bigint|null;isolation:string;wrote:boolean;readOnly:boolean}[]>`
  SELECT current_setting('transaction_isolation') AS isolation,
   pg_current_xact_id_if_assigned() IS NOT NULL AS wrote,
   current_setting('transaction_read_only')='on' AS "readOnly",
   CASE WHEN current_setting('transaction_read_only')='on'
    AND current_setting('transaction_isolation') IN ('repeatable read','serializable')
    AND pg_current_xact_id_if_assigned() IS NULL
    THEN (SELECT "revision" FROM "public"."MuseumDataRevision" WHERE "id"=1)
    ELSE NULL END AS revision`;
 if(!row)throw new Error("Museum transaction state could not be read.");
 const snapshotConsistent=row.isolation==="repeatable read"||row.isolation==="serializable";
 if(row.readOnly&&snapshotConsistent&&!row.wrote&&row.revision===null)throw new Error("MuseumDataRevision is missing. Apply the museum_data_revision migration.");
 return {revision:row.revision?.toString()??"",snapshotConsistent,transactionWrote:row.wrote,readOnly:row.readOnly};
}
export async function readMuseumRevision(client:Prisma.TransactionClient=db){
 const [row]=await client.$queryRaw<{revision:bigint}[]>`SELECT "revision" FROM "public"."MuseumDataRevision" WHERE "id"=1`;
 if(!row)throw new Error("MuseumDataRevision is missing. Apply the museum_data_revision migration.");
 return row.revision.toString();
}

// Explicit audit/verification reads can bypass all cross-request snapshot reuse.
// Callers retain responsibility for the transaction in which their reads run.
export function withFreshMuseumSnapshotReads<T>(work:()=>Promise<T>){return cache.fresh.run(true,work);}

// Cache only database-enforced read-only, consistent, unwritten snapshots. Every caller owns its returned
// objects, including Maps, Sets and Dates; no mutable cache reference escapes.
export async function cachedByMuseumRevision<T>(name:string,variant:string,client:Prisma.TransactionClient,build:(client:Prisma.TransactionClient)=>Promise<T>):Promise<T>{
 if(cache.fresh.getStore()||typeof (client as {$queryRaw?:unknown}).$queryRaw!=="function")return build(client);
 if(client===db)return db.$transaction(async tx=>{
  await tx.$executeRaw`SET TRANSACTION READ ONLY`;
  return cachedByMuseumRevision(name,variant,tx,build);
 },{isolationLevel:Prisma.TransactionIsolationLevel.RepeatableRead,timeout:60000,maxWait:10000});
 const before=await readRevisionState(client);
 if(!before.readOnly||before.transactionWrote||!before.snapshotConsistent)return build(client);
 const group=JSON.stringify([cache.epoch,name]);
 let entries=cache.entries.get(group);if(!entries){entries=new Map();cache.entries.set(group,entries);}
 const key=JSON.stringify([before.revision,variant]);
 const hit=entries.get(key) as Promise<SharedValue<T>>|undefined;
 if(hit){
  let shared:SharedValue<T>;
  try{shared=await hit;}catch{return build(client);}
  if(!shared.shareable)return build(client);
  const after=await readRevisionState(client);
  if(!after.readOnly||after.transactionWrote||!after.snapshotConsistent||after.revision!==before.revision)return build(client);
  return structuredClone(shared.value);
 }
 let owned!:T;
 const pending:Promise<SharedValue<T>>=(async()=>{
  owned=await build(client);
  const after=await readRevisionState(client);
  if(!after.readOnly||after.transactionWrote||!after.snapshotConsistent||after.revision!==before.revision)return {shareable:false};
  return {shareable:true,value:structuredClone(owned)};
 })();
 entries.set(key,pending);
 while(entries.size>keptRevisions)entries.delete(entries.keys().next().value!);
 try{
  const shared=await pending;
  if(!shared.shareable&&entries.get(key)===pending)entries.delete(key);
  return structuredClone(owned);
 }catch(error){if(entries.get(key)===pending)entries.delete(key);throw error;}
}
export function clearMuseumSnapshotCache(){cache.entries.clear();}
