import test from "node:test";
import assert from "node:assert/strict";
import {combinedReviewedAllocations as packet, applyCombinedReviewedGuide, applyCombinedReviewedShelves, registerCombinedReceivers} from "./spn-combined-reviewed-allocations";
import {beforeCombinedShelves, allOperationalSpnShelves} from "./spn-operational-shelves";
import type {StarterMoveGuide} from "./spn-move-guide";
const guide:StarterMoveGuide={version:"test",title:"North",contentDigest:"unchanged",assignmentDigest:"unchanged",proposalVersion:"test",entries:[],vitrines:[{code:"74",summary:"North",families:[],cityGroups:[]}],alternatives:[],reportedPlacements:[]};
test("combined98 includes unique pinned sources, no physical state or excluded records",()=>{
 assert.equal(packet.sources.length,98);assert.equal(new Set(packet.sources.map(s=>s.sourceId)).size,98);
 assert.ok(packet.sources.every(s=>/^[a-f0-9]{64}$/.test(s.sourceRevision)));
 assert.ok(packet.sources.every(s=>!('current' in s)&&!('original' in s)));
 for(const code of ["14","15","39","41","45","46","59","64","65","66","67"])assert.ok(!packet.sources.some(s=>s.draftVitrine===code));
 assert.equal(packet.sources.filter(s=>s.draftVitrine==="83").length,7);
 assert.match(packet.cases.find(v=>v.code==="83")!.notes.join(" "),/one empty shelf/);
});
test("receiver registration is idempotent and does not authorize clearing",()=>{
 const result=registerCombinedReceivers({north:guide});assert.deepEqual(result.north.vitrines.map(v=>v.code),["74","16","70"]);
 assert.deepEqual(registerCombinedReceivers(result),result);assert.equal(guide.vitrines.length,1);
 assert.equal(result.north.requiredClearVitrines,undefined);assert.equal(result.north.contentDigest,guide.contentDigest);
});
test("all98 shelf contexts occur once and existing recommendations are preserved",()=>{
 const before=JSON.stringify(beforeCombinedShelves);
 const result=applyCombinedReviewedShelves(beforeCombinedShelves);
 assert.equal(JSON.stringify(beforeCombinedShelves),before);
 const rows=result.vitrines.flatMap(v=>v.allocations.map(a=>({code:v.code,a})));
 assert.equal(new Set(rows.map(r=>r.a.sourceId)).size,rows.length);
 for(const s of packet.sources.filter(s=>!packet.preservedCuratorOverrides.some(o=>o.sourceId===s.sourceId))){const matches=rows.filter(r=>r.a.sourceId===s.sourceId);assert.equal(matches.length,1);assert.equal(matches[0].code,s.draftVitrine);if(!beforeCombinedShelves.vitrines.some(v=>v.allocations.some(a=>a.sourceId===s.sourceId)))assert.equal(matches[0].a.suggestedShelfIndex,s.sourceId==="recaTTfjinlSVDk4n"?5:null);}
 for(const v of beforeCombinedShelves.vitrines)for(const a of v.allocations){const source=packet.sources.find(s=>s.sourceId===a.sourceId);if(!source||source.draftVitrine===v.code)assert.deepEqual(rows.find(r=>r.a.sourceId===a.sourceId),{code:v.code,a});}
 assert.deepEqual(result,allOperationalSpnShelves);
});
test("guide notes require exact saved source pins and never replace later destinations",()=>{
 const s=packet.sources[0];const entry={sourceId:s.sourceId,saintId:s.saintId,name:s.name,tier:"Tertiary",city:"",relicDescription:"",destination:s.draftVitrine,section:"",family:"",rationale:""};
 const input={...guide,entries:[entry],vitrines:[{code:s.draftVitrine,summary:"Existing",families:[],cityGroups:[]}]};
 const a={sourceId:s.sourceId,saintId:s.saintId,sourceRevision:s.sourceRevision,vitrine:s.draftVitrine,shelf:null,version:1,updatedAt:"2026-11-02T12:00:00Z",clientRequestId:"test"};
 assert.equal(applyCombinedReviewedGuide(input,[]).entries[0],entry);
 assert.equal(applyCombinedReviewedGuide(input,[{...a,sourceRevision:"changed"}]).entries[0],entry);
 assert.equal(applyCombinedReviewedGuide(input,[{...a,vitrine:"99"}]).entries[0],entry);
 const result=applyCombinedReviewedGuide(input,[a]);assert.ok(result.entries[0].reviewNotes?.includes(s.basis));assert.equal(result.entries[0].destination,s.draftVitrine);assert.deepEqual(result.reportedPlacements,[]);
});

import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {MuseumShelfGuide} from "../components/admin/museum-shelf-guide";
test("fit-review holdings render visibly with the existing placement control",()=>{
 const s=packet.sources[0];
 const plan=allOperationalSpnShelves.vitrines.find(v=>v.code===s.draftVitrine)!;
 const entry={sourceId:s.sourceId,saintId:s.saintId,name:s.name,tier:"Tertiary",city:"",relicDescription:"",destination:s.draftVitrine,section:"",family:"",rationale:""};
 const html=renderToStaticMarkup(createElement(MuseumShelfGuide,{vitrine:s.draftVitrine,plan,entries:new Map([[s.sourceId,entry]]),rows:[],sourceIds:[s.sourceId],renderControl:()=>createElement("input",{type:"checkbox","aria-label":"Confirm placed"}),renderActions:()=>null}));
 assert.match(html,/Shelf position to review/);assert.ok(html.includes(s.name));assert.match(html,/Confirm placed/);
});
