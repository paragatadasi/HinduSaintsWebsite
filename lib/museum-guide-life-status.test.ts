import test from "node:test";
import assert from "node:assert/strict";
import {bornOverCenturyAgo,projectGuideLifeStatus,projectCurrentGuideLifeStatus,type GuideLifeEvidence} from "./museum-guide-life-status";
import {starterMoveGuide} from "./spn-starter-move-guide";
import type {StarterMoveGuide} from "./spn-move-guide";
import type {MuseumSaintPlacement} from "./museum-proposals";
const now=new Date("2026-10-28T12:00:00Z");
const person=(values:Partial<GuideLifeEvidence>={}):GuideLifeEvidence=>({id:"source",birthYear:null,samadhiYear:null,samadhiDateRaw:null,...values});
const guide=(tag:string|null="May be alive"):StarterMoveGuide=>({...starterMoveGuide,entries:[{...starterMoveGuide.entries[0],sourceId:"source",saintId:"saint",lifeStatus:{tag,basis:"Captured source flag"}}]});
test("starter adapter retains captured life-status metadata",()=>{assert.equal(starterMoveGuide.entries.find(row=>row.sourceId==="rec4OqIqWOTDRvYLU")?.lifeStatus?.tag,"May be alive");});
test("century rule respects exact date, unknown-year boundary and latest year in ranges",()=>{
 assert.equal(bornOverCenturyAgo(person({birthYear:1925}),now),true);
 assert.equal(bornOverCenturyAgo(person({birthYear:1926}),now),false);
 assert.equal(bornOverCenturyAgo(person({birthYear:1926,birthMonth:10,birthDay:27}),now),true);
 assert.equal(bornOverCenturyAgo(person({birthYear:1926,birthMonth:10,birthDay:28}),now),false);
 assert.equal(bornOverCenturyAgo(person({birthYear:1900,birthYearEnd:1930}),now),false);
 assert.equal(bornOverCenturyAgo(person({birthYear:1900,birthYearEnd:1925}),now),true);
 assert.equal(bornOverCenturyAgo(person(),now),false);
});
test("age rule suppresses uncertainty only, without rewriting data or asserting death",()=>{
 const original=guide();const result=projectGuideLifeStatus(original,[person({birthYear:1900})],now);
 assert.equal(result.entries[0].lifeStatus?.tag,null);assert.match(result.entries[0].lifeStatus!.basis,/does not confirm death/);
 assert.equal(original.entries[0].lifeStatus?.tag,"May be alive");
 assert.equal(projectGuideLifeStatus(guide("Still alive"),[person({birthYear:1900})],now).entries[0].lifeStatus?.tag,"Still alive");
});
test("missing dates invent no living label; explicit raw flags and recorded death are distinct",()=>{
 assert.equal(projectGuideLifeStatus(guide(null),[person()],now).entries[0].lifeStatus?.tag,null);
 assert.equal(projectGuideLifeStatus(guide(null),[person({samadhiDateRaw:"Still alive"})],now).entries[0].lifeStatus?.tag,"Still alive");
 assert.equal(projectGuideLifeStatus(guide(),[person({birthYear:1959})],now).entries[0].lifeStatus?.tag,"May be alive");
 assert.equal(projectGuideLifeStatus(guide(),[person({samadhiYear:2000})],now).entries[0].lifeStatus?.tag,null);
});
test("current member lookup follows placement ID and never binds conflicting identity",()=>{
 const placement={id:"placement",sourceRecordId:"source",saintId:"saint",placementState:"Proposed"} as MuseumSaintPlacement;
 const current={placements:[placement],membersById:new Map([["placement",{BirthDate:"1900–1910",SamadhiDate:"May be alive"}]])};
 assert.equal(projectCurrentGuideLifeStatus(guide(),current,now).entries[0].lifeStatus?.tag,null);
 assert.equal(projectCurrentGuideLifeStatus(guide(),{...current,placements:[{...placement,linkIssue:"Ambiguous"}]},now).entries[0].lifeStatus?.tag,"May be alive");
 current.membersById.set("placement",{BirthDate:"Mentioned in a book from 1900",SamadhiDate:"May be alive"});
 assert.equal(projectCurrentGuideLifeStatus(guide(),current,now).entries[0].lifeStatus?.tag,"May be alive");
});
