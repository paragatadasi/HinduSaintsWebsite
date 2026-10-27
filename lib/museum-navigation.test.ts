import {test} from "node:test";
import assert from "node:assert/strict";
import {museumSectionNavigation,museumNavIsActive} from "./museum-navigation";
const sections=[{name:"Gaudiya Vaishnava",slug:"gaudiya-vaishnava",total:46},{name:"Braj & Krishna Bhakti",slug:"braj-krishna-bhakti",total:0},{name:"Needs section proposal",slug:"needs-section-proposal",total:7}];
test("Vrindavan keeps subsection URLs/counts under six parents while SPN preserves subsection routes",()=>{
 const nav=museumSectionNavigation(sections,"vrindavan"),spn=museumSectionNavigation(sections,"spn");
 assert.equal(nav.length,7);assert.equal(nav[2].badge,"03");assert.deepEqual(nav[2].links.map(l=>l.label),["Braj & Krishna Bhakti","Gaudiya Vaishnava"]);assert.deepEqual(nav[2].links.map(l=>l.count),[0,46]);assert.equal(nav[2].total,46);assert.equal(nav[6].links[0].count,7);assert.equal(nav[2].links[1].href,"/vrindavanadmin/sections?section=gaudiya-vaishnava");assert.equal(spn[0].links[1].href,"/museumadmin/gaudiya-vaishnava");assert.equal(spn[0].badge,"03");
});
test("current section uses its query parameter without also selecting overview",()=>{assert.ok(museumNavIsActive("/vrindavanadmin/sections?section=gaudiya-vaishnava","/vrindavanadmin/sections","gaudiya-vaishnava"));assert.ok(!museumNavIsActive("/vrindavanadmin/sections","/vrindavanadmin/sections","gaudiya-vaishnava"));assert.ok(!museumNavIsActive("/vrindavanadmin","/vrindavanadmin/sections",null));assert.ok(museumNavIsActive("/museumadmin/collections","/museumadmin/collections/item",null));assert.ok(!museumNavIsActive("/museumadmin","/museumadmin/gaudiya-vaishnava",null));});

import {LINEAGE_REGIONS,LINEAGE_SUPPLEMENT} from "./vrindavan-lineage-catalogue";
test("supplement has actual subsections and review contains only unresolved subsection",()=>{
 const context={name:"Bhakti Marga & Mauritius Lineage",slug:"bhakti-marga",total:2};const nav=museumSectionNavigation([...sections,context],"vrindavan");
 assert.deepEqual(nav.slice(0,6).map(g=>g.title),VRINDAVAN_VISITOR_SEQUENCE.map(r=>LINEAGE_REGIONS.find(s=>s.slug===r.regionSlug)!.name));assert.equal(nav[6].title,LINEAGE_SUPPLEMENT.name);assert.equal(nav[6].links[0].label,context.name);assert.deepEqual(nav[7].links.map(l=>l.label),["Needs section proposal"]);
 assert.ok(nav.slice(0,6).every(g=>!g.links.some(l=>LINEAGE_REGIONS.some(r=>r.name===l.label))));
});

import {VRINDAVAN_VISITOR_SEQUENCE} from "./vrindavan-visitor-flow";
import {VRINDAVAN_SUBSECTION_PARENTS,vrindavanRegionGroups} from "./vrindavan-lineage-catalogue";
test("researched sequence preserves every subsection parent, counts and bridge adjacency",()=>{
 const catalogue=Object.keys(VRINDAVAN_SUBSECTION_PARENTS).map((name,i)=>({name,slug:`stable-${i}`,total:i+1}));
 // Check the researched bridge sequence independently of later catalogue additions.
 const researchedNames=new Set<string>(VRINDAVAN_VISITOR_SEQUENCE.flatMap(region=>[...region.subsections]));
 const groups=vrindavanRegionGroups(catalogue.filter(section=>researchedNames.has(section.name)).reverse());
 assert.deepEqual(groups.slice(0,6).map(g=>g.title),["Sikh Gurus & Udasin","Himalaya & the North","Braj & the Ganga","Bengal, Odisha & the East","The South","Maharashtra & the West"]);
 assert.deepEqual(groups.slice(0,6).map(g=>g.badge),["01","02","03","04","05","06"]);assert.equal(groups[0].bookChapterReference,2);assert.equal(groups[1].bookChapterReference,1);
 assert.equal(groups[2].sections.at(-1),"Gaudiya Vaishnava");assert.equal(groups[3].sections[0],"Jagannath-Puri & Odisha");assert.equal(groups[4].sections.at(-1),"Andhra Avadhuta & Datta-Advaita Lineages");assert.equal(groups[5].sections[0],"Datta Tradition");
 const expandedGroups=vrindavanRegionGroups([...catalogue].reverse());
 const names=expandedGroups.flatMap(g=>g.sections);assert.equal(new Set(names).size,names.length);for(const group of expandedGroups)for(const name of group.sections)assert.equal(VRINDAVAN_SUBSECTION_PARENTS[name],group.title);
 // Newly approved sections remain visible under their parent without rewriting the researched sequence.
 assert.ok(expandedGroups.find(group=>group.title==="The South")!.sections.includes("Kerala & Southern Advaita"));
 for(const [index,sequence] of VRINDAVAN_VISITOR_SEQUENCE.entries()) {
  assert.deepEqual(expandedGroups[index].sections.filter(name=>researchedNames.has(name)), [...sequence.subsections]);
 }
 const nav=museumSectionNavigation(catalogue,"vrindavan");assert.equal(nav.flatMap(g=>g.links).reduce((sum,l)=>sum+(l.count||0),0),catalogue.reduce((sum,s)=>sum+s.total,0));
});
