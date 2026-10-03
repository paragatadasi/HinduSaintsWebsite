import assert from "node:assert/strict";
import test from "node:test";
import { buildLocationBrowserRows, filterLocationBrowserRows, type LocationInventoryItem } from "./museum-location-browser";
import type { MuseumSaintPlacement } from "./museum-proposals";
const proposal = (id:string,section:string,vitrine="12"):MuseumSaintPlacement => ({id,saintId:id,name:id,section,alternatives:[],tier:"Tertiary",confidence:"Medium",rationale:"",note:"",familyId:"",curatorialFamily:"",familySize:0,spiritualRegions:[],sampradaya:"",normalizedPlaces:[],needsResearch:false,sourceVitrine:{museum:"SPN",vitrine,shelf:"A"}});
const item:LocationInventoryItem = {id:"relic",label:"Shared relic",inventoryCode:"SPN-1",saints:[{id:"one",name:"One"},{id:"two",name:"Two"}],location:{code:"12/A",label:"Vitrine 12 / Shelf A",museumId:"museum-spn"},plannedLocation:{label:"Vitrine 15",museumId:"museum-spn"}};

test("shared relic counted once; all working destinations and independent plan retained",()=>{
 const rows=buildLocationBrowserRows([item],[proposal("one","North"),proposal("two","South")]);
 assert.equal(rows.length,1);assert.deepEqual(rows[0].sections,["North","South"]);assert.equal(rows[0].plannedLocation,"Vitrine 15");assert.equal(rows[0].vitrine,"12");assert.equal(rows[0].shelf,"A");assert.equal(rows[0].sourceOnly,false);
});
test("source hints deduplicate saints without inventing relic inventory",()=>{
 const rows=buildLocationBrowserRows([],[proposal("one","North"),proposal("one","South")]);
 assert.equal(rows.length,1);assert.equal(rows[0].itemId,undefined);assert.equal(rows[0].sourceOnly,true);assert.deepEqual(rows[0].sections,["North","South"]);
});
test("unknown and external locations never become SPN vitrines",()=>{
 const rows=buildLocationBrowserRows([{...item,location:null},{...item,id:"external",location:{code:"12/A",label:"Other museum: Shelf A",museumId:"other"}}],[]);
 assert.equal(rows.every(r=>r.vitrine===""),true);assert.equal(filterLocationBrowserRows(rows,{vitrine:"12"}).length,0);assert.equal(filterLocationBrowserRows(rows,{vitrine:"unknown"}).length,2);
});
test("filters intersect location, section and saint or inventory search",()=>{
 const rows=buildLocationBrowserRows([item],[proposal("one","North")]);
 assert.equal(filterLocationBrowserRows(rows,{vitrine:"12",shelf:"A",section:"North",q:"SPN-1"}).length,1);
 assert.equal(filterLocationBrowserRows(rows,{q:"two"}).length,1);assert.equal(filterLocationBrowserRows(rows,{shelf:"B"}).length,0);
});
