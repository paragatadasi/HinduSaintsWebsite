import test from "node:test";
import assert from "node:assert/strict";
import packet from "../data/museum/spn-missing-receivers-guide-v1.json";
import {maharashtraReceivingGuide as adapter} from "./spn-maharashtra-receiving-guide";
import {allOperationalSpnShelves} from "./spn-operational-shelves";
import {currentReceiverGuideDefinitions} from "./spn-starter-guide-registry";
import {companionVitrineOwner,projectCompanionAdditions} from "./museum-companion-addition-projection";
import {westV59MoveGuide} from "./spn-west-v59-guide";

test("four approved physical cases register their exact roster without reviving old47 or replacing59",()=>{
 assert.equal(packet.rows.length,70);
 assert.deepEqual(["47","58","60","61"].map(code=>packet.rows.filter(r=>r.destination===code).length),[17,12,21,20]);
 for(const code of ["47","58","60","61"]){
  assert.ok(currentReceiverGuideDefinitions(code).includes(adapter.definition));
  assert.equal(companionVitrineOwner({maharashtra:adapter.guide,west47:westV59MoveGuide},code),"maharashtra");
 }
 assert.equal(companionVitrineOwner({maharashtra:adapter.guide,west47:westV59MoveGuide},"59"),"west47");
 for(const id of ["rec8QbPLpAjtQSu4Q","recpyhIScDxJbDdE1","recneBQ4cSLNVqSSq"])assert.ok(!packet.rows.some(r=>r.sourceId===id));
 assert.ok(adapter.guide.vitrines.every(v=>v.summary&&!v.summary.includes("Trial")));
});

test("shelf recommendations cover the accepted roster once and preserve living lower bands",()=>{
 const all=allOperationalSpnShelves.vitrines.flatMap(v=>v.allocations);
 for(const row of packet.rows){
  assert.equal(all.filter(a=>a.sourceId===row.sourceId).length,1,row.sourceId);
  const target=row.sourceId==="recRnVf9eR7izgH7r"?"82":row.destination;
  const shelf=allOperationalSpnShelves.vitrines.find(v=>v.code===target)!.allocations.find(a=>a.sourceId===row.sourceId)!;
  assert.equal(shelf.saintId,row.saintId);
  assert.equal(shelf.sourceRevision,row.sourceRevision);
  if(row.lifeStatus.tag&&!shelf.preserveCurrentPlacement)assert.ok([4,5].includes(shelf.suggestedShelfIndex!));
 }
});

test("a later curator addition moves to its existing receiver instead of duplicating a case",()=>{
 const row=adapter.guide.entries[0];
 const addition={sourceId:row.sourceId,saintId:row.saintId,vitrine:"59",shelf:null} as Parameters<typeof projectCompanionAdditions>[1][number];
 const result=projectCompanionAdditions({maharashtra:adapter.guide,west47:westV59MoveGuide},[addition],[row]);
 assert.ok(!result.maharashtra.vitrines.some(v=>v.code==="59"));
 assert.ok(result.west47.vitrines.find(v=>v.code==="59")!.cityGroups.some(g=>g.sourceIds.includes(row.sourceId)));
});
