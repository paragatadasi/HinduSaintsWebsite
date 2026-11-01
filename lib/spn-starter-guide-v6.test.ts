import test from "node:test";
import assert from "node:assert/strict";
import scope from "../data/museum/spn-starter-reviewed-scope-v6.json";
import rawV5 from "../data/museum/spn-starter-move-guide-v5.json";
import vraj from "../data/museum/spn-vraj-remainder-guide-v1.json";
import {registeredStarterGuide as guide,starterV6Proposal,starterGuideDefinition as definition} from "./spn-starter-guide-v6";
import {registeredStarterGuide as old,readStarterGuideDefinition as oldDefinition} from "./spn-starter-guide-v5";
import {readStarterGuideDefinition} from "./spn-starter-guide-registry";
import {inheritGuideDecisions} from "./museum-guide-decision-inheritance";

test("v6 moves exact twenty-source cohort actions to27, including the separate unlinked observation",()=>{
 const ids=scope.cohortTo27.map(r=>r.sourceId),v=guide.vitrines.find(v=>v.code==="27")!;
 assert.equal(ids.length,20);assert.deepEqual(v.families.flatMap(g=>g.sourceIds).sort(),[...ids].sort());assert.equal(guide.vitrines.find(v=>v.code==="28")!.families.length,0);assert.equal(guide.vitrines.find(v=>v.code==="28")!.cityGroups.length,0);
 for(const id of ids){assert.equal(guide.rows.find(r=>r.sourceId===id)?.vitrine,"27");assert.equal(definition.suggestions.find(s=>s.id===`row:${id}`)?.targetVitrine,"27");assert.equal(starterV6Proposal.rows.find(r=>r.sourceId===id)?.vitrine,"27");}
 for(const group of v.families)assert.equal(definition.suggestions.find(s=>s.id===group.id)?.targetVitrine,"27");
 assert.equal(guide.rows.find(r=>r.sourceId==="recOs3jGNyfMlakIB")?.saintId,null);assert.match(guide.rows.find(r=>r.sourceId==="recOs3jGNyfMlakIB")?.movementBlockedReason??"",/identity-unlinked/);
});
test("retired old27 actions remain covered by current Vraj receiving groups and full assignment history",()=>{
 const retired=scope.retiredFromStarter;assert.equal(retired.length,13);
 for(const row of retired){assert.ok(!guide.rows.some(r=>r.sourceId===row.sourceId));assert.ok(!definition.suggestions.some(s=>s.sourceIds.includes(row.sourceId)));assert.ok(vraj.groups.some(g=>g.vitrine===row.destination&&g.sourceIds.includes(row.sourceId)));assert.ok(vraj.rows.some(r=>r.sourceId===row.sourceId&&r.saintId===row.saintId));assert.ok(starterV6Proposal.rows.some(r=>r.sourceId===row.sourceId&&r.vitrine===row.destination));assert.ok(old.rows.some(r=>r.sourceId===row.sourceId));}
 assert.equal(starterV6Proposal.rows.length,1423);assert.equal(guide.rows.length,123);
});
test("Baman and Vaman stay separate and co-located78;29 remaining source actions are unique",()=>{
 const ids=scope.colocatedTo78.map(r=>r.sourceId);assert.equal(ids.length,2);assert.notEqual(scope.colocatedTo78[0].saintId,scope.colocatedTo78[1].saintId);
 for(const id of ids){assert.equal(guide.rows.find(r=>r.sourceId===id)?.vitrine,"78");assert.equal(definition.suggestions.find(s=>s.id===`row:${id}`)?.targetVitrine,"78");}
 const v29=guide.vitrines.find(v=>v.code==="29")!,members=[...v29.families,...v29.cityGroups].flatMap(g=>g.sourceIds);assert.equal(new Set(members).size,members.length);assert.ok(ids.every(id=>!members.includes(id)));assert.equal(v29.families.find(g=>g.id==="v6-29-v3-keshava")?.sourceIds.length,3);
 const pair=guide.vitrines.find(v=>v.code==="78")!.families.find(g=>g.id==="v6-baman-vaman-display-78")!;assert.deepEqual(pair.sourceIds.sort(),ids.sort());assert.ok("edges" in pair);assert.equal(pair.edges.length,0);
});
test("v5 digest/history, physical facts, source evidence, tiers and76 remain unchanged",()=>{
 assert.equal(old.contentDigest,rawV5.contentDigest);assert.deepEqual(old.rows,rawV5.rows);assert.equal(readStarterGuideDefinition(old.version).readOnly,true);assert.deepEqual(guide.physicalConfirmations,old.physicalConfirmations);assert.deepEqual(guide.transitionRowsOutsideStarter,old.transitionRowsOutsideStarter);assert.deepEqual(guide.vitrines.find(v=>v.code==="76"),old.vitrines.find(v=>v.code==="76"));
 for(const row of guide.rows){const prior=old.rows.find(r=>r.sourceId===row.sourceId)!;for(const key of ["saintId","originalLocation","currentLocation","tier","section","sourceVitrine","sourceShelf","relicDescription","lifeStatus","baseline"] as const)assert.deepEqual(row[key],prior[key],`${row.sourceId}:${key}`);}
});
test("equivalent decisions inherit but changed destinations and changed group scopes do not",()=>{
 const previous=oldDefinition(old.version),time=new Date("2026-11-01T00:00:00Z");
 const old28=old.vitrines.find(v=>v.code==="28")!.families[0],same76=old.vitrines.find(v=>v.code==="76")!.families[0];
 const decisions=[old28.id,same76.id,'row:recF52jndG5wSaY9c','row:rec0OP1dCSvyKBTCm'].map(id=>({suggestionId:id,decision:"declined",note:"old scope",alternativeVitrine:null,alternativeShelf:null,version:3,updatedAt:time}));
 const inherited=inheritGuideDecisions(definition,[],[{guide:previous,decisions}]);assert.ok(inherited.some(r=>r.suggestionId===same76.id));assert.ok(!inherited.some(r=>r.suggestionId.startsWith('v6-27-')||r.suggestionId==='row:recF52jndG5wSaY9c'||r.suggestionId==='row:rec0OP1dCSvyKBTCm'));assert.equal(definition.previousVersions?.[0],old.version);assert.equal(previous.context.contentDigest,rawV5.contentDigest);
});
