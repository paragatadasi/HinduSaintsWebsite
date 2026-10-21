import test from "node:test";
import assert from "node:assert/strict";
import {reconcileMuseumFamilies,MUSEUM_TREE_RELATIONSHIP_KINDS,type MuseumFamilyRelationship as Edge} from "./museum-family-reconciliation";
import {arrangementControl,familyArrangementControl} from "./museum-arrangement-domain";
import {buildVrindavanWorkingView} from "./vrindavan-working-domain";
import {buildMuseumView,type MuseumSaintPlacement as Row} from "./museum-proposals";
import {applyFamilyProposalMoves} from "./museum-family-move-domain";
import {museumTreeOptions} from "./museum-tree-options";
import {normalizeTreeClaims,treeNeighborhood} from "./museum-tree-layout";
const row=(id:string,extra:Partial<Row>={}):Row=>({id,saintId:id,name:id,section:"Gaudiya Vaishnava",tier:"Tertiary",familyId:"old",curatorialFamily:"",alternatives:[],confidence:"Medium",rationale:"Imported rationale",note:"Raw source",familySize:0,spiritualRegions:[],sampradaya:"",normalizedPlaces:[],needsResearch:false,placementState:"Proposed",...extra});
const primary=row("primary",{tier:"Featured",familyId:"chaitanya",groupLabel:"Chaitanya family"});
const edge=(id:string,from:string,to:string,type="disciple",extra:Partial<Edge>={}):Edge=>({id,fromSaintId:from,toSaintId:to,relationshipType:type,status:"published",evidenceStatus:"uncategorized",confidence:"medium",...extra});

test("all supported tree relationships reconcile tiers AND family membership without changing source or location",()=>{
 for(const type of MUSEUM_TREE_RELATIONSHIP_KINDS){
  const input=row("member");const result=reconcileMuseumFamilies([primary,input],[edge(type,"primary","member",type)]);
  assert.equal(result[1].tier,"Secondary",type);assert.equal(result[1].familyId,"chaitanya",type);
  assert.equal(result[1].section,input.section);assert.equal(result[1].note,input.note);
  assert.equal(result[1].familyReconciliation?.previousTier,"Tertiary");
  assert.equal(input.tier,"Tertiary");assert.equal(input.familyId,"old");
 }
});

test("reciprocal guru evidence and a successor's spouse join the same tree, without promoting descendants to Primary",()=>{
 const edges=[edge("guru","student","primary","guru"),edge("successor","student","successor","successor"),edge("wife","successor","wife","wife")];
 const result=reconcileMuseumFamilies([primary,row("student"),row("successor"),row("wife")],edges);
 assert.ok(result.slice(1).every(r=>r.tier==="Secondary"&&r.familyId==="chaitanya"));
 assert.deepEqual(result[3].familyReconciliation?.relationshipIds,["guru","successor","wife"]);
 assert.equal(result[0],primary);
});

test("curator assignments, explicit detachments and museum overrides win over relationships",()=>{
 for(const protectedRow of [row("member",{proposalReviewed:true}),row("member",{placementState:"Confirmed"}),row("member",{displayMembership:{familyKey:"old",label:"Old",detached:true,revision:"r"}})]){
  assert.equal(reconcileMuseumFamilies([primary,protectedRow],[edge("e","primary","member")])[1],protectedRow);
 }
 const member=row("member");assert.equal(reconcileMuseumFamilies([primary,member],[edge("e","primary","member")],new Set(["member"]))[1],member);
});

test("draft, archived, imported, disputed, low-confidence and generic associations cannot change proposals",()=>{
 const variants=[{status:"needs_review"},{status:"archived"},{evidenceStatus:"imported"},{evidenceStatus:"disputed"},{confidence:"low"},{relationshipType:"associated"},{relationshipType:"contemporary"},{relationshipType:"influence"}];
 for(const variant of variants){const member=row("member");assert.equal(reconcileMuseumFamilies([primary,member],[edge("e","primary","member","disciple",variant)])[1],member);}
});

