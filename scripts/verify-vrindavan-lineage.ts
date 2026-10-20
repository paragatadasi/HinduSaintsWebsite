import assert from "node:assert/strict";
import {randomBytes} from "node:crypto";
const url=process.env.MUSEUM_LINEAGE_TEST_DATABASE_URL;if(!url)throw Error("Set disposable test database URL");const target=new URL(url);if(!["localhost","127.0.0.1"].includes(target.hostname)||target.pathname!=="/museum_integration_test")throw Error("Refusing non-test database");process.env.DATABASE_URL=url;
const {db}=await import("../lib/db");const {readVrindavanWorkingData}=await import("../lib/vrindavan-working-data");const {saveVrindavanProposal,saveVrindavanArrangement}=await import("../lib/vrindavan-proposal-service");const {readVrindavanLineageReview,applyVrindavanLineage,saveVrindavanLineageAnchor}=await import("../lib/vrindavan-lineage-review");
const suffix=Date.now(),hash=randomBytes(32).toString("hex");try{
 const actor=await db.user.create({data:{email:`lineage-${suffix}@example.invalid`,roles:["curator"],active:true}});
 await db.museum.upsert({where:{id:"museum-vrindavan"},create:{id:"museum-vrindavan",slug:"vrindavan",name:"Vrindavan"},update:{}});
 const section=await db.museumSection.create({data:{slug:`gaudiya-${suffix}`,name:"Gaudiya Vaishnava",status:"published"}});
 const group=await db.museumExhibitGroup.create({data:{museumSectionId:section.id,key:"fixture",label:"Reviewed fixture family"}});
 const saints:{id:string;displayName:string}[]=[];
 for(let i=0;i<3;i++){
  const saint=await db.saint.create({data:{slug:`lineage-${suffix}-${i}`,displayName:`Lineage fixture ${i}`,canonicalName:`Lineage fixture ${i}`}});saints.push(saint);
  await db.saintMuseumSection.create({data:{saintId:saint.id,museumSectionId:section.id,exhibitGroupId:group.id,tier:"featured",status:"published"}});
  await db.museumCollectionImport.create({data:{museumId:"museum-vrindavan",sourceKey:`vrindavan-workbook:${hash}:Sheet1:${i+2}`,fingerprint:hash+String(i),status:"identity_linked",reviewedAt:new Date(),rawJson:{cells:[]},normalizedJson:{mappingVersion:"vrindavan-identity-v1",sourceName:"Fixture.xlsx",sourceRow:i+2,name:saint.displayName,place:"",relic:"Cloth",quantity:"2 pieces",display:"3",position:"3.4",comments:"",warnings:[],saintIds:[saint.id],note:null}}});
 }
 await db.museumCollectionImport.create({data:{museumId:"museum-vrindavan",sourceKey:`vrindavan-workbook:${hash}:Sheet1:8`,fingerprint:hash+"pending",status:"pending",rawJson:{cells:[]},normalizedJson:{mappingVersion:"vrindavan-identity-v1",sourceName:"Fixture.xlsx",sourceRow:8,name:"Unmatched",place:"",relic:"Cloth",quantity:"1",display:"3",position:"4",comments:"",warnings:[],saintIds:[],note:null}}});
 let working=await readVrindavanWorkingData();let protectedRow=working.placements.find(r=>r.saintId===saints[2].id)!;
 await saveVrindavanProposal({saintId:protectedRow.saintId,revision:protectedRow.curatorProposalRevision,section:section.name,tier:"Secondary",groupKey:""},actor.id);
 working=await readVrindavanWorkingData();const initial=working.placements.find(r=>r.saintId===saints[0].id)!;
 await saveVrindavanArrangement({placementId:initial.id,familyKey:initial.familyId,revision:initial.arrangement!.revision,status:"Planned",vitrine:"17",shelf:"3.4"},actor.id);
 const before={saints:await db.saint.findMany(),spn:await db.saintMuseumSection.findMany(),sources:await db.museumCollectionImport.findMany(),arrangements:await db.museumArrangement.findMany(),physical:await db.museumItemPlacement.findMany()};
 let review=await readVrindavanLineageReview();assert.equal(review.summary.uniqueConfirmedSaints,3);assert.equal(review.summary.excludedPendingSourceRows,1);assert.equal(review.counts.protected,1);assert.equal(review.counts.changed,2);
 await assert.rejects(applyVrindavanLineage(actor.id,{revision:review.revision,confirm:"on"}),/Region-only section replacement is disabled/);
 working=await readVrindavanWorkingData();const after=working.placements.find(r=>r.saintId===saints[0].id)!;
 assert.equal(after.section,section.name);assert.equal(after.familyId,initial.familyId);assert.equal(after.arrangement!.status,"Planned");assert.equal(after.arrangement!.vitrine,"17");assert.equal(after.arrangement!.shelf,"3.4");
 assert.ok(!working.sections.some(s=>s.name==="The South"));
 assert.deepEqual(await db.saint.findMany(),before.saints);assert.deepEqual(await db.saintMuseumSection.findMany(),before.spn);assert.deepEqual(await db.museumCollectionImport.findMany(),before.sources);assert.deepEqual(await db.museumArrangement.findMany(),before.arrangements);assert.deepEqual(await db.museumItemPlacement.findMany(),before.physical);
 assert.equal(await db.externalRecord.count({where:{sourceType:"vrindavan_lineage_proposal"}}),0);
 console.log("PASS obsolete region-only apply blocked; subsections, saved destinations, identities, SPN and physical records unchanged");
}finally{await db.$disconnect();}
