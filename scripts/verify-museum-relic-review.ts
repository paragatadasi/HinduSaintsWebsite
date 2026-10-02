import assert from "node:assert/strict";
const url=process.env.MUSEUM_TEST_DATABASE_URL;
if(!url||!["localhost","127.0.0.1"].includes(new URL(url).hostname)||new URL(url).pathname!=="/museum_integration_test") throw Error("Disposable local museum_integration_test required");
process.env.DATABASE_URL=url;
const {db}=await import("../lib/db");
const {stageMirroredRelics,decideRelic}=await import("../lib/museum-relic-review");
const {sourceKey}=await import("../lib/museum-update-domain");
const base="appMapiXrtNwnS9oZ";
try {
 const actor=await db.user.create({data:{email:"relic-review@example.invalid",roles:["site_admin"]}});
 const saint=await db.saint.create({data:{displayName:"Existing saint",canonicalName:"Existing saint",slug:"relic-fixture"}});
 async function mirror(table:string,id:string,fields:Record<string,unknown>) {
  await db.airtableMirrorRecord.upsert({where:{baseId_tableIdOrName_recordId:{baseId:base,tableIdOrName:table,recordId:id}},create:{baseId:base,tableIdOrName:table,recordId:id,rawFieldsJson:fields as never,rawPayloadJson:{}},update:{rawFieldsJson:fields as never}});
 }
 for(const [id,v] of [["recA",52],["recB",25]] as const) {
  await mirror("Saints",id,{Name:"Existing saint","Vitrine #":v,Shelf:"C"});
  await db.externalRecord.create({data:{sourceType:"airtable",externalId:sourceKey("Saints",id),entityType:"Saint",entityId:saint.id,rawPayloadJson:{}}});
 }
 await mirror("Relics","recOne",{"Item Name":"Garment",Saint:["recA"]});
 await mirror("Relics","recTwo",{"Item Name":"Towel",Saint:["recB"]});
 await mirror("Relics","recUnknown",{"Item Name":"Uncertain relic",Saint:["recA","recB"]});
 await mirror("Relics","recUnlinked",{"Item Name":"Unlinked relic",Saint:["recMissing"]});
 assert.deepEqual(await stageMirroredRelics(actor.id),{imported:3,pending:2,unchanged:0});
 assert.equal(await db.saint.count(),1);
 assert.equal(await db.museumItemPlacement.count(),2);
 assert.deepEqual(await stageMirroredRelics(actor.id),{imported:0,pending:0,unchanged:4});
 const latest=()=>db.museumCollectionImport.findFirstOrThrow({where:{sourceKey:sourceKey("Relics","recOne")},orderBy:[{observedAt:"desc"},{id:"desc"}]});
 const initial=await latest();const itemId=initial.itemId!;
 await mirror("Saints","recA",{Name:"Existing saint","Vitrine #":53,Shelf:"D"});
 assert.equal((await stageMirroredRelics(actor.id)).pending,2);
 assert.equal((await db.museumItemPlacement.findFirstOrThrow({where:{itemId,endedAt:null},include:{location:true}})).location.code,"52/C");
 let r=await latest(); let item=await db.museumCollectionItem.findUniqueOrThrow({where:{id:itemId}});
 const version=(x:typeof r)=>`${x.status}:${x.reviewedAt?.toISOString()||""}`;
 const keep={id:r.id,version:version(r),action:"keep" as const,item:`${item.id}:${item.version}`,note:"Retain reviewed location"};
 await decideRelic(actor.id,keep);await assert.rejects(decideRelic(actor.id,keep));
 await stageMirroredRelics(actor.id);assert.equal((await latest()).status,"kept");
 r=await latest();await decideRelic(actor.id,{id:r.id,version:version(r),action:"reopen",note:"Confirm source correction"});
 r=await latest();await decideRelic(actor.id,{id:r.id,version:version(r),action:"accept",note:"Verified museum location",item:`${item.id}:${item.version}`,label:"Garment",vitrine:"53",shelf:"D",confirm:"on"});
 assert.equal(await db.museumItemPlacement.count({where:{itemId}}),2);
 assert.equal((await db.museumItemPlacement.findFirstOrThrow({where:{itemId,endedAt:null},include:{location:true}})).location.code,"53/D");
 r=await latest();await decideRelic(actor.id,{id:r.id,version:version(r),action:"reopen",note:"Test stale source"});r=await latest();
 await mirror("Relics","recOne",{"Item Name":"Changed garment",Saint:["recA"]});
 await assert.rejects(decideRelic(actor.id,{id:r.id,version:version(r),action:"defer",note:"Stale evidence"}));
 await stageMirroredRelics(actor.id);
 assert.equal(await db.museumCollectionItem.count(),3);
 assert.equal((await db.saint.findUniqueOrThrow({where:{id:saint.id}})).displayName,"Existing saint");
 await db.airtableMirrorRecord.createMany({data:Array.from({length:1300},(_,i)=>({baseId:base,tableIdOrName:"Relics",recordId:"recScale"+i,rawFieldsJson:{"Item Name":"Relic "+i,Saint:["recB"]},rawPayloadJson:{}}))});
 const start=Date.now();assert.equal((await stageMirroredRelics(actor.id)).imported,1300);
 assert.equal((await stageMirroredRelics(actor.id)).unchanged,1304);
 console.log("Full-size baseline and replay passed in "+Math.round((Date.now()-start)/1000)+"s");
 console.log("PASS direct baseline, same-saint multiple vitrines, unresolved identities, repeat safety, source discrepancy preservation, keep decision, stale review, audited acceptance and placement history");
} finally {await db.$disconnect();}
