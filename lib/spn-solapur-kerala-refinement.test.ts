import test from "node:test";
import assert from "node:assert/strict";
import {applySolapurKeralaGuide, solapurKeralaRefinement as packet} from "./spn-solapur-kerala-refinement";
import {beforeWestShelves as allOperationalSpnShelves} from "./spn-operational-shelves";
import type {StarterMoveGuide} from "./spn-move-guide";
const additions = packet.allocations.map(row => ({...row, vitrine: row.destination, shelf: null, version: 1, updatedAt: "2026-11-01T00:00:00Z", clientRequestId: "test"}));
function guide(): StarterMoveGuide { return {version: "test", contentDigest: "frozen", assignmentDigest: "frozen", proposalVersion: "test", title: "Test", entries: packet.allocations.map(row => ({...row, city: "", relicDescription: "", section: "", family: "", rationale: ""})), vitrines: ["47", "56"].map(code => ({code, summary: "", families: [], cityGroups: [{id: "existing", title: "Existing", sourceIds: packet.allocations.filter(row => row.destination === code).map(row => row.sourceId), rationale: "", suggestedVitrines: [code]}]})), alternatives: [], reportedPlacements: []}; }
test("annotations require saved identity, revision and destination matches", () => {
 for (const patch of [{saintId: "changed"}, {sourceRevision: "changed"}, {vitrine: "82"}]) { const input = guide(); assert.equal(applySolapurKeralaGuide(input, additions.map(a => ({...a, ...patch}))), input); }
 const input = guide(); assert.equal(applySolapurKeralaGuide(input, []), input);
});

test("reviewed additions have starting shelves, not confirmed physical shelves",()=>{
 for(const row of packet.allocations){
  const matches=allOperationalSpnShelves.vitrines.flatMap(v=>v.allocations.filter(a=>a.sourceId===row.sourceId).map(a=>({code:v.code,a})));
  assert.equal(matches.length,1);assert.equal(matches[0].code,row.destination);
  assert.equal(matches[0].a.suggestedShelfIndex,row.suggestedShelfIndex);
  assert.equal(matches[0].a.sourceRevision,row.sourceRevision);
 }
 const fit=allOperationalSpnShelves.vitrines.find(v=>v.code==="47")!;
 assert.equal(fit.allocations.length,18);
 assert.ok(fit.allocations.find(a=>a.sourceId==="recdIJbhgX9MwqP9W")?.reviewAlerts.some(a=>a.message.includes("unknown")));
 assert.equal(allOperationalSpnShelves.vitrines.find(v=>v.code==="56")?.allocations.length,17);
});
test("separate locality stories preserve physical history and never assert lineage", () => {
 const input = guide(), before = JSON.stringify(input), result = applySolapurKeralaGuide(input, additions);
 assert.equal(JSON.stringify(input), before);
 assert.equal(result.vitrines[0].cityGroups[0].sourceIds.length, 2);
 assert.deepEqual(result.vitrines[0].cityGroups[0].edges, []);
 assert.deepEqual(result.reportedPlacements, input.reportedPlacements);
 assert.equal(result.assignmentDigest, input.assignmentDigest);
 assert.deepEqual(applySolapurKeralaGuide(result, additions), result);
 assert.ok(result.entries.find(e => e.sourceId === "recdIJbhgX9MwqP9W")?.reviewNotes?.some(note => note.includes("unresolved")));
});
