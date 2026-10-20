import {test} from "node:test";
import assert from "node:assert/strict";
import {museumSectionNavigation,museumNavIsActive} from "./museum-navigation";
const sections=[{name:"Gaudiya Vaishnava",slug:"gaudiya-vaishnava",total:46},{name:"Braj & Krishna Bhakti",slug:"braj-krishna-bhakti",total:0},{name:"Needs section proposal",slug:"needs-section-proposal",total:7}];
test("Vrindavan keeps subsection URLs/counts under six parents while SPN remains unchanged",()=>{
 const nav=museumSectionNavigation(sections,"vrindavan"),spn=museumSectionNavigation(sections,"spn");
 assert.equal(nav.length,7);assert.equal(nav[2].badge,"03");assert.deepEqual(nav[2].links.map(l=>l.label),["Gaudiya Vaishnava","Braj & Krishna Bhakti"]);assert.deepEqual(nav[2].links.map(l=>l.count),[46,0]);assert.equal(nav[2].total,46);assert.equal(nav[6].links[0].count,7);assert.equal(nav[2].links[0].href,"/vrindavanadmin/sections?section=gaudiya-vaishnava");assert.equal(spn[0].links[1].href,"/museumadmin/gaudiya-vaishnava");assert.equal(spn[0].badge,"02");
});
test("current section uses its query parameter without also selecting overview",()=>{assert.ok(museumNavIsActive("/vrindavanadmin/sections?section=gaudiya-vaishnava","/vrindavanadmin/sections","gaudiya-vaishnava"));assert.ok(!museumNavIsActive("/vrindavanadmin/sections","/vrindavanadmin/sections","gaudiya-vaishnava"));assert.ok(!museumNavIsActive("/vrindavanadmin","/vrindavanadmin/sections",null));assert.ok(museumNavIsActive("/museumadmin/collections","/museumadmin/collections/item",null));assert.ok(!museumNavIsActive("/museumadmin","/museumadmin/gaudiya-vaishnava",null));});

import {LINEAGE_REGIONS,LINEAGE_SUPPLEMENT} from "./vrindavan-lineage-catalogue";
test("supplement has actual subsections and review contains only unresolved subsection",()=>{
 const context={name:"Bhakti Marga & Mauritius Lineage",slug:"bhakti-marga",total:2};const nav=museumSectionNavigation([...sections,context],"vrindavan");
 assert.deepEqual(nav.slice(0,6).map(g=>g.title),LINEAGE_REGIONS.map(r=>r.name));assert.equal(nav[6].title,LINEAGE_SUPPLEMENT.name);assert.equal(nav[6].links[0].label,context.name);assert.deepEqual(nav[7].links.map(l=>l.label),["Needs section proposal"]);
 assert.ok(nav.slice(0,6).every(g=>!g.links.some(l=>LINEAGE_REGIONS.some(r=>r.name===l.label))));
});