test("equally near competing Primary families and cross-section links remain held",()=>{
 const other=row("other",{tier:"Featured",familyId:"other-family"});
 const member=row("member");const edges=[edge("e","primary","member"),edge("f","other","member")];
 for(const sorted of [edges,[...edges].reverse()]){const result=reconcileMuseumFamilies([primary,other,member],sorted)[2];assert.equal(result.tier,"Tertiary");assert.equal(result.familyId,"old");assert.equal(result.familyReconciliation?.state,"held");}
 const result=reconcileMuseumFamilies([{...primary,section:"Other section"},member],[edges[0]])[1];assert.equal(result.section,member.section);assert.equal(result.familyReconciliation?.state,"held");
});

test("multiple Primary saints in the same family agree and the nearest family takes precedence",()=>{
 const other=row("other",{tier:"Featured",familyId:"chaitanya"});
 const result=reconcileMuseumFamilies([primary,other,row("member")],[edge("e","primary","member"),edge("f","other","member")]);
 assert.equal(result[2].familyId,"chaitanya");assert.deepEqual(result[2].familyReconciliation?.anchorIds,["other","primary"]);
 const distant=row("distant",{tier:"Featured",familyId:"elsewhere"});
 assert.equal(reconcileMuseumFamilies([primary,distant,row("member")],[edge("e","primary","member"),edge("f","primary","distant")])[2].familyId,"chaitanya");
});

test("ambiguous duplicate identities, conflicting proposals and missing section remain untouched",()=>{
 for(const extra of [{placementState:"Conflicting proposals" as const},{section:"Needs section proposal"},{saintId:undefined}]){
  const member=row("member",extra);assert.equal(reconcileMuseumFamilies([primary,member],[edge("e","primary","member")])[1],member);
 }
 const member=row("member");assert.equal(reconcileMuseumFamilies([primary,member,{...member,id:"duplicate"}],[edge("e","primary","member")])[1],member);
});

test("cycles terminate; no name, locality or unreviewed source claims establish membership",()=>{
 const member=row("member",{name:"primary",normalizedPlaces:["Mayapur"]});assert.equal(reconcileMuseumFamilies([primary,member],[])[1],member);
 const edges=[edge("a","member","context"),edge("b","context","member"),edge("c","context","primary")];
 assert.equal(reconcileMuseumFamilies([primary,member],edges)[1].tier,"Secondary");
});

test("existing Planned AND Implemented coordinates, acknowledgements and storage revisions survive automatic changes",()=>{
 for(const status of ["Planned","Implemented"]){
  const member=row("member");const baseline=arrangementControl(member,undefined,"context");
  const saved={proposalRevision:baseline.proposalRevision,status,version:4,vitrine:"19",shelf:"5.2",confirmedAt:new Date("2026-10-21T10:00:00Z"),inventoryAcknowledged:true};
  member.arrangement=arrangementControl(member,saved,"context");
  const after=reconcileMuseumFamilies([primary,member],[edge("e","primary","member")])[1];
  assert.equal(after.arrangement?.status,status);assert.equal(after.arrangement?.vitrine,"19");assert.equal(after.arrangement?.shelf,"5.2");assert.equal(after.arrangement?.confirmedAt,saved.confirmedAt.toISOString());assert.equal(after.arrangement?.inventoryAcknowledged,true);
  assert.equal(after.arrangement?.proposalRevision,baseline.proposalRevision);assert.notEqual(after.arrangement?.revision,member.arrangement.revision);assert.equal(after.arrangement?.familyKey,"chaitanya");
  // Persisting another plan uses the original storage revision and reads back.
  assert.equal(arrangementControl(member,{...saved,proposalRevision:after.arrangement!.proposalRevision},"context").status,status);
 }
});

test("shared museum grouping and tree selectors expose the reconciled member",()=>{
 const placements=reconcileMuseumFamilies([primary,row("member")],[edge("e","primary","member")]);
 const view=buildMuseumView(placements,new Map(),new Map([["chaitanya","Chaitanya family"]]));
 const section=view.sections[0];assert.equal(section.secondary,1);assert.equal(section.tertiary,0);
 assert.deepEqual(new Set(museumTreeOptions(section).main[0].seeds),new Set(["primary","member"]));
});

