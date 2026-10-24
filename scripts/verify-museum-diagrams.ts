/** Only the dedicated disposable local database is accepted. */
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {diagramDomain} from "../lib/museum-diagram-layout-domain";
const url=new URL(process.env.MUSEUM_TEST_DATABASE_URL||"http://invalid");
if(!["localhost","127.0.0.1"].includes(url.hostname)||url.pathname!=="/spn_questionnaire_test")throw Error("Use the disposable local spn_questionnaire_test database.");
process.env.DATABASE_URL=url.toString();
const {db}=await import("../lib/db");
const {readMuseumDiagramLayouts:read,saveMuseumDiagramLayout:save,deleteMuseumDiagramLayout:remove}=await import("../lib/museum-diagram-layouts");
const actor=await db.user.create({data:{email:`diagram-${randomUUID()}@example.invalid`,roles:["site_admin"],active:true}});
const denied=await db.user.create({data:{email:`diagram-${randomUUID()}@example.invalid`,roles:[],active:true}});
try{
 const beforeVr=await read("museum-vrindavan",actor.id),beforeSpn=await read("museum-spn",actor.id);
 const beforeCounts=[await db.museumArrangement.count(),await db.museumCuratorProposal.count(),await db.museumCollectionItem.count()];
 const input={museumId:"museum-spn",revision:beforeSpn.revision,name:`Test ${randomUUID()}`,positions:[{nodeId:diagramDomain("museum-spn").nodeIds[0],x:.2,y:.3}]};
 await assert.rejects(save(input,denied.id),/permission/);
 await assert.rejects(read("museum-spn",denied.id),/access/);
 const saved=await save(input,actor.id),view=saved.layouts.find(v=>v.name===input.name)!;
 assert.ok(view);assert.deepEqual((await read("museum-spn",actor.id)).layouts,saved.layouts);
 assert.deepEqual(await read("museum-vrindavan",actor.id),beforeVr);
 await assert.rejects(save(input,actor.id),/changed/);
 const changed=await save({...input,revision:saved.revision,id:view.id,positions:[{...input.positions[0],x:.7}]},actor.id);
 assert.equal(changed.layouts.find(v=>v.id===view.id)!.positions[0].x,.7);
 const removed=await remove({museumId:"museum-spn",revision:changed.revision,id:view.id},actor.id);
 assert.deepEqual(removed.layouts,beforeSpn.layouts);
 assert.deepEqual([await db.museumArrangement.count(),await db.museumCuratorProposal.count(),await db.museumCollectionItem.count()],beforeCounts);
 console.log("PASS: durable save/reopen/update/delete, museum isolation, stale-save rejection, permissions, no physical-placement effects.");
}finally{
 await db.auditEvent.deleteMany({where:{userId:actor.id,entityType:"MuseumDiagramLayouts"}});
 await db.user.deleteMany({where:{id:{in:[actor.id,denied.id]}}});
 await db.$disconnect();
}
