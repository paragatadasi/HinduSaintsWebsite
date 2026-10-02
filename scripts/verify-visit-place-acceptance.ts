import assert from "node:assert/strict";
const url=process.env.MUSEUM_TEST_DATABASE_URL;
if(!url||!["localhost","127.0.0.1"].includes(new URL(url).hostname)||new URL(url).pathname!=="/museum_integration_test") throw Error("Disposable local test database required");
process.env.DATABASE_URL=url;
const {db}=await import("../lib/db");
const {stageVisitPlaceResearch,decideVisitPlaceResearch}=await import("../lib/visit-place-review");
const {previewVisitAcceptance,acceptVisitPlaces}=await import("../lib/visit-place-acceptance");
const {getMuseumProposalData}=await import("../lib/museum-proposals");
const {getEditableMuseumProposalData}=await import("../lib/museum-family-moves");
const {getDirectMuseumProposals}=await import("../lib/museum-direct-proposals");
const {reviewMuseumProposal}=await import("../lib/museum-service");
const {getSaintPreviewBaseById}=await import("../lib/public-saints");
try {
 const actor=await db.user.create({data:{email:"visit-accept-fixture@example.invalid",roles:["data_admin"]}});
 const old=await db.place.create({data:{slug:"old-geo",name:"Old locality",country:"India",region:"Maharashtra"}});
 const locality=await db.place.create({data:{slug:"vrindavan",name:"Vrindavan",country:"India",latitude:27,longitude:77}});
 const source=getMuseumProposalData().placements.find(p=>p.tier==="Tertiary")!;
 const saint=await db.saint.create({data:{slug:"visit-accept-published",canonicalName:"Test saint",displayName:"Test saint",status:"published",places:{create:[{placeId:old.id,placeType:"primary"},{placeId:old.id,placeType:"birth"}]}}});
 const draft=await db.saint.create({data:{slug:"visit-accept-draft",canonicalName:"Draft",displayName:"Draft",status:"draft"}});
 await db.externalRecord.create({data:{sourceType:"airtable",entityType:"Saint",externalId:`appFixture:Saints:${source.id}`,entityId:saint.id,rawPayloadJson:{}}});
 const data={excel_row:2,name:"Test saint",slug:saint.slug,visit_place_name:"Test Ashram",visit_place_kind:"ashram",locality:"Vrindavan",state_or_region:"Uttar Pradesh",country:"India",latitude:27.55,longitude:77.7,location_confidence:"high",research_notes:"PRIVATE research",sources:"Team research",catalog_places:"Old locality"};
 const bundle={sourceName:"Private fixture",sourceSheet:"acceptance",sha256:"a".repeat(64),rows:[data,{...data,excel_row:3,slug:draft.slug,name:"Draft"}]};
 await stageVisitPlaceResearch(actor.id,bundle);
 const proposals=await db.visitPlaceProposal.findMany({where:{sourceName:bundle.sourceName},orderBy:{sourceRow:"asc"}});
 let first=await previewVisitAcceptance(proposals[0].id);const second=await previewVisitAcceptance(proposals[1].id);
 assert.equal(first.candidate?.id,locality.id);assert.equal(first.blocked,"");assert.equal(first.currentPrimary,old.name);
 await assert.rejects(acceptVisitPlaces(actor.id,{selections:[first.selection],updatePrimary:true}));
 // Any changed canonical relationship invalidates the entire preview, not just the edited saint.
 await db.saintPlace.create({data:{saintId:saint.id,placeId:locality.id,placeType:"associated"}});
 await assert.rejects(acceptVisitPlaces(actor.id,{selections:[first.selection,second.selection],confirm:"on",updatePrimary:true}));
 assert.equal(await db.saintVisitPlace.count(),0);assert.equal((await db.visitPlaceProposal.findUniqueOrThrow({where:{id:first.id}})).status,"pending");
 first=await previewVisitAcceptance(first.id);
 const result=await acceptVisitPlaces(actor.id,{selections:[first.selection,second.selection],confirm:"on",updatePrimary:true,note:""});assert.equal(result.accepted,2);
 assert.equal(await db.saintVisitPlace.count(),2);assert.equal(await db.place.count(),2);
 const links=await db.saintPlace.findMany({where:{saintId:saint.id}});
 assert.ok(links.some(p=>p.placeId===old.id&&p.placeType==="associated"));assert.ok(links.some(p=>p.placeId===old.id&&p.placeType==="birth"));
 assert.equal(links.filter(p=>p.placeId===locality.id).length,1);assert.equal(links.filter(p=>p.placeType==="primary").length,1);assert.equal(links.find(p=>p.placeType==="primary")!.placeId,locality.id);
 assert.equal(Number((await db.place.findUniqueOrThrow({where:{id:locality.id}})).latitude),27);
 await assert.rejects(acceptVisitPlaces(actor.id,{selections:[first.selection],confirm:"on",updatePrimary:true}));
 assert.deepEqual(await stageVisitPlaceResearch(actor.id,bundle),{staged:0,unchanged:2,unmatched:0});
 await assert.rejects(decideVisitPlaceResearch(actor.id,{id:first.id,version:2,action:"reopen",catalogDecision:"keep",note:"Stale form"},first.data));
 const publicSaint=await getSaintPreviewBaseById(saint.id);assert.equal(publicSaint?.primaryLocation,"Vrindavan");assert.equal(publicSaint?.visitPlaces?.[0].name,"Test Ashram");
 assert.ok(!JSON.stringify(publicSaint).includes("PRIVATE research"));assert.ok(!JSON.stringify(publicSaint?.visitPlaces).includes("latitude"));assert.equal((await db.saint.findUniqueOrThrow({where:{id:draft.id}})).status,"draft");
 const editable=await getEditableMuseumProposalData();const placement=editable.placements.find(p=>p.id===source.id)!;assert.equal(placement.section,"Braj & Krishna Bhakti");
 const direct=await getDirectMuseumProposals();const proposal=direct.proposals.find(p=>p.externalId.endsWith(source.id)&&p.sourceKind==="legacy-export")!;assert.equal(proposal.payload?.section,placement.section);
 assert.equal(await db.saintMuseumSection.count(),0);
 await reviewMuseumProposal({saintId:saint.id,version:0,actorId:actor.id,proposalId:proposal.id,decision:"accept"});
 const confirmed=await db.saintMuseumSection.findFirstOrThrow({where:{saintId:saint.id,assignmentType:"primary",status:"published"},include:{museumSection:true}});assert.equal(confirmed.museumSection.name,"Braj & Krishna Bhakti");
 const protectedView=await getEditableMuseumProposalData();assert.equal(protectedView.placements.find(p=>p.id===source.id)!.section,source.section);
 // Ambiguous places block acceptance; unselected rows and canonical destinations stay unchanged.
 await db.place.create({data:{slug:"vrindavan-duplicate",name:"Vrindavan",country:"India"}});
 await stageVisitPlaceResearch(actor.id,{...bundle,sourceSheet:"ambiguous",rows:[data]});
 const ambiguous=await db.visitPlaceProposal.findFirstOrThrow({where:{sourceSheet:"ambiguous"}});assert.match((await previewVisitAcceptance(ambiguous.id)).blocked,/Multiple localities/);
 // Later source changes cannot overwrite accepted destinations.
 await stageVisitPlaceResearch(actor.id,{...bundle,rows:[{...data,visit_place_name:"Changed source claim"}]});
 const changed=await db.visitPlaceProposal.findFirstOrThrow({where:{sourceKey:proposals[0].sourceKey,status:"pending"}});assert.match((await previewVisitAcceptance(changed.id)).blocked,/conflicts/);
 // Acceptance must not accidentally expose a private Place overview or reuse an archived locality.
 for(const [localityName,publicationStatus,overviewMarkdown,expected] of [["Private Town","unpublished","Private editorial research",/unpublished/],["Archived Town","archived",null,/archived/]] as const) {
  await db.place.create({data:{slug:localityName.toLowerCase().replaceAll(" ","-"),name:localityName,country:"India",publicationStatus,overviewMarkdown}});
  await stageVisitPlaceResearch(actor.id,{...bundle,sourceSheet:localityName,rows:[{...data,locality:localityName}]});
  const proposal=await db.visitPlaceProposal.findFirstOrThrow({where:{sourceSheet:localityName}});assert.match((await previewVisitAcceptance(proposal.id)).blocked,expected);
 }
 const keep=await db.saint.create({data:{slug:"retain-primary",canonicalName:"Keep",displayName:"Keep",status:"published",places:{create:{placeId:old.id,placeType:"primary"}}}});
 await stageVisitPlaceResearch(actor.id,{...bundle,sourceSheet:"without-primary",rows:[{...data,slug:keep.slug,locality:"Separate Town"}]});
 const keepProposal=await db.visitPlaceProposal.findFirstOrThrow({where:{sourceSheet:"without-primary"}});const keepPlan=await previewVisitAcceptance(keepProposal.id);
 await acceptVisitPlaces(actor.id,{selections:[keepPlan.selection],confirm:"on",updatePrimary:false});
 assert.equal((await db.saintPlace.findFirstOrThrow({where:{saintId:keep.id,placeType:"primary"}})).placeId,old.id);
 assert.equal((await db.saintVisitPlace.findFirstOrThrow({where:{saintId:keep.id}})).localityPlaceId,null);
 console.log("PASS atomic bulk acceptance, stale canonical protection, unique locality reuse, association preservation, no shared coordinate overwrite, idempotence, public privacy/draft gates, consistent tertiary proposals, confirmed placement protection, ambiguous/private/archived place protection, optional primary change and later source conflicts");
} finally {await db.$disconnect();}
