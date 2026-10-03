import assert from "node:assert/strict";
import test from "node:test";
import type {Prisma} from "./generated/prisma/client";
import {readVrindavanMuseumInventory} from "./vrindavan-museum-inventory";
const hash="a".repeat(64),older="b".repeat(64);
function observation(id:string,snapshot:string,status="identity_linked") {
 return {id,museumId:"museum-vrindavan",sourceKey:`vrindavan-workbook:${snapshot}:Sheet1:2`,status,itemId:null,reviewedAt:new Date(),rawJson:{cells:[]},normalizedJson:{mappingVersion:"vrindavan-identity-v1",sourceName:"Source.xlsx",sourceRow:2,name:"Example Saint",place:"Vrindavan",relic:"Cloth",quantity:"1",display:"1",position:"A",comments:"",warnings:[],saintIds:["saint1"],note:null}};
}
function client(rows:ReturnType<typeof observation>[]) {
 return {museum:{findFirst:async(args:unknown)=>{assert.deepEqual(args,{where:{id:"museum-vrindavan",archivedAt:null},select:{id:true,name:true,slug:true}});return {id:"museum-vrindavan",name:"Vrindavan",slug:"vrindavan"}}},museumCollectionImport:{findMany:async(args:{where:{museumId:string}})=>{assert.equal(args.where.museumId,"museum-vrindavan");return rows}},saint:{findMany:async()=>[{id:"saint1",displayName:"Example Saint",canonicalName:"Example Saint",slug:"example",status:"draft"}]}} as unknown as Prisma.TransactionClient;
}
test("reader selects newest snapshot without duplicating older confirmed entries, retains drafts and groups by canonical saint",async()=>{
 const result=await readVrindavanMuseumInventory({},client([observation("new",hash),observation("old",older)]));
 assert.equal(result.entries.length,1);assert.equal(result.entries[0].observationId,"new");assert.equal(result.snapshotHash,hash);
 assert.equal(result.saints[0].status,"draft");assert.equal(result.entriesBySaintId.get("saint1")?.length,1);
 assert.deepEqual(result.displays,["1"]);assert.equal(result.counts.confirmedEntries,1);
 const historical=await readVrindavanMuseumInventory({snapshotHash:older},client([observation("new",hash),observation("old",older)]));
 assert.equal(historical.entries[0].observationId,"old");
});
test("a new unreviewed snapshot does not silently fall back to older confirmed inventory",async()=>{
 const result=await readVrindavanMuseumInventory({},client([observation("new",hash,"pending"),observation("old",older)]));
 assert.equal(result.entries.length,0);assert.equal(result.counts.awaitingIdentityReview,1);
});
test("unknown or invalid snapshots fail rather than showing another inventory",async()=>{
 await assert.rejects(readVrindavanMuseumInventory({snapshotHash:"invalid"},client([])));
 await assert.rejects(readVrindavanMuseumInventory({snapshotHash:older},client([observation("new",hash)])));
});
test("latest source observation supersedes an earlier confirmed decision",async()=>{
 const result=await readVrindavanMuseumInventory({},client([observation("new",hash,"deferred"),observation("old",hash)]));
 assert.equal(result.entries.length,0);assert.equal(result.counts.sourceRows,1);assert.equal(result.counts.awaitingIdentityReview,1);
});