import assert from "node:assert/strict";

const url=process.env.MUSEUM_TEST_DATABASE_URL;
if(!url||!["localhost","127.0.0.1"].includes(new URL(url).hostname)||new URL(url).pathname!=="/museum_integration_test")throw Error("Disposable local museum_integration_test database required");
process.env.DATABASE_URL=url;
const {db}=await import("../lib/db");
const {decideMuseumSource}=await import("../lib/museum-source-review-service");
const {MuseumSourceReviewError}=await import("../lib/museum-source-review-domain");
const failsWith=(code:string)=>(error:unknown)=>error instanceof MuseumSourceReviewError && error.code===code;
const {reviewMuseumSources}=await import("../lib/museum-update-domain");
const {SPN_WEBSITE_AIRTABLE_BASE_ID:base}=await import("../lib/museum-vitrine-source");

try {
  const target=await db.saint.create({data:{slug:"source-link-survivor",displayName:"Reviewed survivor",canonicalName:"Reviewed survivor"}});
  const archived=await db.saint.create({data:{slug:"source-link-archived",displayName:"Archived identity",canonicalName:"Archived identity",status:"archived"}});
  const fields={Name:"Source evidence","Vitrine #":12,Shelf:"C"};
  const importedAt=new Date("2026-10-01T12:00:00.000Z");
  const lastSeenAt=new Date("2026-10-03T12:00:00.000Z");
  async function fixture(recordId:string, source?:{entityType:string;entityId?:string}) {
    const key=`${base}:Saints:${recordId}`;
    const raw={baseId:base,table:"Saints",record:{id:recordId,fields}};
    await db.airtableMirrorRecord.create({data:{baseId:base,tableIdOrName:"Saints",recordId,rawFieldsJson:fields,rawPayloadJson:raw,importedAt,lastSeenAt}});
    if(source)await db.externalRecord.create({data:{sourceType:"airtable",externalId:key,entityType:source.entityType,entityId:source.entityId,rawPayloadJson:raw}});
    const evidence=reviewMuseumSources([{id:recordId,fields}],source?[{externalId:key,entityType:source.entityType,entityId:source.entityId??null}]:[],new Set([target.id]));
    const planned=evidence.reviews[0];
    assert.ok(planned);
    const review=await db.museumSourceReview.create({data:{...planned,snapshot:planned.snapshot}});
    return {key,raw,review,input:{id:review.id,version:review.updatedAt.toISOString(),action:"link" as const,saintId:target.id,note:"Confirmed source identity"}};
  }
  const missing=await fixture("recMissing");
  await assert.rejects(decideMuseumSource("test-actor",{...missing.input,version:new Date(0).toISOString()}),failsWith("stale_review"));
  assert.equal(await db.externalRecord.count({where:{externalId:missing.key}}),0);
  await decideMuseumSource("test-actor",missing.input);
  const restored=await db.externalRecord.findUniqueOrThrow({where:{sourceType_externalId:{sourceType:"airtable",externalId:missing.key}}});
  assert.equal(restored.entityType,"Saint");assert.equal(restored.entityId,target.id);
  assert.deepEqual(restored.rawPayloadJson,missing.raw);
  assert.equal(restored.importedAt.toISOString(),importedAt.toISOString());
  assert.equal(restored.lastSeenAt.toISOString(),lastSeenAt.toISOString());
  assert.equal((await db.museumSourceReview.findUniqueOrThrow({where:{id:missing.review.id}})).status,"resolved");
  const audit=await db.auditEvent.findFirstOrThrow({where:{entityId:restored.id,action:"museum.source.linked"}});
  assert.equal((audit.afterJson as {restoredFromMirror:boolean}).restoredFromMirror,true);
  await assert.rejects(decideMuseumSource("test-actor",missing.input));
  assert.equal(await db.externalRecord.count({where:{externalId:missing.key}}),1);

  const placeholder=await fixture("recPlaceholder",{entityType:"airtable:Saints"});
  await decideMuseumSource("test-actor",placeholder.input);
  assert.equal((await db.externalRecord.findUniqueOrThrow({where:{sourceType_externalId:{sourceType:"airtable",externalId:placeholder.key}}})).entityId,target.id);

  const stale=await fixture("recStaleMirror");
  await db.airtableMirrorRecord.update({where:{baseId_tableIdOrName_recordId:{baseId:base,tableIdOrName:"Saints",recordId:"recStaleMirror"}},data:{rawFieldsJson:{...fields,Name:"Changed since preview"}}});
  await assert.rejects(decideMuseumSource("test-actor",stale.input),failsWith("stale_source"));
  assert.equal(await db.externalRecord.count({where:{externalId:stale.key}}),0);
  assert.equal((await db.museumSourceReview.findUniqueOrThrow({where:{id:stale.review.id}})).status,"pending");

  for(const [id,source] of [
    ["recArchivedLink",{entityType:"Saint",entityId:archived.id}],
    ["recDanglingLink",{entityType:"Saint",entityId:"unavailable-saint"}],
    ["recWrongType",{entityType:"airtable:Relics"}],
  ] as const) {
    const held=await fixture(id,source);
    await assert.rejects(decideMuseumSource("test-actor",held.input),failsWith("existing_link"));
    const preserved=await db.externalRecord.findUniqueOrThrow({where:{sourceType_externalId:{sourceType:"airtable",externalId:held.key}}});
    assert.equal(preserved.entityType,source.entityType);
    assert.equal(preserved.entityId,"entityId" in source?source.entityId:null);
  }
  const occupied=await fixture("recOccupied");
  await db.externalRecord.create({data:{sourceType:"airtable",externalId:occupied.key,entityType:"Saint",entityId:target.id,rawPayloadJson:{}}});
  await assert.rejects(decideMuseumSource("test-actor",occupied.input),failsWith("existing_link"));
  const invalidTarget=await fixture("recInvalidTarget");
  await assert.rejects(decideMuseumSource("test-actor",{...invalidTarget.input,saintId:archived.id}),failsWith("invalid_saint"));
  const absentMirror=await fixture("recAbsentMirror");
  await db.airtableMirrorRecord.delete({where:{baseId_tableIdOrName_recordId:{baseId:base,tableIdOrName:"Saints",recordId:"recAbsentMirror"}}});
  await assert.rejects(decideMuseumSource("test-actor",absentMirror.input),failsWith("missing_source"));
  const wrongScope=await fixture("recWrongScope");
  const changed=await db.museumSourceReview.update({where:{id:wrongScope.review.id},data:{sourceKey:"appOther:Saints:recWrongScope"}});
  await assert.rejects(decideMuseumSource("test-actor",{...wrongScope.input,version:changed.updatedAt.toISOString()}),failsWith("invalid_scope"));
  assert.equal(await db.saint.count(),2);
  assert.equal((await db.saint.findUniqueOrThrow({where:{id:target.id}})).displayName,"Reviewed survivor");
  assert.equal(await db.museumArrangement.count(),0);
  assert.equal(await db.museumCollectionItem.count(),0);
  assert.equal(await db.saintMuseumSection.count(),0);
  const mirror=await db.airtableMirrorRecord.findUniqueOrThrow({where:{baseId_tableIdOrName_recordId:{baseId:base,tableIdOrName:"Saints",recordId:"recMissing"}}});
  assert.deepEqual(mirror.rawFieldsJson,fields);
  console.log("PASS missing-link reconstruction, preserved raw evidence/dates, normal placeholders, stale form/source rejection, archived/dangling/occupied/wrong-type link protection, invalid target, absent mirror, museum scope, replay and unrelated-record preservation.");
} finally {
  await db.$disconnect();
}
