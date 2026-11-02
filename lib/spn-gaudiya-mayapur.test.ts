import test from "node:test";
import assert from "node:assert/strict";
import {gaudiyaMayapurRebalance as packet, applyGaudiyaMayapurPresentation, applyGaudiyaMayapurShelves} from "./spn-gaudiya-mayapur-presentation";
import {registeredStarterGuide as previous} from "./spn-starter-guide-v6";
import {registeredStarterGuide as current, starterGuideDefinition} from "./spn-starter-guide-v7";
import {readStarterGuideDefinition} from "./spn-starter-guide-registry";
import {starterMoveGuide} from "./spn-starter-move-guide";
import type {ShelfPlanningPacket} from "./museum-shelf-planning-context";

test("Mayapur changes only thirteen registered destinations and retains physical history", () => {
 const moved = current.rows.filter(row => previous.rows.find(old => old.sourceId === row.sourceId)?.vitrine !== row.vitrine);
 assert.deepEqual(moved.map(r => r.sourceId).sort(), packet.changes.map(r => r.sourceId).sort());
 assert.ok(moved.every(r => r.vitrine === "28" && r.destination.shelf === null));
 assert.deepEqual(current.physicalConfirmations, previous.physicalConfirmations);
 assert.equal(readStarterGuideDefinition(previous.version).readOnly, true);
 for (const r of moved) assert.equal(starterGuideDefinition.suggestions.find(s => s.id === `row:${r.sourceId}`)?.targetVitrine, "28");
 assert.equal(new Set(current.rows.map(r => r.sourceId)).size, previous.rows.length);
});

test("presentation follows effective destinations and does not invent institution edges", () => {
 const source = packet.changes[0];
 const input = {...starterMoveGuide, entries: starterMoveGuide.entries.map(e => e.sourceId === source.sourceId ? {...e, destination: "50"} : e)};
 const output = applyGaudiyaMayapurPresentation(input);
 const v28 = output.vitrines.find(v => v.code === "28")!;
 assert.equal(v28.families.length, 0);
 assert.ok(!v28.cityGroups.some(g => g.sourceIds.includes(source.sourceId)));
 assert.ok(v28.cityGroups.every(g => !g.edges?.length));
 assert.equal(output.entries.find(e => e.sourceId === source.sourceId)?.destination, "50");
 assert.deepEqual(output.reportedPlacements, input.reportedPlacements);
});

test("transferred shelf recommendations reset shelves and preserve unrelated allocations", () => {
 const source = packet.changes[0];
 const input: ShelfPlanningPacket = {version: "test", vitrines: [{code: "29", groups: [{id:"old", title:"Old", kind:"city"}], relationships: [],
  allocations: [{sourceId:source.sourceId,saintId:source.saintId,name:source.name,groupId:"old",suggestedShelfIndex:1,reviewAlerts:[]},
   {sourceId:"unrelated",name:"Other",groupId:"old",suggestedShelfIndex:2,reviewAlerts:[]}]}]};
 const output = applyGaudiyaMayapurShelves(input);
 assert.equal(output.vitrines.find(v => v.code === "29")!.allocations.length, 1);
 const target = output.vitrines.find(v => v.code === "28")!;
 assert.equal(target.allocations.length, 13);
 assert.ok(target.allocations.every(a => a.suggestedShelfIndex === null));
 assert.equal(input.vitrines[0].allocations.length, 2);
});
