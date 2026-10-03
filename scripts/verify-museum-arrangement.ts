import assert from "node:assert/strict";
const url=process.env.MUSEUM_MEMBERSHIP_TEST_DATABASE_URL;if(!url)throw Error("Set disposable test URL");
const target=new URL(url);if(!["localhost","127.0.0.1"].includes(target.hostname)||target.pathname!=="/museum_membership_test")throw Error("Refusing non-test database");
process.env.DATABASE_URL=url;
const {db}=await import("../lib/db");const {readMuseumData}=await import("../lib/museum-working-data");const {saveMuseumArrangement}=await import("../lib/museum-arrangement");
const {changeMuseumDisplayMembership}=await import("../lib/museum-display-membership");
const suffix=Date.now();try{
 const actor=await db.user.create({data:{email:`arrangement-${suffix}@example.invalid`,active:true,roles:["curator"]}});
 const saint=await db.saint.create({data:{slug:`arrangement-${suffix}`,displayName:"Arrangement fixture",canonicalName:"Arrangement fixture"}});
 const section=await db.museumSection.create({data:{slug:`arrangement-${suffix}`,name:`Arrangement section ${suffix}`,status:"published"}});
 const group=await db.museumExhibitGroup.create({data:{museumSectionId:section.id,key:"arrangement",label:"Arrangement family"}});
 const placement=await db.saintMuseumSection.create({data:{saintId:saint.id,museumSectionId:section.id,exhibitGroupId:group.id,assignmentType:"primary",tier:"featured",status:"published"}});
 const read=async()=>(await readMuseumData()).placements.find(p=>p.id===placement.id)!;
 const input=(row:Awaited<ReturnType<typeof read>>)=>({placementId:row.id,revision:row.arrangement!.revision,familyKey:row.arrangement!.familyKey});
 let row=await read();assert.equal(row.arrangement!.status,"Proposed");
 await assert.rejects(saveMuseumArrangement({...input(row),status:"Planned"},actor.id),/vitrine/);
 await saveMuseumArrangement({...input(row),status:"Planned",vitrine:"3.4"},actor.id);
 await assert.rejects(saveMuseumArrangement({...input(row),status:"Planned",vitrine:"5"},actor.id),/changed/);
 row=await read();assert.equal(row.arrangement!.status,"Planned");assert.equal(row.arrangement!.vitrine,"3.4");assert.equal(row.arrangement!.shelf,"");
 const itemCount=await db.museumCollectionItem.count();const placeCount=await db.museumItemPlacement.count();
 await saveMuseumArrangement({...input(row),status:"Implemented",vitrine:"3.4",physicalConfirmation:"yes",inventoryAcknowledged:"yes"},actor.id);
 row=await read();assert.equal(row.arrangement!.status,"Implemented");assert.ok(row.arrangement!.confirmedAt);assert.equal(row.arrangement!.inventoryAcknowledged,true);
 assert.equal(await db.museumCollectionItem.count(),itemCount);assert.equal(await db.museumItemPlacement.count(),placeCount);
 assert.equal((await db.museumArrangement.findUniqueOrThrow({where:{museumId_placementId:{museumId:"museum-spn",placementId:row.id}}})).confirmedById,actor.id);
 await changeMuseumDisplayMembership({placementId:row.id,familyKey:row.displayMembership!.familyKey,revision:row.displayMembership!.revision,action:"detach",actorId:actor.id});
 assert.equal((await read()).arrangement!.status,"Proposed");
 assert.equal(await db.auditEvent.count({where:{action:"museum.arrangement.updated",entityId:row.id}}),2);
 console.log("PASS vitrine requirement, optional shelf, stale form rejection, recorded physical attestation without invented inventory, proposal-change invalidation and audit");
}finally{await db.$disconnect();}
