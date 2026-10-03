import assert from "node:assert/strict";
import {randomBytes} from "node:crypto";
const url=process.env.MUSEUM_MEMBERSHIP_TEST_DATABASE_URL;if(!url)throw Error("Set disposable test database URL");const target=new URL(url);if(!["localhost","127.0.0.1"].includes(target.hostname)||target.pathname!=="/museum_membership_test")throw Error("Refusing non-test database");process.env.DATABASE_URL=url;
const {db}=await import("../lib/db");const {readVrindavanWorkingData}=await import("../lib/vrindavan-working-data");const {saveVrindavanProposal,moveVrindavanFamily,saveVrindavanArrangement}=await import("../lib/vrindavan-proposal-service");
const suffix=Date.now(),hash=randomBytes(32).toString("hex");try{
 const actor=await db.user.create({data:{email:`vrindavan-edit-${suffix}@example.invalid`,roles:["curator"],active:true}});
 await db.museum.upsert({where:{id:"museum-vrindavan"},create:{id:"museum-vrindavan",slug:"vrindavan",name:"Vrindavan"},update:{}});
 const a=await db.museumSection.create({data:{slug:`vri-a-${suffix}`,name:`Vri A ${suffix}`,status:"published"}});const b=await db.museumSection.create({data:{slug:`vri-b-${suffix}`,name:`Vri B ${suffix}`,status:"published"}});
 const group=await db.museumExhibitGroup.create({data:{museumSectionId:a.id,key:"fixture",label:"Shared source family"}});
 const saints:{id:string;displayName:string}[]=[];
 for(let i=0;i<2;i++){
 const saint=await db.saint.create({data:{slug:`vri-${suffix}-${i}`,displayName:`Vrindavan fixture ${i}`,canonicalName:`Vrindavan fixture ${i}`}});saints.push(saint);
 await db.saintMuseumSection.create({data:{saintId:saint.id,museumSectionId:a.id,exhibitGroupId:group.id,tier:"featured",status:"published"}});
 await db.museumCollectionImport.create({data:{museumId:"museum-vrindavan",sourceKey:`vrindavan-workbook:${hash}:Sheet1:${i+2}`,fingerprint:hash+String(i),status:"identity_linked",reviewedAt:new Date(),rawJson:{cells:[]},normalizedJson:{mappingVersion:"vrindavan-identity-v1",sourceName:"Fixture.xlsx",sourceRow:i+2,name:saint.displayName,place:"",relic:"Cloth",quantity:"2 pieces",display:"3",position:"3.4",comments:"",warnings:[],saintIds:[saint.id],note:null}}});
 }
 const original=await db.saintMuseumSection.findMany({where:{saintId:{in:saints.map(s=>s.id)}}});const items=await db.museumCollectionItem.count(),locations=await db.museumItemPlacement.count();
 let view=await readVrindavanWorkingData();let row=view.placements.find(p=>p.saintId===saints[0].id)!;const familyKey=row.familyId;
 await saveVrindavanProposal({saintId:row.saintId,revision:row.curatorProposalRevision,section:b.name,tier:"Secondary",groupKey:""},actor.id);
 await assert.rejects(saveVrindavanProposal({saintId:row.saintId,revision:row.curatorProposalRevision,section:a.name,tier:"Featured",groupKey:familyKey},actor.id),/changed/);
 view=await readVrindavanWorkingData();assert.equal(view.families.find(f=>f.key===familyKey)!.count,1);
 const family=view.families.find(f=>f.key===familyKey)!;await moveVrindavanFamily({familyKey,revision:family.revision,section:b.name},actor.id);
 view=await readVrindavanWorkingData();assert.equal(view.placements.every(p=>p.section===b.name),true);assert.equal(view.placements.find(p=>p.saintId===saints[0].id)!.familyId,"");
 row=view.placements.find(p=>p.saintId===saints[0].id)!;
 await assert.rejects(saveVrindavanArrangement({placementId:row.id,familyKey:"",revision:row.arrangement!.revision,status:"Planned"},actor.id),/vitrine/);
 await saveVrindavanArrangement({placementId:row.id,familyKey:"",revision:row.arrangement!.revision,status:"Planned",vitrine:"17",shelf:"3.4"},actor.id);
 view=await readVrindavanWorkingData();row=view.placements.find(p=>p.saintId===saints[0].id)!;assert.equal(row.arrangement!.status,"Planned");assert.equal(row.arrangement!.shelf,"3.4");
 await saveVrindavanArrangement({placementId:row.id,familyKey:"",revision:row.arrangement!.revision,status:"Implemented",physicalConfirmation:"yes",inventoryAcknowledged:"yes"},actor.id);
 view=await readVrindavanWorkingData();row=view.placements.find(p=>p.saintId===saints[0].id)!;assert.equal(row.arrangement!.status,"Implemented");
 await saveVrindavanProposal({saintId:row.saintId,revision:row.curatorProposalRevision,section:a.name,tier:row.tier,groupKey:familyKey},actor.id);
 view=await readVrindavanWorkingData();assert.equal(view.families.find(f=>f.key===familyKey)!.count,2);assert.equal(view.placements.find(p=>p.saintId===saints[0].id)!.arrangement!.status,"Proposed");
 const current=view.families.find(f=>f.key===familyKey)!;await saveVrindavanArrangement({placementId:"family",familyKey,revision:current.arrangement.revision,status:"Planned",vitrine:"9"},actor.id,true);
 assert.equal((await readVrindavanWorkingData()).placements.every(p=>p.arrangement!.status==="Planned"),true);
 assert.deepEqual(await db.saintMuseumSection.findMany({where:{saintId:{in:saints.map(s=>s.id)}}}),original);assert.equal(await db.museumCollectionItem.count(),items);assert.equal(await db.museumItemPlacement.count(),locations);
 assert.equal(await db.museumArrangement.count({where:{museumId:"museum-spn",placementId:{startsWith:"vrindavan:"}}}),0);
 console.log("PASS Vrindavan edits, detach/restore, family moves/planning, stale forms, status invalidation and independent SPN/physical records");
}finally{await db.$disconnect();}
