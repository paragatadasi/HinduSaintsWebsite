import assert from "node:assert/strict";
import test from "node:test";
import {buildSpnTierAudit,type TierAuditIdentity} from "./spn-tier-audit-domain";
import type {MuseumSaintPlacement} from "./museum-proposals";

const row=(id:string,extra:Partial<MuseumSaintPlacement>={}):MuseumSaintPlacement=>({id,name:"Shared name",section:"Braj & Krishna Bhakti",tier:"Tertiary",alternatives:[],confidence:"Medium",rationale:"Source evidence",note:"",familyId:"",curatorialFamily:"",familySize:0,spiritualRegions:[],sampradaya:"",normalizedPlaces:[],needsResearch:false,...extra});
const identity=(id:string,extra:Partial<TierAuditIdentity>={}):TierAuditIdentity=>({id,slug:id,displayName:"Shared name",status:"draft",publicationStatus:"unpublished",biographySummary:"Private summary",aliases:[],biographies:[],...extra});

test("canonical IDs group repeated proposals but namesakes and unlinked observations remain separate",()=>{
 const rows=[row("recA",{saintId:"one",sourceRecordId:"recA"}),row("recB",{saintId:"one",sourceRecordId:"recB",placementState:"Conflicting proposals"}),row("recC",{saintId:"two"}),row("recUnnamed",{sourceRecordId:"recUnnamed",placementState:"Unlinked"})];
 const snapshot=buildSpnTierAudit(rows,rows,[identity("one"),identity("two")],[{externalId:"project:Saints:recA",entityId:"one"},{externalId:"project:Saints:recB",entityId:"one"}]);
 assert.equal(snapshot.counts.placementRows,4);assert.equal(snapshot.counts.canonicalRecords,2);assert.equal(snapshot.counts.unlinkedSourceRows,1);
 assert.equal(snapshot.records.find(r=>r.saintId==="one")!.placements.length,2);
 assert.equal(snapshot.records.find(r=>r.saintId==="one")!.sourceKeys.length,2);
 assert.ok(snapshot.records.find(r=>r.saintId==="one")!.issues.includes("conflicting museum proposals or assignments"));
});

test("public biography evidence follows publication and cannot promote tiers or expose private drafts",()=>{
 const bio={id:"bio",title:"Life",bodyMarkdown:"Actual life and teaching facts",status:"published"};
 const rows=[row("one",{saintId:"one"}),row("two",{saintId:"two"})];
 const snapshot=buildSpnTierAudit(rows,rows,[identity("one",{biographies:[bio]}),identity("two",{status:"published",biographySummary:"Public summary",biographies:[bio,{...bio,id:"private",status:"draft",bodyMarkdown:"PRIVATE"}]})],[]);
 assert.equal(snapshot.records[0].publicBiography.summary,null);assert.deepEqual(snapshot.records[0].publicBiography.biographies,[]);
 assert.equal(snapshot.records[1].publicBiography.biographies.length,1);assert.equal(snapshot.records[1].publicProfile,"/saints/two");
 assert.equal(snapshot.counts.tertiaryRows,2);assert.ok(!JSON.stringify(snapshot).includes("PRIVATE"));
});

test("source-linked canonical records outside the working view are explicit coverage gaps",()=>{
 const snapshot=buildSpnTierAudit([],[],[identity("unplaced")],[{externalId:"project:Saints:recNew",entityId:"unplaced"}]);
 assert.equal(snapshot.counts.canonicalRecords,1);assert.equal(snapshot.counts.placementRows,0);
 assert.equal(snapshot.counts.recordsWithoutWorkingPlacement,1);
 assert.ok(snapshot.records[0].issues.includes("project source link exists but no SPN working placement"));
});

test("public summary uses the same reviewed short description as the public reader",()=>{
 const rows=[row("one",{saintId:"one"}),row("two",{saintId:"two"})];
 const snapshot=buildSpnTierAudit(rows,rows,[identity("one",{status:"published",shortDescription:"Current public life summary",biographySummary:"Older import"}),identity("two",{shortDescription:"PRIVATE short description"})],[]);
 assert.equal(snapshot.records[0].publicBiography.summary,"Current public life summary");
 assert.equal(snapshot.records[0].publicBiography.summarySource,"shortDescription");
 assert.ok(!JSON.stringify(snapshot).includes("PRIVATE"));
});

test("baseline and effective tiers remain distinct while planned location and confirmation are unchanged",()=>{
 const arrangement={status:"Implemented" as const,revision:"r",proposalRevision:"original",familyKey:"family",vitrine:"12",shelf:"C",confirmedAt:"2026-10-01T00:00:00.000Z",inventoryAcknowledged:true};
 const original=row("source",{saintId:"one",arrangement});
 const effective={...original,tier:"Secondary" as const,familyReconciliation:{state:"applied" as const,reason:"Reviewed relationship",anchorIds:["anchor"],relationshipIds:["edge"]}};
 const snapshot=buildSpnTierAudit([original],[effective],[identity("one")],[]);
 assert.equal(snapshot.records[0].placements[0].baselineTier,"Tertiary");assert.equal(snapshot.records[0].placements[0].effectiveTier,"Secondary");
 assert.deepEqual(snapshot.records[0].placements[0].arrangement,arrangement);assert.equal(original.tier,"Tertiary");
 const reordered=buildSpnTierAudit([original],[effective],[identity("one")],[]);
 assert.equal(snapshot.fingerprint,reordered.fingerprint);
});
