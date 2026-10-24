import test from "node:test";
import assert from "node:assert/strict";
import {museumOverviewHref} from "./museum-overview";

test("legacy record links retain filters within Museum Overview",()=>{
 const href=museumOverviewHref({vitrine:"35",shelf:"A",section:"Rama & Avadh",q:"saint",page:"2",unexpected:"discard"},"records");
 const url=new URL(href,"http://localhost");
 assert.equal(url.pathname,"/museumadmin/overview");
 assert.equal(url.searchParams.get("view"),"records");
 assert.equal(url.searchParams.get("section"),"Rama & Avadh");
 assert.equal(url.searchParams.get("page"),"2");
 assert.equal(url.searchParams.get("vitrine"),"35");
 assert.equal(url.searchParams.get("shelf"),"A");
 assert.equal(url.searchParams.get("q"),"saint");
 assert.equal(url.searchParams.has("unexpected"),false);
});

test("returning to the layout keeps the selected vitrine without record-only filters",()=>{
 assert.equal(museumOverviewHref({vitrine:"35",q:"saint",page:"2",view:"records"}),"/museumadmin/overview?vitrine=35");
 assert.equal(museumOverviewHref({vitrine:["35","36"]}),"/museumadmin/overview");
 assert.equal(museumOverviewHref({q:" "},"records"),"/museumadmin/overview?view=records");
});