test("Vrindavan reconciliation preserves destination across changed or removed relationships; baseline conflicts still invalidate it",()=>{
 const base=[primary,row("member")];const edges=[edge("e","primary","member")];
 const first=buildVrindavanWorkingView(base,[],[],"snapshot");const member=first.placements.find(r=>r.saintId==="member")!;
 const saved={placementId:member.id,proposalRevision:member.arrangement!.proposalRevision,status:"Planned",version:2,vitrine:"18",shelf:"3",confirmedAt:null,inventoryAcknowledged:false};
 const reconciled=buildVrindavanWorkingView(base,[],[saved],"snapshot",edges);
 const after=reconciled.placements.find(r=>r.saintId==="member")!;
 assert.equal(after.tier,"Secondary");assert.equal(after.arrangement?.status,"Planned");assert.equal(after.arrangement?.vitrine,"18");assert.equal(after.arrangement?.shelf,"3");assert.notEqual(after.curatorProposalRevision,member.curatorProposalRevision);
 assert.equal(reconciled.families.find(f=>f.key==="chaitanya")?.count,2);
 assert.notEqual(familyArrangementControl(reconciled.placements).revision,familyArrangementControl(first.placements).revision);
 const removed=buildVrindavanWorkingView(base,[],[saved],"snapshot").placements.find(r=>r.saintId==="member")!;
 assert.equal(removed.tier,"Tertiary");assert.equal(removed.arrangement?.status,"Planned");assert.equal(removed.arrangement?.vitrine,"18");
 for(const changed of [[primary,row("member",{section:"Another"})],[primary,row("member",{familyId:"different"})],[primary,row("member",{note:"New inventory rows"})]])assert.equal(buildVrindavanWorkingView(changed,[],[saved],"snapshot",edges).placements.find(r=>r.saintId==="member")?.arrangement?.status,"Proposed");
});

test("Vrindavan curator tier, family and section stay explicit even when relationship-backed projection differs",()=>{
 const override={saintId:"member",section:"Gaudiya Vaishnava",tier:"Tertiary",groupKey:"curated",groupLabel:"Curated family",version:1};
 const result=buildVrindavanWorkingView([primary,row("member")],[override],[],"snapshot",[edge("e","primary","member")]);
 const member=result.placements.find(r=>r.saintId==="member")!;assert.equal(member.tier,"Tertiary");assert.equal(member.familyId,"curated");assert.equal(member.familyReconciliation,undefined);
});

test("biological family edges remain distinct from guru arrows in the tree",()=>{
 const claims=normalizeTreeClaims([edge("f","parent","child","father"),edge("p","parent","spouse","wife"),edge("s","child","next","successor")]);
 assert.equal(claims[0].kind,"family");assert.equal(claims[1].kind,"partner");assert.equal(claims[2].kind,"successor");
 const graph={nodes:["parent","child"].map(id=>({id,name:id,birthYear:null,samadhiYear:null})),edges:claims};
 assert.deepEqual(treeNeighborhood(graph,"parent").find(g=>g.key==="family")?.people.map(p=>p.id),["child"]);
});


test("SPN family moves and restored memberships are explicit curator decisions, not automatic candidates",()=>{
 const member=row("member");const original=buildMuseumView([primary,member],new Map(),new Map([["old","Old family"]]));
 for(const editable of [applyFamilyProposalMoves(original,[{familyKey:"old",section:member.section,version:1}]),applyFamilyProposalMoves(original,[],[{placementId:"member",familyKey:"old",familyLabel:"Old family",section:member.section,detached:false,version:2}])]){
  const after=reconcileMuseumFamilies(editable.placements,[edge("e","primary","member")]).find(r=>r.id==="member")!;
  assert.equal(after.tier,"Tertiary");assert.equal(after.familyId,"old");assert.equal(after.proposalReviewed,true);
 }
});
