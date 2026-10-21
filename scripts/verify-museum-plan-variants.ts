import assert from "node:assert/strict";
import {randomBytes} from "node:crypto";
const url=process.env.MUSEUM_PLANNER_TEST_DATABASE_URL;
if(!url)throw Error("Set disposable test database URL");
const target=new URL(url);
if(!["localhost","127.0.0.1"].includes(target.hostname)||!/^\/museum_plan_variants_test(?:_\d+)?$/.test(target.pathname))throw Error("Refusing non-test database");
process.env.DATABASE_URL=url;
const {db}=await import("../lib/db");
const {readVrindavanMovePlanner,saveVrindavanPhotoSetup,assignVrindavanPlan,completeVrindavanPlan,saveVrindavanSectionArea,saveVrindavanFlexiblePlan}=await import("../lib/museum-move-planner");
const {readMuseumPlanVariants,saveMuseumPlanVariant,previewMuseumPlanVariant,activateMuseumPlanVariant,importMuseumPlanTemplate}=await import("../lib/museum-plan-variants");
const suffix=Date.now(),hash=randomBytes(32).toString("hex");
try{
 const actor=await db.user.create({data:{email:`planner-${suffix}@example.invalid`,roles:["curator"],active:true}});
 await db.museum.upsert({where:{id:"museum-vrindavan"},create:{id:"museum-vrindavan",slug:"vrindavan",name:"Vrindavan"},update:{}});
 const section=await db.museumSection.create({data:{name:`Planner fixture ${suffix}`,slug:`planner-${suffix}`,status:"published"}});
 const ids:string[]=[];
 for(let i=0;i<3;i++){
  const saint=await db.saint.create({data:{slug:`planner-${suffix}-${i}`,displayName:`Planner saint ${i}`,canonicalName:`Planner saint ${i}`}});ids.push(saint.id);
  await db.saintMuseumSection.create({data:{saintId:saint.id,museumSectionId:section.id,tier:"featured",status:"published"}});
  await db.museumCollectionImport.create({data:{museumId:"museum-vrindavan",sourceKey:`vrindavan-workbook:${hash}:Sheet1:${i+2}`,fingerprint:hash+i,status:"identity_linked",reviewedAt:new Date(),rawJson:{cells:["","","","","Box"]},normalizedJson:{mappingVersion:"vrindavan-identity-v1",sourceName:"Fixture",sourceRow:i+2,name:saint.displayName,place:"",relic:"Cloth and photograph",quantity:"2",packagingText:"Box",display:i===2?"4":"3",position:"3.4",comments:"",warnings:[],saintIds:[saint.id],note:null}}});
 }

 let data=await readVrindavanMovePlanner();const first=data.rows.find(r=>r.saintId===ids[0])!;const second=data.rows.find(r=>r.saintId===ids[1])!;
 await assignVrindavanPlan({revision:data.revision,placementIds:[first.id],vitrine:"17",replaceExisting:true},actor.id);
 data=await readVrindavanMovePlanner();
 await saveVrindavanSectionArea({revision:data.revision,section:second.section,areaVersion:0,vitrines:["17","18"]},actor.id);
 data=await readVrindavanMovePlanner();await saveVrindavanFlexiblePlan({revision:data.revision,section:second.section,placementIds:[second.id]},actor.id);
 data=await readVrindavanMovePlanner();let registry=await readMuseumPlanVariants(actor.id);
 const initialRevision=data.revision;
 for(const mismatch of [{tier:"wrong-tier"},{familyKey:"wrong-family"}])await assert.rejects(importMuseumPlanTemplate({id:"rejected-template",name:"Rejected mismatch",expectedSources:[{saintId:first.saintId,sources:first.sources,lastConfirmed:first.lastConfirmed,...mismatch}],entries:[{saintId:first.saintId,vitrine:"3",shelf:"Top",note:"Mismatch"}]},{revision:registry.revision,planRevision:data.revision},actor.id),/researched starting locations/);
 assert.equal((await readMuseumPlanVariants(actor.id)).revision,registry.revision);
 const minimal=await importMuseumPlanTemplate({id:"minimal-test",name:"Minimal test",expectedSources:[{saintId:first.saintId,sources:first.sources,lastConfirmed:first.lastConfirmed}],entries:[{saintId:first.saintId,vitrine:"3",shelf:"Top",note:"Move up only"}],steps:[{order:1,title:"Top row",saintIds:[first.saintId],instruction:"Move up"}]},{revision:registry.revision,planRevision:data.revision},actor.id);
 registry=await readMuseumPlanVariants(actor.id);assert.equal(registry.variants.find(v=>v.id==="original-full-plan")!.rows.find(r=>r.id===first.id)!.vitrine,"17");
 await assert.rejects(activateMuseumPlanVariant({revision:"0".repeat(64),planRevision:data.revision,id:minimal},actor.id),/changed/);
 const preview=await previewMuseumPlanVariant({revision:registry.revision,planRevision:data.revision,id:minimal},actor.id);assert.ok(preview.changed);
 await activateMuseumPlanVariant({revision:registry.revision,planRevision:data.revision,id:minimal},actor.id);
 data=await readVrindavanMovePlanner();registry=await readMuseumPlanVariants(actor.id);
 assert.equal(data.rows.find(r=>r.id===first.id)!.vitrine,"3");assert.equal(data.rows.find(r=>r.id===second.id)!.status,"Proposed");assert.equal(data.rows.find(r=>r.id===second.id)!.vitrine,"");assert.equal(data.rows.find(r=>r.id===second.id)!.lastConfirmed,null);
 await activateMuseumPlanVariant({revision:registry.revision,planRevision:data.revision,id:"original-full-plan"},actor.id);
 data=await readVrindavanMovePlanner();registry=await readMuseumPlanVariants(actor.id);
 assert.equal(data.rows.find(r=>r.id===first.id)!.vitrine,"17");assert.deepEqual(data.rows.find(r=>r.id===second.id)!.flexibleVitrines,["17","18"]);
 await activateMuseumPlanVariant({revision:registry.revision,planRevision:data.revision,id:minimal},actor.id);
 data=await readVrindavanMovePlanner();const target=data.rows.find(r=>r.id===first.id)!;
 await completeVrindavanPlan({placementId:target.id,revision:target.revision,planRevision:data.revision,checkedSourceIds:target.sources.map(s=>s.id),shelf:"Top",physicalConfirmation:true,inventoryAcknowledged:true},actor.id);
 data=await readVrindavanMovePlanner();registry=await readMuseumPlanVariants(actor.id);
 const priorConfirmation=data.rows.find(r=>r.id===first.id)!.lastConfirmed;const physical=await db.museumArrangement.findUniqueOrThrow({where:{museumId_placementId:{museumId:"museum-vrindavan",placementId:first.id}}});
 const protectedPreview=await previewMuseumPlanVariant({revision:registry.revision,planRevision:data.revision,id:"original-full-plan"},actor.id);assert.equal(protectedPreview.replannedImplemented,1);
 await activateMuseumPlanVariant({revision:registry.revision,planRevision:data.revision,id:"original-full-plan"},actor.id);
 const replanned=await db.museumArrangement.findUniqueOrThrow({where:{museumId_placementId:{museumId:"museum-vrindavan",placementId:first.id}}});assert.equal(replanned.status,"Planned");assert.equal(replanned.vitrine,"17");const effective=(await readVrindavanMovePlanner()).rows.find(r=>r.id===first.id)!;assert.equal(effective.lastConfirmed!.vitrine,physical.vitrine);assert.equal(effective.lastConfirmed!.shelf,physical.shelf);assert.deepEqual(effective.lastConfirmed,priorConfirmation);
 data=await readVrindavanMovePlanner();registry=await readMuseumPlanVariants(actor.id);
 await assert.rejects(activateMuseumPlanVariant({revision:registry.revision,planRevision:data.revision,id:minimal},actor.id),/locations or inventory changed/);
 await assert.rejects(saveMuseumPlanVariant({revision:registry.revision,planRevision:initialRevision,name:"Stale"},actor.id),/changed/);
 console.log("PASS original snapshot, trusted targeted import, stale write rejection, switch both ways, flexible revision repair, zero inferred physical confirmations, completed minimal task replanned to future destination with physical confirmation history unchanged, source drift guard, rejected stale tier/family evidence without registry mutation");
}finally{await db.$disconnect();}
