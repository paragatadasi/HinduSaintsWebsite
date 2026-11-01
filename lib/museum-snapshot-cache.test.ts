import test from "node:test";
import assert from "node:assert/strict";
import {cachedByMuseumRevision,clearMuseumSnapshotCache} from "./museum-snapshot-cache";
import type {Prisma} from "./generated/prisma/client";
const context=(isolation="repeatable read")=>{
 const state={revision:1n,wrote:false,isolation,readOnly:true};
 const client={$queryRaw:async()=>[{...state}]};
 return {state,client:client as unknown as Prisma.TransactionClient};
};
const deferred=()=>{let resolve!:()=>void;const promise=new Promise<void>(done=>{resolve=done;});return {promise,resolve};};
test("shared snapshots preserve Map and Date values without sharing mutable caller objects",async()=>{
 clearMuseumSnapshotCache();const first=context(),second=context();let builds=0;
 const build=async()=>{builds++;return {members:new Map([["saint",{name:"Original"}]]),date:new Date("2026-11-01T00:00:00Z")};};
 const a=await cachedByMuseumRevision("map","v",first.client,build);
 a.members.get("saint")!.name="Caller edit";a.members.set("extra",{name:"Extra"});a.date.setUTCDate(2);
 const b=await cachedByMuseumRevision("map","v",second.client,build);
 assert.ok(b.members instanceof Map);assert.ok(b.date instanceof Date);
 assert.equal(b.members.get("saint")?.name,"Original");assert.equal(b.members.has("extra"),false);
 assert.equal(b.date.toISOString(),"2026-11-01T00:00:00.000Z");assert.equal(builds,1);
});
test("a write during a build is private to its owner and never published to waiting readers",async()=>{
 clearMuseumSnapshotCache();const owner=context(),reader=context(),gate=deferred(),started=deferred();let builds=0;
 const first=cachedByMuseumRevision("late-write","v",owner.client,async()=>{builds++;owner.state.wrote=true;started.resolve();await gate.promise;return {uncommittedRows:1};});
 await started.promise;
 const waiting=cachedByMuseumRevision("late-write","v",reader.client,async()=>{builds++;return {uncommittedRows:0};});
 gate.resolve();assert.equal((await first).uncommittedRows,1);
 assert.equal((await waiting).uncommittedRows,0,"Another transaction must not see the owner's uncommitted build");
 owner.state.wrote=false;
 assert.equal((await cachedByMuseumRevision("late-write","v",owner.client,async()=>({uncommittedRows:0}))).uncommittedRows,0);
 assert.equal(builds,2);
});
test("a waiting transaction that starts writing uses its own current data",async()=>{
 clearMuseumSnapshotCache();const owner=context(),reader=context(),gate=deferred(),started=deferred();
 const first=cachedByMuseumRevision("wait-write","v",owner.client,async()=>{started.resolve();await gate.promise;return {value:1};});
 await started.promise;
 const waiting=cachedByMuseumRevision("wait-write","v",reader.client,async()=>({value:99}));
 await Promise.resolve();reader.state.wrote=true;gate.resolve();await first;
 assert.equal((await waiting).value,99);
});
test("read-committed callers do not reuse or fill shared snapshots",async()=>{
 clearMuseumSnapshotCache();const owner=context(),reader=context("read committed");let builds=0;
 const build=async()=>({build:++builds});
 await cachedByMuseumRevision("read-committed","v",owner.client,build);
 assert.equal((await cachedByMuseumRevision("read-committed","v",reader.client,build)).build,2);
 assert.equal((await cachedByMuseumRevision("read-committed","v",reader.client,build)).build,3);
});

test("a read-write transaction bypasses warmed cache before its first write",async()=>{
 clearMuseumSnapshotCache();const reader=context(),writer=context();writer.state.readOnly=false;let builds=0;
 const build=async()=>({build:++builds});
 await cachedByMuseumRevision("future-writer","v",reader.client,build);
 assert.equal((await cachedByMuseumRevision("future-writer","v",writer.client,build)).build,2);
 assert.equal((await cachedByMuseumRevision("future-writer","v",reader.client,build)).build,1);
});
