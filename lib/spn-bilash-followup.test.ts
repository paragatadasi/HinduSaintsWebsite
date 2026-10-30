import test from "node:test";
import assert from "node:assert/strict";
import {bilashFollowup as packet,resolveBilashFollowup,applyBilashFollowup,projectBilashGuideFollowup,assertBilashGuideTarget} from "./spn-bilash-followup";
import {buildLatestSpnReview} from "./spn-reviewed-proposal";
import {starterMoveGuide} from "./spn-starter-move-guide";
import type {MuseumSaintPlacement} from "./museum-proposals";
const base=packet.capturedBaseline;
const live=():MuseumSaintPlacement=>({id:base.placementId,sourceRecordId:packet.sourceId,saintId:packet.saintId,name:packet.name,
 section:base.section,tier:base.tier,familyId:base.familyKey,curatorialFamily:base.familyKey,spnRegionTags:base.regionTags,
 arrangement:{revision:base.revision,proposalRevision:base.proposalRevision,status:"Proposed",vitrine:"",shelf:"",familyKey:"",confirmedAt:null,inventoryAcknowledged:false},
 alternatives:[],confidence:"Low",rationale:"",note:"",familySize:1,spiritualRegions:[],sampradaya:"",normalizedPlaces:[],needsResearch:true} as MuseumSaintPlacement);

test("exact unchanged source defaults to provisional29 without changing CMS or historical guide",()=>{
 const current=[live()],before=JSON.stringify(current),guideBefore=JSON.stringify(starterMoveGuide);
 const resolved=resolveBilashFollowup(current);assert.equal(resolved.destination,"29");assert.equal(resolved.status,"provisional");
 assert.match(resolved.qualifier,/identity\/teacher unresolved/);
 const view=buildLatestSpnReview(current);const row=view.rows.find(r=>r.sourceId===packet.sourceId)!;
 assert.equal(row.effectiveVitrine,"29");assert.equal(row.section,base.section);assert.equal(row.tier,base.tier);
 assert.match(row.allocationKind,/No new lineage edge/);
 const projected=projectBilashGuideFollowup(starterMoveGuide,current);
 assert.equal(projected.bilashFollowup.destination,"29");assert.equal(projected.version,starterMoveGuide.version);
 assert.equal(projected.contentDigest,starterMoveGuide.contentDigest);assert.equal(projected.assignmentDigest,starterMoveGuide.assignmentDigest);
 assert.equal(projected.entries.find(r=>r.sourceId===packet.sourceId)!.destination,"57");
 assert.match(projected.entries.find(r=>r.sourceId===packet.sourceId)!.movementBlockedReason!,/superseded/);
 assert.equal(JSON.stringify(current),before);assert.equal(JSON.stringify(starterMoveGuide),guideBefore);
});
test("newer curator destinations and validated alternatives take precedence",()=>{
 const row=live();row.arrangement={...row.arrangement!,status:"Planned",vitrine:"30",revision:"new-review"};
 assert.equal(resolveBilashFollowup([row]).destination,"30");
 assert.equal(buildLatestSpnReview([row]).rows.find(r=>r.sourceId===packet.sourceId)!.effectiveVitrine,"30");
 assert.equal(buildLatestSpnReview([live()],[{sourceId:packet.sourceId,vitrine:"31",shelf:null}]).rows.find(r=>r.sourceId===packet.sourceId)!.effectiveVitrine,"31");
 row.arrangement={...row.arrangement,vitrine:"57"};
 assert.doesNotThrow(()=>assertBilashGuideTarget([{sourceId:packet.sourceId,to:{kind:"vitrine",code:"57"}}],[row]));
});
test("identity ambiguity or changed editorial baseline cannot activate the provisional correction",()=>{
 const original=live();
 for(const current of [[],[original,original],[{...original,saintId:"different"}],[{...original,linkIssue:"conflict"}],
   [{...original,arrangementNeedsReview:true}],[{...original,section:"Changed section"}],[{...original,tier:"Secondary" as const}]]){
   assert.equal(resolveBilashFollowup(current).status,"needs_review");
   assert.equal(resolveBilashFollowup(current).destination,null);
 }
 const old=buildLatestSpnReview([]).rows.find(r=>r.sourceId===packet.sourceId)!;
 assert.equal(applyBilashFollowup([old],[])[0],old);
});
test("only obsolete Bilash57 execution is rejected; clearing and unrelated sources remain separate",()=>{
 assert.throws(()=>assertBilashGuideTarget([{sourceId:packet.sourceId,to:{kind:"vitrine",code:"57"}}],[live()]),/superseded/);
 assert.doesNotThrow(()=>assertBilashGuideTarget([{sourceId:packet.sourceId,to:{kind:"table",code:"staging-area"}}],[live()]));
 assert.doesNotThrow(()=>assertBilashGuideTarget([{sourceId:"unrelated",to:{kind:"vitrine",code:"57"}}],[live()]));
 const unchanged=buildLatestSpnReview([]),updated=buildLatestSpnReview([live()]);
 for(const id of ["recCILjO1fpLxkZ4V","rec3ulkcd4vs7FA6v","recEs8hxZ2fBFWcEI","recBpkMpvzm57a1J8"])
   assert.equal(updated.rows.find(r=>r.sourceId===id)?.effectiveVitrine,unchanged.rows.find(r=>r.sourceId===id)?.effectiveVitrine);
 assert.deepEqual(updated.proposal.pendingPlacements.find(r=>r.sourceId==="recVN6Ty3682Uz2g4"),unchanged.proposal.pendingPlacements.find(r=>r.sourceId==="recVN6Ty3682Uz2g4"));
});
