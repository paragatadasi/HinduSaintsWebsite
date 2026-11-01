import test from "node:test";
import assert from "node:assert/strict";
import packet from "../data/museum/spn-puri-odisha-approved-v4.json";
import {eastRemainderMoveGuide as guide, eastRemainderGuideContext, projectEastRemainderGuide, assertEastRemainderRecords} from "./spn-east-remainder-guide";
import {eastRemainderMoveGuide as prior} from "./spn-east-remainder-guide-v1";
import {starterMoveGuide} from "./spn-starter-move-guide";
import {allOperationalSpnShelves} from "./spn-operational-shelves";
import {projectCompanionAdditions} from "./museum-companion-addition-projection";
import {currentReceiverGuideDefinitions} from "./spn-starter-guide-registry";
import {pagalComponentReceiptId} from "./spn-pagal-component-placement";
import type {PhysicalState} from "./spn-move-guide";
import type {ShelfPlanningContext} from "./museum-shelf-planning-context";

const context: ShelfPlanningContext = {version:"test", mode:"recommendations_only", physicalActionsEnabled:false, cases:[], reviewedChanges:[]};
function fixture() {
 const physical: PhysicalState = {rows:packet.rows.map(row=>({sourceId:row.sourceId,saintId:row.saintId,name:row.name,original:{kind:"vitrine",code:"19",label:"Vitrine 19"},current:{kind:"vitrine",code:"28",label:"Vitrine 28"},currentBasis:"confirmed",currentVersion:2,currentRevision:"a".repeat(64),sourceRevision:row.sourceRevision,fixedHousing:false,verifiedItemIds:[],identityChanged:false})),unmappedCurrentLocations:[]};
 const review={rows:packet.rows.map(row=>({sourceId:row.sourceId,saintId:row.saintId,effectiveVitrine:row.proposedVitrine})),proposal:{pendingPlacements:[]}};
 return {physical,review};
}
test("approved 37 form two qualified stories without invented relationships or shelves",()=>{
 assert.equal(packet.rows.length,37);
 for(const [code,count] of [["25",17],["26",20]] as const) assert.equal(guide.entries.filter(e=>e.destination===code).length,count);
 const v25=guide.vitrines.find(v=>v.code==="25")!;
 assert.equal(v25.families[0].sourceIds.length,2);
 assert.match(v25.summary,/Jagannatha Das.*Achyutananda/);
 assert.ok(v25.families.every(g=>!g.edges?.length));
 assert.equal(guide.entries.find(e=>e.sourceId==="recbCsiExuW8dTUUM")!.tier,"Tertiary");
 assert.equal(guide.entries.filter(e=>e.reviewOnly).length,2);
 assert.equal(guide.contextAnchors?.length,2);
 assert.deepEqual(guide.entries.filter(e=>e.destination==="24"),prior.entries.filter(e=>e.destination==="24"));
 assert.ok(!allOperationalSpnShelves.vitrines.some(v=>["25","26"].includes(v.code)));
 assert.ok(allOperationalSpnShelves.vitrines.some(v=>v.code==="24"));
 assert.equal(packet.rows.find(r=>r.sourceId==="rec9vEn5oj7QZTXl0")!.knownFootprint,null);
 assert.ok(currentReceiverGuideDefinitions("25").some(d=>d.context.guideVersion===eastRemainderGuideContext.guideVersion));
});
test("projection preserves physical placements and holds context, changed identities and later destinations",()=>{
 const f=fixture(),before=structuredClone(f.physical);
 const projected=projectEastRemainderGuide([],f.physical,context,f.review);
 assert.deepEqual(f.physical,before);
 assert.ok(projected.entries.filter(e=>e.destination!=="24").every(e=>e.currentLocation?.code==="28"));
 for(const id of ["recje6xb9KoUwRpQL","reclyIPFpFR6q67Bx","rec9vEn5oj7QZTXl0"]) assert.throws(()=>assertEastRemainderRecords([{sourceId:id,to:{kind:"vitrine",code:"26"}}],projected));
 const row=f.review.rows.find(r=>r.sourceId==="rec1mXGzzcIe1YtQv")!;
 row.effectiveVitrine="80";
 const changed=projectEastRemainderGuide([],f.physical,context,f.review);
 assert.ok(!changed.entries.some(e=>e.sourceId===row.sourceId));
 assert.equal(changed.outgoingDependencies?.find(e=>e.sourceId===row.sourceId)?.proposedDestination,"80");
});
test("native additions remove superseded starter instructions without moving physical records",()=>{
 const f=fixture();
 const live=projectEastRemainderGuide([],f.physical,context,f.review);
 const additions=packet.rows.map(row=>({sourceId:row.sourceId,saintId:row.saintId,sourceRevision:row.sourceRevision,vitrine:row.proposedVitrine,shelf:null,version:1,updatedAt:"2026-11-01T04:00:00Z",clientRequestId:"00000000-0000-4000-8000-000000000000"}));
 const starter=starterMoveGuide;
 const output=projectCompanionAdditions({starter,east2:live},additions,live.entries);
 // The two contextual records are not active physical members of either guide.
 const visible=output.east2.vitrines.filter(v=>v.code!=="24").flatMap(v=>[...v.families,...v.cityGroups].flatMap(g=>g.sourceIds));
 assert.equal(visible.length,35);
 assert.equal(new Set(visible).size,35);
 const stale=output.starter.vitrines.flatMap(v=>[...v.families,...v.cityGroups].flatMap(g=>g.sourceIds));
 assert.ok(stale.every(id=>!packet.rows.some(row=>row.sourceId===id)));
 assert.ok(output.east2.entries.filter(e=>e.destination!=="24").every(e=>e.currentLocation?.code==="28"));
});

test("approved non-stick continuation survives the older native parent destination",()=>{
 const f=fixture();
 const row=f.physical.rows.find(r=>r.sourceId==="rec7GxgNvmubmTvMM")!;
 row.current=null; row.currentBasis="unknown";
 row.componentPlacement={sourceId:row.sourceId,receiptId:pagalComponentReceiptId,recordedAt:"2026-10-31T15:45:00Z",revision:"scoped",origin:{kind:"vitrine",code:"19",label:"Vitrine 19"},location:{kind:"table",code:"staging-area",label:"Staging area"},scope:"vitrine_19_contents_only",excludedWalkingSticks:{location:null,status:"unverified"},expectedSourceRevision:row.sourceRevision,previousCurrentRevision:"before",previousLocationVersion:0};
 f.review.rows.find(r=>r.sourceId===row.sourceId)!.effectiveVitrine="26";
 const projected=projectEastRemainderGuide([],f.physical,context,f.review);
 const entry=projected.entries.find(e=>e.sourceId===row.sourceId)!;
 assert.equal(entry.destination,"25"); assert.equal(entry.componentScope,"vitrine_19_contents_only"); assert.equal(entry.movementBlockedReason,undefined);
 const addition={sourceId:row.sourceId,saintId:row.saintId,sourceRevision:row.sourceRevision,vitrine:"26",shelf:null,version:1,updatedAt:"2026-11-01T04:00:00Z",clientRequestId:"00000000-0000-4000-8000-000000000000"};
 const output=projectCompanionAdditions({east2:projected},[addition],projected.entries).east2;
 assert.equal(output.entries.find(e=>e.sourceId===row.sourceId)!.destination,"25");
 assert.ok(output.vitrines.find(v=>v.code==="25")!.families.some(g=>g.sourceIds.includes(row.sourceId)));
 assert.equal(row.current,null);
});
