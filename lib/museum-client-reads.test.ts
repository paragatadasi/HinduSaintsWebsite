import test from "node:test";
import assert from "node:assert/strict";
import {createMuseumReadCache} from "./museum-client-reads";
const json=(value:unknown,etag="v1")=>new Response(JSON.stringify(value),{headers:{ETag:etag}});
test("concurrent readers share one request and a short-lived result",async()=>{
 let calls=0,clock=0;
 const cache=createMuseumReadCache(async()=>{calls++;return json({value:calls});},()=>clock);
 assert.deepEqual(await Promise.all([cache.read("/a"),cache.read("/a")]),[{value:1},{value:1}]);
 await cache.read("/a");assert.equal(calls,1);
 clock=10001;await cache.read("/a");assert.equal(calls,2);
});
test("conditional response reuses data and sends the resource ETag",async()=>{
 let calls=0;
 const cache=createMuseumReadCache(async(_,options)=>{calls++;if(calls===1)return json({value:1});assert.equal(new Headers(options?.headers).get("If-None-Match"),"v1");return new Response(null,{status:304});});
 const first=await cache.read("/a");assert.equal(await cache.read("/a",true),first);
});
test("a write during a shared read forces every subscriber onto the new revision",async()=>{
 let finish!:(response:Response)=>void,calls=0;
 const cache=createMuseumReadCache(async()=>{calls++;return calls===1?new Promise<Response>(resolve=>finish=resolve):json({value:2},"v2");});
 const a=cache.read("/a"),b=cache.read("/a");cache.invalidate();finish(json({value:1}));
 assert.deepEqual(await Promise.all([a,b]),[{value:2},{value:2}]);assert.equal(calls,2);
});
test("failed requests can retry and private caches do not share data",async()=>{
 let calls=0;
 const fetcher:typeof fetch=async()=>{if(++calls===1)return new Response(JSON.stringify({error:"Unavailable"}),{status:503});return json({value:calls});};
 const a=createMuseumReadCache(fetcher),b=createMuseumReadCache(fetcher);
 await assert.rejects(a.read("/a"),/Unavailable/);
 assert.deepEqual(await a.read("/a"),{value:2});assert.deepEqual(await b.read("/a"),{value:3});
});
