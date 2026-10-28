import { registeredStarterGuide as v4Guide } from "./spn-starter-guide-v4";
import test from "node:test";
import assert from "node:assert/strict";
import { registeredStarterGuide as guide, readStarterGuideDefinition, starterGuideContext } from "./spn-starter-guide-registry";
import oldGuide from "../data/museum/spn-starter-move-guide-v2.json";
import { starterAmendedProposal as proposal } from "./spn-starter-amended-proposal";

test("v16 guide has an exact source partition and matches all reviewed destinations", () => {
 assert.equal(guide.proposalVersion, proposal.version);
 assert.deepEqual(guide.vitrines.map(row => row.code), ["2", "78", "36", "29", "76", "28", "27"]);
 const ids = guide.vitrines.flatMap(v => [...v.families, ...v.cityGroups].flatMap(g => g.sourceIds));
 assert.equal(ids.length, 136); assert.equal(new Set(ids).size, 136);
 for (const row of guide.rows) assert.equal(proposal.rows.find(p => p.sourceId === row.sourceId)?.vitrine, row.vitrine);
});

test("historical guide definitions and reported physical facts survive version changes", () => {
 const historical = readStarterGuideDefinition(oldGuide.version);
 assert.equal(historical.context.contentDigest, oldGuide.contentDigest);
 assert.deepEqual(guide.physicalConfirmations.moves, oldGuide.physicalConfirmations.moves);
 const extra = guide.rows.find(row => row.sourceId === "recOs3jGNyfMlakIB")!;
 assert.equal(extra.saintId, null); assert.equal(extra.vitrine, "28");
 assert.throws(() => readStarterGuideDefinition("unknown"), /not registered/);
});

test("unreviewed locality alternatives cannot register actions; transitions can", () => {
 const definition = readStarterGuideDefinition(starterGuideContext.guideVersion);
 assert.ok(guide.cityAlternatives.length > 0);
 assert.ok(guide.cityAlternatives.every(row => row.allowedTargetVitrines.length === 0));
 assert.ok(definition.suggestions.every(row => row.kind !== "alternative"));
 assert.equal(guide.transitionRowsOutsideStarter.length, 4);
 for (const row of guide.transitionRowsOutsideStarter) {
  assert.equal(definition.suggestions.find(s => s.id === `row:${row.sourceId}`)?.targetVitrine, row.destination.vitrine);
  assert.equal(row.currentLocation.vitrine, "28");
 }
});

import v3 from '../data/museum/spn-starter-move-guide-v3.json';
import { inheritGuideDecisions } from './museum-guide-decision-inheritance';

test('single-source amendment preserves all prior rows, physical facts and unrelated groups', () => {
 const guide=v4Guide;
 const added = guide.rows.filter(row => !v3.rows.some(old => old.sourceId === row.sourceId));
 assert.deepEqual(added.map(row => [row.sourceId,row.saintId,row.vitrine,row.tier,row.section]), [['recc9hYwqqmB3Di2r','cms0w7e5t02ix07qifphk74po','36','Primary','Gaudiya Vaishnava']]);
 for (const row of v3.rows) assert.deepEqual(guide.rows.find(next => next.sourceId === row.sourceId), row);
 assert.deepEqual(guide.physicalConfirmations, v3.physicalConfirmations);
 assert.deepEqual(guide.transitionRowsOutsideStarter, v3.transitionRowsOutsideStarter);
 for (const vitrine of v3.vitrines) {
  const next = guide.vitrines.find(row => row.code === vitrine.code)!;
  assert.deepEqual(next.cityGroups, vitrine.cityGroups);
  assert.deepEqual(next.families.filter(row => !row.sourceIds.includes(added[0].sourceId)), vitrine.families);
 }
 assert.equal(added[0].completed,false);
 assert.deepEqual(added[0].originalLocation,{vitrine:'53',shelf:'A'});
 assert.equal(guide.cityAlternatives.some(group => group.sourceIds.includes(added[0].sourceId)),false);
});

test('v3 remains readable with its original digest and inherits exact-scope decisions into v4', () => {
 const guide=v4Guide;
 const previous = readStarterGuideDefinition(v3.version);
 const current = readStarterGuideDefinition(guide.version);
 assert.equal(previous.readOnly,true);
 assert.equal(previous.context.contentDigest,v3.contentDigest);
 assert.notEqual(current.context.contentDigest,previous.context.contentDigest);
 assert.notEqual(current.context.assignmentDigest,previous.context.assignmentDigest);
 assert.deepEqual(current.previousVersions?.[0],v3.version);
 const suggestion = previous.suggestions.find(row => row.kind === 'family')!;
 const historical = {suggestionId:suggestion.id,decision:'declined',note:'Keep for later',alternativeVitrine:'36',alternativeShelf:'B',version:2,updatedAt:new Date('2026-10-28')};
 const inherited = inheritGuideDecisions(current,[],[{guide:previous,decisions:[historical]}]);
 assert.equal(inherited.find(row=>row.suggestionId===suggestion.id)?.alternativeShelf,'B');
 assert.equal(inherited.find(row=>row.suggestionId===suggestion.id)?.version,0);
 assert.equal(inherited.some(row=>row.suggestionId==='row:recc9hYwqqmB3Di2r'),false);
 assert.equal(current.suggestions.find(row=>row.id==='row:recc9hYwqqmB3Di2r')?.targetVitrine,'36');
 assert.equal(previous.suggestions.some(row=>row.id==='row:recc9hYwqqmB3Di2r'),false);
});
