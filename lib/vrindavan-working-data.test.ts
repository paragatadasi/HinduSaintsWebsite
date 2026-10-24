import assert from "node:assert/strict";
import test from "node:test";
import type {Prisma} from "./generated/prisma/client";
import {readVrindavanMuseumInventory} from "./vrindavan-museum-inventory";
import {readVrindavanWorkingData} from "./vrindavan-working-data";

function fixture() {
 const reads=new Map<string,number>();
 let name="Example Saint";
 const many=(key:string)=>async()=>{reads.set(key,(reads.get(key)??0)+1);return [];};
 const client={
  museum:{findFirst:async()=>({id:"museum-vrindavan",name:"Vrindavan",slug:"vrindavan"})},
  museumCollectionImport:{findMany:async()=>{
   reads.set("inventory",(reads.get("inventory")??0)+1);
   return [{id:"observation",museumId:"museum-vrindavan",sourceKey:`vrindavan-workbook:${"a".repeat(64)}:Sheet1:2`,status:"identity_linked",rawJson:{cells:[]},normalizedJson:{mappingVersion:"vrindavan-identity-v1",sourceName:"Source.xlsx",sourceRow:2,name,place:"Vrindavan",relic:"Cloth",quantity:"1",display:"1",position:"A",comments:"",warnings:[],saintIds:["saint1"],note:null}}];
  }},
  saint:{findMany:async()=>[{id:"saint1",displayName:name,canonicalName:name,slug:"example",status:"draft",aliases:[],places:[],traditions:[],familyMemberships:[],relationshipsFrom:[],relationshipsTo:[],museumSectionAssignments:[],visitPlaces:[],birthYear:null,samadhiYear:null}]},
  airtableMirrorRecord:{findMany:many("spn")},museumItemSaint:{findMany:many("collections")},externalRecord:{findMany:many("external")},museumSection:{findMany:many("sections")},museumDisplayMembership:{findMany:many("membership")},museumArrangement:{findMany:many("arrangements")},museumFamilyProposalMove:{findMany:many("familyMoves")},museumCuratorProposal:{findMany:many("curator")},saintRelationship:{findMany:many("relationships")},place:{findMany:many("places")}
 } as unknown as Prisma.TransactionClient;
 return {client,reads,rename:(value:string)=>{name=value;}};
}

test("workspace shares one inventory and one SPN reference read, and later calls read fresh data",async()=>{
 const {client,reads,rename}=fixture();
 const inventory=readVrindavanMuseumInventory({},client);
 const working=await readVrindavanWorkingData(client,inventory);
 assert.equal(reads.get("inventory"),1);
 assert.equal(reads.get("spn"),1);
 assert.equal(reads.get("collections"),1);
 assert.equal(working.placements.length,1);
 assert.equal(working.placements[0].name,"Example Saint");
 assert.equal(working.audit.snapshotHash,(await inventory).snapshotHash);
 assert.equal(working.sections.reduce((total,section)=>total+section.count,0),1);
 rename("Updated Saint");
 const refreshed=await readVrindavanWorkingData(client);
 assert.equal(refreshed.placements[0].name,"Updated Saint");
 assert.equal(reads.get("inventory"),2);
 assert.equal(reads.get("spn"),2);
});

