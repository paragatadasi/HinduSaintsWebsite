import assert from "node:assert/strict";
const url=process.env.MUSEUM_RECONCILIATION_TEST_DATABASE_URL;
if(!url)throw Error("Set the disposable museum_integration_test database URL");
const target=new URL(url);
if(!["localhost","127.0.0.1"].includes(target.hostname)||target.pathname!=="/museum_integration_test")throw Error("Refusing to write outside the disposable local database");
process.env.DATABASE_URL=url;
const {db}=await import("../lib/db");
const {readFamilyTreeReconciliation,reconcileFamilyTreeConnections}=await import("../lib/family-tree-reconciliation");
const suffix=Date.now(),ids:string[]=[],recordIds:string[]=[];
const user=await db.user.create({data:{email:`family-fixture-${suffix}@example.invalid`,roles:["site_admin"]}});
const rows:Record<string,string>[]=[{RecordId:`recTeacher${suffix}`,Name:"Teacher",FamilyID:"TEST",Disciples:`recStudent${suffix}`},{RecordId:`recStudent${suffix}`,Name:"Student",FamilyID:"TEST",Masters:`recTeacher${suffix}`},{RecordId:`recUnknown${suffix}`,Name:"Unresolved",FamilyID:"TEST",Masters:`recTeacher${suffix}`}];
try{
 for(let i=0;i<2;i++){const saint=await db.saint.create({data:{slug:`family-reconcile-${suffix}-${i}`,canonicalName:rows[i].Name,displayName:rows[i].Name,status:"draft"}});ids.push(saint.id);const link=await db.externalRecord.create({data:{sourceType:"airtable",externalId:`appFixture:Saints:${rows[i].RecordId}`,entityType:"Saint",entityId:saint.id,rawPayloadJson:rows[i]}});recordIds.push(link.id);}
 const before=await db.saintRelationship.count();
 const preview=await readFamilyTreeReconciliation(db,rows);assert.equal(preview.counts.missing,1);assert.equal(preview.counts.unresolved,1);
 assert.equal(before,await db.saintRelationship.count());
 const first=await reconcileFamilyTreeConnections(user.id,preview.version,rows);assert.deepEqual(first,{created:1,issues:1});
 const connection=await db.saintRelationship.findFirstOrThrow({where:{fromSaintId:ids[1],toSaintId:ids[0]},include:{relationshipSources:true,externalRecord:true}});
 assert.equal(connection.status,"needs_review");assert.equal(connection.publicVisible,false);assert.equal(connection.relationshipSources.length,1);
 assert.equal((connection.externalRecord!.rawPayloadJson as {evidence:unknown[]}).evidence.length,2);
 const refreshed=await readFamilyTreeReconciliation(db,rows);assert.equal(refreshed.counts.missing,0);
 assert.deepEqual(await reconcileFamilyTreeConnections(user.id,refreshed.version,rows),{created:0,issues:0});assert.equal(await db.saintRelationship.count(),before+1);
 await db.saintRelationship.update({where:{id:connection.id},data:{status:"archived",notes:"Curator rejected"}});
 await assert.rejects(()=>reconcileFamilyTreeConnections(user.id,refreshed.version,rows),/changed/);
 const archived=await readFamilyTreeReconciliation(db,rows);assert.equal(archived.counts.conflict,1);assert.deepEqual(await reconcileFamilyTreeConnections(user.id,archived.version,rows),{created:0,issues:1});
 const retained=await db.saintRelationship.findUniqueOrThrow({where:{id:connection.id}});assert.equal(retained.status,"archived");assert.equal(retained.notes,"Curator rejected");
 assert.equal(await db.saintRelationship.count(),before+1);
 const source=await db.externalRecord.findMany({where:{sourceType:{in:["museum_family_export","museum_family_connection"]}}});recordIds.push(...source.map(r=>r.id));
 assert.ok(await db.auditEvent.count({where:{userId:user.id,action:"museum.family_connection.imported"}}));
 console.log("PASS private connections, reciprocal direction, immutable provenance, audited writes, idempotent issues/import, stale preview rejection and archived curator preservation");
}finally{
 await db.saint.deleteMany({where:{id:{in:ids}}});await db.reconciliationIssue.deleteMany({where:{entityType:"ExternalRecord",entityId:{in:recordIds}}});await db.auditEvent.deleteMany({where:{userId:user.id}});await db.externalRecord.deleteMany({where:{id:{in:recordIds}}});await db.user.delete({where:{id:user.id}});await db.$disconnect();
}
