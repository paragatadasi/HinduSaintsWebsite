import assert from "node:assert/strict";
import test from "node:test";
import {getMuseumProposalData} from "./museum-proposals";
import {museumSectionNavigation} from "./museum-navigation";
import {spnRegionGroups} from "./spn-region-navigation";

test("SPN regional navigation preserves every subsection, URL, count and input record",()=>{
 const sections=getMuseumProposalData().sections;
 const before=JSON.stringify(sections);
 const groups=spnRegionGroups(sections);
 assert.deepEqual(groups.slice(0,6).map(g=>g.title),["Himalaya & the North","Sikh Gurus & Udasin","Braj & the Ganga","Bengal, Odisha & the East","Maharashtra & the West","The South"]);
 assert.equal(sections.length,23);
 const nav=museumSectionNavigation(sections,"spn");
 const links=nav.flatMap(g=>g.links);
 assert.equal(links.length,23);
 assert.equal(new Set(links.map(l=>l.href)).size,23);
 for(const section of sections) assert.deepEqual(links.find(l=>l.label===section.name),{label:section.name,href:`/museumadmin/${section.slug}`,count:section.total});
 assert.equal(groups[6].badge,"S");
 assert.equal(groups[7].badge,"R");
 assert.deepEqual(groups[7].sections,["Needs Research"]);
 assert.equal(JSON.stringify(sections),before);
});

test("unknown sections stay visible without acquiring a geographical default",()=>{
 const nav=museumSectionNavigation([{name:"New section",slug:"new-section",total:3},{name:"Gaudiya Vaishnava",slug:"gaudiya",total:0}],"spn");
 assert.equal(nav[0].title,"Braj & the Ganga");
 assert.equal(nav[0].badge,"03");
 assert.equal(nav[0].links[0].count,0);
 assert.equal(nav[1].title,"Needs review");
 assert.equal(nav[1].links[0].href,"/museumadmin/new-section");
});
