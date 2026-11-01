import test from "node:test";
import assert from "node:assert/strict";
import {easternHeadlines,applyEasternHeadlines} from "./spn-eastern-headlines";
import {allOperationalSpnShelves} from "./spn-operational-shelves";
import {projectCompanionAdditions} from "./museum-companion-addition-projection";
import {fillFirstMoveGuide} from "./spn-fill-first-guide";
import {eastRemainderMoveGuide} from "./spn-east-remainder-guide";
import {buildLatestSpnReview} from "./spn-reviewed-proposal";
const rows=easternHeadlines.vitrines.flatMap(v=>v.allocations.map(a=>({...a,destination:v.code})));
const entries=rows.map(a=>({...a,family:"",section:"",rationale:"",lifeStatus:{tag:a.lifeTag,basis:"Reviewed"}}));
const additions=rows.map(a=>({sourceId:a.sourceId,saintId:a.saintId,sourceRevision:a.sourceRevision,vitrine:a.destination,shelf:null,version:1,updatedAt:"2026-11-01T14:00:00Z",clientRequestId:"test"}));
test("Eastern packet contains exact 12/12/11 sources, distinct groups and three unknown sizes",()=>{
 assert.deepEqual(easternHeadlines.vitrines.map(v=>v.allocations.length),[12,12,11]);assert.equal(new Set(rows.map(a=>a.sourceId)).size,35);
 assert.deepEqual(rows.filter(a=>a.knownFootprint===null).map(a=>a.destination),["24","24","24"]);
 for(const a of rows){assert.equal(allOperationalSpnShelves.vitrines.flatMap(v=>v.allocations.filter(r=>r.sourceId===a.sourceId)).length,1);if(a.lifeTag)assert.equal(a.suggestedShelfIndex,5);}
 const minati=easternHeadlines.vitrines[1].groups.find(g=>g.sourceIds.includes("recdMdwOnTHhwbwFI"))!;assert.equal(minati.kind,"city");assert.deepEqual(minati.edges,[]);
});
test("saved additions regroup across existing phases without replacing physical reports or clear state",()=>{
 const input={east:fillFirstMoveGuide,east2:eastRemainderMoveGuide};const before=JSON.stringify(input);
 const result=projectCompanionAdditions(input,additions,entries);
 for(const v of easternHeadlines.vitrines){const projected=Object.values(result).flatMap(g=>g.vitrines).filter(g=>g.code===v.code);assert.equal(projected.length,1);const ids=projected[0].families.concat(projected[0].cityGroups).flatMap(g=>g.sourceIds).filter(id=>rows.some(a=>a.sourceId===id));assert.deepEqual([...ids].sort(),v.allocations.map(a=>a.sourceId).sort());assert.equal(new Set(ids).size,ids.length);}
 assert.equal(JSON.stringify(input),before);
 assert.deepEqual(result.east.reportedPlacements,input.east.reportedPlacements);
 assert.deepEqual(result.east2.preparationVitrines,input.east2.preparationVitrines);
});
test("later destination or identity changes cannot be pulled back into an approved family",()=>{
 const guide=applyEasternHeadlines({...fillFirstMoveGuide,entries:entries.map(e=>({...e,destination:"50"}))});
 assert.ok(!guide.vitrines.some(v=>v.families.some(g=>g.id.startsWith("east-retained"))));
});
test("reviewer uses approved headlines, saved destinations and retains uncertainty",()=>{
 const review=buildLatestSpnReview([],additions);
 for(const v of easternHeadlines.vitrines){assert.equal(review.designData.options[0].assignments.find(a=>a.number===v.code)?.subsection,v.summary);const family=review.proposal.reviewedFamilies.find(f=>f.code===v.code);assert.ok(family);}
 assert.equal(review.rows.find(r=>r.sourceId==="recMmZ5qGtbPiHxJz")?.effectiveVitrine,"24");
});

test("current catalog removes superseded old case membership without losing later additions",()=>{
 const source=fillFirstMoveGuide.entries.find(e=>e.destination==="73"&&!rows.some(a=>a.sourceId===e.sourceId))!;
 const live={...source,destination:"50"};
 const result=applyEasternHeadlines(fillFirstMoveGuide,[live]);
 assert.ok(!result.vitrines.find(v=>v.code==="73")!.families.concat(result.vitrines.find(v=>v.code==="73")!.cityGroups).some(g=>g.sourceIds.includes(source.sourceId)));
 assert.equal(result.entries.find(e=>e.sourceId===source.sourceId)?.destination,"50");
});
