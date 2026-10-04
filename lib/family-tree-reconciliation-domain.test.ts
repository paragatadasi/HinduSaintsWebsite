import test from "node:test";
import assert from "node:assert/strict";
import {planFamilyConnections,preservedFamilyClaims,type SourceRow,type Edge} from "./family-tree-reconciliation-domain";
const r=(id:string,fields:SourceRow={})=>({RecordId:"rec"+id,Name:id,FamilyID:"FAM",...Object.fromEntries(Object.entries(fields).map(([key,value])=>[key,value.split(";").map(v=>"rec"+v).join(";")]))});
const link=(record:string,id:string)=>({id:"link"+record,externalId:`appTest:Saints:rec${record}`,entityId:id});
const links=[link("a","A"),link("b","B"),link("c","C")],active=new Set(["A","B","C"]);
const edge=(type="guru",from="B",to="A",status="published"):Edge=>({id:"edge",relationshipType:type,fromSaintId:from,toSaintId:to,status});
test("reciprocal source fields deduplicate and preserve disciple-to-guru direction",()=>{
 const claims=preservedFamilyClaims([r("a",{Disciples:"b"}),r("b",{Masters:"a"})]);
 assert.equal(claims.length,1);assert.equal(claims[0].fromRecordId,"recb");assert.equal(claims[0].toRecordId,"reca");assert.equal(claims[0].evidence.length,2);
 assert.equal(planFamilyConnections([r("b",{Masters:"a"})],links,active,[])[0].state,"missing");
});
test("existing reciprocal decisions and archived rejections are preserved",()=>{
 const rows=[r("b",{Masters:"a"})];
 assert.equal(planFamilyConnections(rows,links,active,[edge("disciple","A","B")])[0].state,"existing");
 assert.equal(planFamilyConnections(rows,links,active,[edge("guru","B","A","archived")])[0].state,"conflict");
 assert.equal(planFamilyConnections(rows,links,active,[edge("guru","A","B")])[0].state,"conflict");
 assert.equal(planFamilyConnections(rows,links,active,[edge("partner")])[0].state,"conflict");
});
test("missing, ambiguous, archived and self identities cannot create edges",()=>{
 const rows=[r("b",{Masters:"a"})];
 assert.equal(planFamilyConnections(rows,links.slice(1),active,[])[0].state,"unresolved");
 assert.equal(planFamilyConnections(rows,[...links,{...link("a","A"),id:"another",externalId:"appOther:Saints:reca"}],active,[])[0].state,"unresolved");
 assert.equal(planFamilyConnections(rows,links,new Set(["B"]),[])[0].state,"unresolved");
 assert.equal(planFamilyConnections(rows,[link("a","A"),link("b","A")],active,[])[0].state,"conflict");
});
test("guru cycles within the proposed batch and against existing graph are blocked",()=>{
 const cyclic=[r("a",{Masters:"b"}),r("b",{Masters:"c"}),r("c",{Masters:"a"})];
 assert.ok(planFamilyConnections(cyclic,links,active,[]).every(p=>p.state==="conflict"));
 assert.equal(planFamilyConnections([r("a",{Masters:"b"})],links,active,[edge("guru","B","C"),{...edge("guru","C","A"),id:"edge2"}])[0].state,"conflict");
});
test("many source rows mapping to one saint create one canonical plan with all evidence",()=>{
 const plans=planFamilyConnections([r("b",{Masters:"a"}),r("c",{Masters:"a"})],[link("a","A"),link("b","B"),link("c","B")],active,[]);
 assert.equal(plans.length,1);assert.equal(plans[0].evidence.length,2);
});
test("family membership alone creates no claims; partner and incarnation reciprocal fields deduplicate",()=>{
 assert.equal(preservedFamilyClaims([r("a"),r("b")]).length,0);
 const rows=[r("a",{Partner:"b",Incarnation:"b"}),r("b",{Partner:"a",Incarnation:"a"})];
 const claims=preservedFamilyClaims(rows);assert.equal(claims.length,2);assert.ok(claims.every(p=>p.evidence.length===2));
});

import {getMuseumProposalData} from "./museum-proposals";
test("preserved Gaudiya Math contains 18 distinct original connections",()=>{
 const rows=[...getMuseumProposalData().membersById.values()].filter(r=>r.FamilyID==="FAM-001");
 assert.equal(rows.length,16);assert.equal(preservedFamilyClaims(rows).length,18);
});
