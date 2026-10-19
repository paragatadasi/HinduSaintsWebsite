import assert from "node:assert/strict";
import test from "node:test";
import {filterSourceInventory} from "./museum-source-inventory-search";
import type {MuseumSourceInventoryEntry} from "./museum-source-inventory-domain";
const entry: MuseumSourceInventoryEntry={observationId:"one",sourceKey:"source",snapshotHash:"hash",sourceName:"Workbook",sourceRow:1,museum:{id:"museum-vrindavan",name:"Vrindavan",slug:"vrindavan"},saintIds:["saint"],unavailableSaintIds:[],sourceSaintName:"Original name",relicDescription:"Mala",quantityText:"2 bags",packagingText:"bag",sourcePlaceText:"Braj",displayText:"3",positionText:"3.4",comments:"",warnings:[],identityConfirmedAt:null,physicalItemId:null,sourceLocation:null};
const saints=[{id:"saint",displayName:"Current saint name",canonicalName:"Alternate name"}];
test("inventory search finds both canonical names and source evidence",()=>{
 for(const q of ["current","alternate","original","mala","braj"]) assert.equal(filterSourceInventory([entry],saints,{q,display:"",position:""}).length,1);
});
test("display and exact position filters preserve textual positions",()=>{
 assert.equal(filterSourceInventory([entry],saints,{q:"",display:"3",position:"3.4"}).length,1);
 assert.equal(filterSourceInventory([entry],saints,{q:"",display:"3",position:"3"}).length,0);
 assert.equal(filterSourceInventory([entry],saints,{q:"",display:"4",position:"3.4"}).length,0);
});
test("unrecorded filter does not fabricate source locations",()=>{
 assert.equal(filterSourceInventory([{...entry,displayText:"",positionText:""}],saints,{q:"",display:"unrecorded",position:"unrecorded"}).length,1);
 assert.equal(filterSourceInventory([entry],saints,{q:"",display:"unrecorded",position:""}).length,0);
});


test("inventory uses site name matching for spacing, aliases, transliteration and typos",()=>{
 const linked=[{id:"saint",displayName:"Sri Jagad Bandhu Sundar",canonicalName:"Jagad Bandhu Sundar",aliases:[{alias:"Ramana Maharshi"}]}];
 for(const q of ["Jagadbandhu","jagad bandhu","Jagadbandhu Sundar","Ramana Maharishi","Ramna"]){
  assert.equal(filterSourceInventory([entry],linked,{q,display:"3",position:"3.4"}).length,1,q);
  assert.equal(filterSourceInventory([entry],linked,{q,display:"4",position:""}).length,0,q);
 }
 assert.deepEqual(filterSourceInventory([entry],[],{q:"Jagadbandhu",display:"",position:""}),[]);
 assert.equal(filterSourceInventory([{...entry,sourceSaintName:"Jagad Bandhu Sundar"}],[],{q:"Jagadbandhu",display:"",position:""}).length,1);
});
test("inventory ranks identity matches above relic text and preserves blank order",()=>{
 const relic={...entry,observationId:"relic",saintIds:[],sourceSaintName:"Other saint",relicDescription:"Jagadbandhu cloth"};
 const linked=[{id:"saint",displayName:"Jagad Bandhu Sundar",canonicalName:"Jagad Bandhu Sundar"}];
 assert.equal(filterSourceInventory([relic,entry],linked,{q:"Jagadbandhu",display:"",position:""})[0].observationId,"one");
 assert.deepEqual(filterSourceInventory([relic,entry],linked,{q:"",display:"",position:""}),[relic,entry]);
});
