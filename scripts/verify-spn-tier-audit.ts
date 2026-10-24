import assert from "node:assert/strict";

const url=process.env.MUSEUM_TEST_DATABASE_URL;
if(!url||!["localhost","127.0.0.1"].includes(new URL(url).hostname)||new URL(url).pathname!=="/museum_integration_test")throw Error("Disposable local museum_integration_test database required");
process.env.DATABASE_URL=url;
const {db}=await import("../lib/db");
const {readSpnTierAudit}=await import("../lib/spn-tier-audit");
try {
 const published=await db.saint.create({data:{slug:"tier-audit-public",displayName:"Same label",canonicalName:"Same label",status:"published",biographySummary:"Public life summary"}});
 const privateSaint=await db.saint.create({data:{slug:"tier-audit-private",displayName:"Same label",canonicalName:"Same label",biographySummary:"PRIVATE SUMMARY"}});
 const unplaced=await db.saint.create({data:{slug:"tier-audit-unplaced",displayName:"Unplaced source",canonicalName:"Unplaced source"}});
 const sourceKey="appMapiXrtNwnS9oZ:Saints:recTierAuditNew";
 await db.externalRecord.create({data:{sourceType:"airtable",externalId:sourceKey,entityType:"Saint",entityId:unplaced.id,rawPayloadJson:{}}});
 await db.airtableMirrorRecord.create({data:{baseId:"appMapiXrtNwnS9oZ",tableIdOrName:"Saints",recordId:"recTierAuditNew",rawFieldsJson:{Name:"Unplaced source","Vitrine #":4},rawPayloadJson:{}}});
 for(const saint of [published,privateSaint]){
  await db.biography.create({data:{saintId:saint.id,title:"Published biography",slug:"life",status:"published",bodyMarkdown:saint.id===published.id?"Public life and teaching facts":"PRIVATE BODY"}});
 }
 await db.biography.create({data:{saintId:published.id,title:"Draft biography",slug:"draft",bodyMarkdown:"PRIVATE DRAFT"}});
 const section=await db.museumSection.create({data:{name:"Tier audit fixture",slug:"tier-audit-fixture",publicVisible:false}});
 for(const saint of [published,privateSaint])await db.saintMuseumSection.create({data:{saintId:saint.id,museumSectionId:section.id,assignmentType:"primary",tier:"tertiary",confidence:"medium",status:"published"}});
 const before={saints:await db.saint.count(),assignments:await db.saintMuseumSection.count(),events:await db.auditEvent.count(),arrangements:await db.museumArrangement.count(),sources:await db.externalRecord.count()};
 const snapshot=await readSpnTierAudit();
 assert.equal(snapshot.counts.canonicalRecords,3);assert.equal(snapshot.counts.recordsWithoutWorkingPlacement,1);
 assert.equal(snapshot.sourceCoverage.mirroredRows,1);assert.equal(snapshot.sourceObservations[0].hasActiveCanonicalIdentity,true);
 assert.equal(snapshot.records.find(r=>r.saintId===published.id)!.publicBiography.biographies[0].bodyMarkdown,"Public life and teaching facts");
 assert.equal(snapshot.records.find(r=>r.saintId===privateSaint.id)!.publicProfile,null);
 assert.ok(!JSON.stringify(snapshot).includes("PRIVATE"));
 assert.ok(snapshot.unlinked.length>0);
 const after={saints:await db.saint.count(),assignments:await db.saintMuseumSection.count(),events:await db.auditEvent.count(),arrangements:await db.museumArrangement.count(),sources:await db.externalRecord.count()};
 assert.deepEqual(after,before);
 assert.equal(snapshot.museumId,"museum-spn");
 console.log("PASS real SPN reader export, same-name canonical separation, unlinked source retention, published biography filtering and read-only database preservation.");
} finally {await db.$disconnect();}
