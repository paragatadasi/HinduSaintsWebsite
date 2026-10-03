import assert from "node:assert/strict";
import test from "node:test";
import { buildMuseumView, type MuseumSaintPlacement } from "./museum-proposals";
import { applyFamilyProposalMoves, familyMoveRevision } from "./museum-family-move-domain";

const row = (id: string, section: string, familyId = "family"): MuseumSaintPlacement => ({
  id, name: id, section, familyId, alternatives: ["Destination"], tier: "Featured", confidence: "High",
  rationale: "Keep rationale", note: "Keep note", curatorialFamily: "", familySize: 2,
  spiritualRegions: [], sampradaya: "", normalizedPlaces: [], needsResearch: false
});

test("a family move covers members in every section, preserves source values and empty section links", () => {
  const rows = [row("a", "Origin"), row("b", "Elsewhere"), row("c", "Elsewhere", "other")];
  const original = buildMuseumView(rows, new Map(), new Map([["family", "Family name"]]), new Map([["family", "tree.svg"]]));
  const view = applyFamilyProposalMoves(original, [{ familyKey: "family", section: "Destination", version: 1 }]);
  assert.deepEqual(view.placements.map(p => p.section), ["Destination", "Destination", "Elsewhere"]);
  assert.deepEqual(rows.map(p => p.section), ["Origin", "Elsewhere", "Elsewhere"]);
  assert.equal(view.sectionBySlug.get("origin")?.total, 0);
  assert.equal(view.sectionBySlug.get("destination")?.total, 2);
  assert.equal(view.sectionBySlug.get("destination")?.families[0].treeFile, "tree.svg");
  assert.equal(view.familyMoveOptions.find(f => f.key === "family")?.count, 2);
  assert.equal(view.placements[0].note, rows[0].note);
  assert.deepEqual(view.placements[0].alternatives, []);
  assert.deepEqual(rows[0].alternatives, ["Destination"]);
});

test("revision detects changed membership, source values and intervening moves, including a move back", () => {
  const rows = [row("a", "Origin"), row("b", "Origin")];
  assert.equal(familyMoveRevision(rows), familyMoveRevision([...rows].reverse()));
  assert.notEqual(familyMoveRevision(rows), familyMoveRevision(rows.slice(1)));
  assert.notEqual(familyMoveRevision(rows), familyMoveRevision([{ ...rows[0], tier: "Secondary" }, rows[1]]));
  assert.notEqual(familyMoveRevision(rows, { familyKey: "family", section: "Origin", version: 1 }),
    familyMoveRevision(rows, { familyKey: "family", section: "Origin", version: 3 }));
});

test("curatorial families take precedence over historical family membership", () => {
  const rows = [{ ...row("a", "Origin"), curatorialFamily: "CUR-example" }, row("b", "Origin")];
  const view = applyFamilyProposalMoves(buildMuseumView(rows), [{ familyKey: "family", section: "Destination", version: 1 }]);
  assert.equal(view.placements[0].section, "Origin");
  assert.equal(view.placements[1].section, "Destination");
});

test("detached display members retain their section and are excluded from later family moves",()=>{
 const original=buildMuseumView([row("a","Origin"),row("b","Origin")],new Map(),new Map([["family","Family"]]),new Map([["family","tree.svg"]]));
 const changes=[{placementId:"a",familyKey:"family",familyLabel:"Family",section:"Frozen",detached:true,version:1}];
 const view=applyFamilyProposalMoves(original,[{familyKey:"family",section:"Destination",version:2}],changes);
 assert.equal(view.placements[0].section,"Frozen");assert.equal(view.placements[0].familyId,"");assert.equal(view.placements[1].section,"Destination");
 assert.equal(view.familyMoveOptions[0].count,1);assert.equal(view.placements[0].displayMembership?.detached,true);
 assert.equal(view.sectionBySlug.get("destination")?.families[0].treeFile,undefined);
 assert.equal(original.placements[0].familyId,"family");
});
test("restoring membership follows latest family proposal and invalidates stale forms",()=>{
 const original=buildMuseumView([row("a","Origin")],new Map(),new Map([["family","Family"]]));
 const move={familyKey:"family",section:"Destination",version:2};
 const detached={placementId:"a",familyKey:"family",familyLabel:"Family",section:"Frozen",detached:true,version:1};
 const restored={...detached,detached:false,version:2};
 const before=applyFamilyProposalMoves(original,[move],[detached]);const after=applyFamilyProposalMoves(original,[move],[restored]);
 assert.equal(after.placements[0].section,"Destination");assert.equal(after.placements[0].familyId,"family");assert.equal(after.familyMoveOptions[0].count,1);
 assert.notEqual(before.placements[0].displayMembership?.revision,after.placements[0].displayMembership?.revision);
 assert.notEqual(familyMoveRevision(original.placements,move,[]),familyMoveRevision(original.placements,move,[restored]));
});
