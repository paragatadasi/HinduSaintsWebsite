import {performance} from "node:perf_hooks";
import {createHash} from "node:crypto";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import {PrismaPg} from "@prisma/adapter-pg";
import {PrismaClient} from "../lib/generated/prisma/client";
import {readMuseumMoveSessionSource,registeredMoveProposal} from "../lib/museum-move-session-source";
import {readPhysicalLocationView} from "../lib/museum-physical-locations";

function argument(name:string){const i=process.argv.indexOf(name);return i<0?undefined:process.argv[i+1];}
const envFile=argument("--env-file");
if(envFile)dotenv.config({path:envFile,override:true,quiet:true});
const databaseUrl=process.env.DATABASE_URL;
if(!databaseUrl||!["localhost","127.0.0.1","[::1]"].includes(new URL(databaseUrl).hostname))throw new Error("This verifier accepts only a local development database.");
const samples=Number(argument("--samples")??3);
if(!Number.isInteger(samples)||samples<1||samples>5)throw new Error("Choose between one and five read-only samples.");
const client=new PrismaClient({adapter:new PrismaPg({connectionString:databaseUrl}),log:[{emit:"event",level:"query"}]});
const queries:{duration:number;displayCards:boolean;verifiedBindings:boolean}[]=[];
client.$on("query",e=>queries.push({duration:e.duration,displayCards:e.query.includes('"MuseumItemSaint"'),verifiedBindings:e.query.includes('"MuseumCollectionImport"')}));
try{
 const result=await client.$transaction(async tx=>{
  await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
  const measurements=[];
  let sourceCount=0,physicalRowsChecked=0,snapshotDigest="",verifiedItemSources=0;
  for(let sample=0;sample<samples;sample++){
   async function read(legacyScan:boolean){
    const startQuery=queries.length,start=performance.now();
    const phases:{phase:string;milliseconds:number;records?:number}[]=[];
    const snapshot=await readMuseumMoveSessionSource(registeredMoveProposal.version,tx,{indexSourceIdentities:!legacyScan,onTiming:event=>phases.push(event)});
    const elapsedMilliseconds=performance.now()-start,events=queries.slice(startQuery);
    return {snapshot,metrics:{elapsedMilliseconds,queryCount:events.length,queryMilliseconds:events.reduce((n,e)=>n+e.duration,0),displayCardQueries:events.filter(e=>e.displayCards).length,verifiedBindingQueries:events.filter(e=>e.verifiedBindings).length,phases}};
   }
   const first=await read(sample%2===0),second=await read(sample%2!==0);
   const full=sample%2===0?first:second,thin=sample%2===0?second:first;
   assert.deepEqual(thin.snapshot,full.snapshot,"The optimized reader changed the complete physical source snapshot.");
   assert.equal(thin.metrics.queryCount,full.metrics.queryCount,"The index-only comparison changed database read count.");
   assert.equal(thin.metrics.displayCardQueries,full.metrics.displayCardQueries,"Display collection reads changed in the index-only comparison.");
   assert.ok(full.metrics.displayCardQueries>0,"The full-reader comparison did not query display cards.");
   assert.ok(thin.metrics.verifiedBindingQueries>0,"Verified item protection query was removed.");
   assert.equal(thin.metrics.verifiedBindingQueries,full.metrics.verifiedBindingQueries);
   verifiedItemSources=thin.snapshot.rows.filter(r=>r.itemIds?.length).length;
   if(process.argv.includes("--expect-verified")){
    assert.equal(verifiedItemSources,1,"The isolated fixture must yield exactly one protected SPN source.");
    const protectedSource=thin.snapshot.rows.find(r=>r.itemIds?.length)!;
    assert.equal(protectedSource.itemIds!.length,1,"Unreviewed or other-museum items entered the verified SPN binding.");
    assert.equal(protectedSource.itemId,protectedSource.itemIds![0]);
   }
   if(sample===0){
    const fullView=await readPhysicalLocationView(async()=>full.snapshot,tx,undefined,false);
    const thinView=await readPhysicalLocationView(async()=>thin.snapshot,tx,undefined,false);
    assert.deepEqual(thinView,fullView,"Physical identities, revisions, housing, component state or current locations changed.");
    physicalRowsChecked=thinView.rows.length;
   }
   sourceCount=thin.snapshot.rows.length;snapshotDigest=createHash("sha256").update(JSON.stringify(thin.snapshot)).digest("hex");
   measurements.push({sample:sample+1,first:sample%2===0?"full":"thin",full:full.metrics,thin:thin.metrics});
  }
  return {kind:"local_read_only_repeatable_read",sourceCount,physicalRowsChecked,verifiedItemSources,snapshotDigest,measurements,physicalWrites:false,limitations:"Local development measurements only. These do not measure production lock contention or promise a user-visible latency reduction."};
 },{isolationLevel:"RepeatableRead",timeout:120000});
 const output=argument("--out");if(output)await fs.writeFile(output,JSON.stringify(result,null,2));
 console.log(JSON.stringify(result));
}finally{await client.$disconnect();}
