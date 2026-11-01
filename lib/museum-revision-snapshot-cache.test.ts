import test from "node:test";
import assert from "node:assert/strict";
import {RevisionSnapshotCache} from "./museum-revision-snapshot-cache";
import {companionReadRevision,companionResourceRevision} from "./museum-companion-read-revision";
const deferred=()=>{let resolve!:()=>void;const promise=new Promise<void>(done=>{resolve=done;});return {promise,resolve};};
test("parallel readers share one build and failed builds remain retryable",async()=>{
 const cache=new RevisionSnapshotCache<{revision:string;value:number}>(),gate=deferred();let builds=0;
 const build=async()=>{builds++;await gate.promise;return {revision:"one",value:1};};
 const requests=[cache.read("one",build),cache.read("one",build),cache.read("one",build)];
 gate.resolve();assert.deepEqual(await Promise.all(requests),Array(3).fill({revision:"one",value:1}));assert.equal(builds,1);
 const failure=new RevisionSnapshotCache<{revision:string}>();
 await assert.rejects(failure.read("one",async()=>{throw Error("unavailable");}));
 assert.equal((await failure.read("one",async()=>({revision:"one"}))).revision,"one");
});
test("a newer reader waits for a fresh build instead of receiving an older in-flight snapshot",async()=>{
 const cache=new RevisionSnapshotCache<{revision:string}>(),gate=deferred();let active=0,peak=0,builds=0;
 const build=async(revision:string)=>{active++;peak=Math.max(peak,active);builds++;if(revision==="one")await gate.promise;active--;return {revision};};
 const first=cache.read("one",()=>build("one"));const next=cache.read("two",()=>build("two"));gate.resolve();
 assert.equal((await first).revision,"one");assert.equal((await next).revision,"two");assert.equal(builds,2);assert.equal(peak,1);
});
test("a build is cached by its actual database revision and bounded older entries are evicted",async()=>{
 const cache=new RevisionSnapshotCache<{revision:string}>(1);let builds=0;
 const build=async(revision:string)=>{builds++;return {revision};};
 assert.equal((await cache.read("before",()=>build("after"))).revision,"after");
 await cache.read("after",()=>build("after"));assert.equal(builds,1);
 await cache.read("next",()=>build("next"));await cache.read("after",()=>build("after"));assert.equal(builds,3);
});
test("revision checks cover tuple edits, removals, code epochs and day changes and distinguish resource scopes",()=>{
 const rows=[{table_name:"Saint",row_count:"2",tuple_revision:"old"},{table_name:"SaintAlias",row_count:"1",tuple_revision:"alias"}];
 const options={epoch:"code",day:"2026-11-01"};const before=companionReadRevision(rows,options);
 assert.equal(companionReadRevision([...rows].reverse(),options),before);
 assert.notEqual(companionReadRevision([{...rows[0],tuple_revision:"edit-with-same-count"},rows[1]],options),before);
 assert.notEqual(companionReadRevision([rows[0]],options),before);
 assert.notEqual(companionReadRevision(rows,{...options,epoch:"new-code"}),before);
 assert.notEqual(companionReadRevision(rows,{...options,day:"2026-11-02"}),before);
 assert.notEqual(companionResourceRevision(before,"catalog"),companionResourceRevision(before,"shelves:2"));
});
