import {test} from "node:test";
import assert from "node:assert/strict";
import {museumSectionNavigation,museumNavIsActive} from "./museum-navigation";
const sections=[{name:"Gaudiya Vaishnava",slug:"gaudiya-vaishnava",total:46},{name:"Braj & Krishna Bhakti",slug:"braj-krishna-bhakti",total:0},{name:"Needs section proposal",slug:"needs-section-proposal",total:7}];
test("shared sections preserve museum counts and zero-member destinations with museum-specific URLs",()=>{const vrindavan=museumSectionNavigation(sections,"vrindavan"),spn=museumSectionNavigation(sections,"spn");assert.equal(vrindavan.length,2);assert.equal(vrindavan[0].badge,"02");assert.deepEqual(vrindavan[0].links.map(l=>l.count),[0,46]);assert.equal(vrindavan[1].links[0].count,7);assert.equal(vrindavan[0].links[1].href,"/vrindavanadmin/sections?section=gaudiya-vaishnava");assert.equal(spn[0].links[1].href,"/museumadmin/gaudiya-vaishnava");});
test("current section uses its query parameter without also selecting overview",()=>{assert.ok(museumNavIsActive("/vrindavanadmin/sections?section=gaudiya-vaishnava","/vrindavanadmin/sections","gaudiya-vaishnava"));assert.ok(!museumNavIsActive("/vrindavanadmin/sections","/vrindavanadmin/sections","gaudiya-vaishnava"));assert.ok(!museumNavIsActive("/vrindavanadmin","/vrindavanadmin/sections",null));assert.ok(museumNavIsActive("/museumadmin/collections","/museumadmin/collections/item",null));assert.ok(!museumNavIsActive("/museumadmin","/museumadmin/gaudiya-vaishnava",null));});

import {LINEAGE_REGIONS,LINEAGE_SUPPLEMENT} from "./vrindavan-lineage-catalogue";
test("Vrindavan gets six empty regional destinations, optional supplement and surviving legacy links",()=>{
 const roots=LINEAGE_REGIONS.map(r=>({...r,total:0}));const catalogue=[...roots,{...LINEAGE_SUPPLEMENT,total:2},...sections];
 const nav=museumSectionNavigation(catalogue,"vrindavan");assert.deepEqual(nav.slice(0,6).map(g=>g.title),LINEAGE_REGIONS.map(r=>r.name));assert.equal(nav[6].badge,"S");assert.ok(nav[7].links.some(l=>l.label==="Gaudiya Vaishnava"));assert.equal(nav[0].links[0].count,0);assert.equal(museumSectionNavigation(sections,"spn")[0].badge,"02");
});
