import {test} from "node:test";
import assert from "node:assert/strict";
import {buildWebsiteIdentityMatcher,inventoryRows,vrindavanBundleSchema,identityDecisionSchema,type WebsiteIdentity} from "./vrindavan-identity-domain";
const saint=(id:string,name:string,status="draft",aliases:string[]=[]):WebsiteIdentity=>({id,slug:id,displayName:name,canonicalName:name,status,aliases:aliases.map(alias=>({alias}))});
test("canonical website names and reviewed aliases match; SPN names are unnecessary",()=>{
 const match=buildWebsiteIdentityMatcher([saint("a","Neem Karoli Baba","published",["Sri Neem Karoli Baba of Nainital"])]);
 assert.equal(match("Sri Neem Karoli Baba of Nainital").category,"clear");assert.equal(match("Neem Karoli Baba").candidates[0].id,"a");
});
test("an imported detailed-name duplicate blocks an otherwise exact match",()=>{
 const match=buildWebsiteIdentityMatcher([saint("a","Sri Neem Karoli Baba","published"),saint("duplicate","Sri Neem Karoli Baba of Nainital")]);
 assert.equal(match("Sri Neem Karoli Baba").category,"ambiguous");assert.equal(match("Sri Neem Karoli Baba").candidates.length,2);
});
test("archived duplicates are excluded; draft targets remain private identities",()=>{
 const match=buildWebsiteIdentityMatcher([saint("a","Sri Test Saint"),saint("old","Sri Test Saint","archived")]);
 assert.equal(match("Sri Test Saint").category,"clear");assert.equal(match("Sri Test Saint").candidates[0].status,"draft");
});
test("title-only guesses and combined identities are never clear matches",()=>{
 const match=buildWebsiteIdentityMatcher([saint("a","Sri Baba Surdas ji Maharaj of Prayagraj"),saint("b","Guru Ram Das Ji & Guru Arjan Devji")]);
 assert.equal(match("Surdas").category,"possible");assert.equal(match("Guru Ram Das Ji & Guru Arjan Devji").category,"possible");
});
test("aliases deduplicate by saint ID rather than by number of name matches",()=>{
 const match=buildWebsiteIdentityMatcher([saint("a","Sri Test Saint","published",["Sri Test Saint of Puri","Sri Test Saint"])]);
 assert.equal(match("Sri Test Saint").candidates.length,1);
});
test("unidentified inventory never becomes a name guess",()=>{
 const match=buildWebsiteIdentityMatcher([saint("a","Frame Pic no name")]);assert.equal(match(null).category,"unidentified");assert.equal(match("Frame Pic no name").category,"unidentified");
});
test("workbook sections are not inventory; secondary-sheet comments remain evidence",()=>{
 const bundle=vrindavanBundleSchema.parse({version:1,museum:"vrindavan",sourceName:"Inventory.xlsx",sha256:"a".repeat(64),sheets:[{name:"Sheet1",rows:[{row:1,cells:["SAINT NAME","PLACE","RELIC",null,null,"Display/Vitrine"]},{row:2,cells:[16,null,"D18 L1"]},{row:3,cells:["16 (2)",null,"D18 L2"]},{row:4,cells:["Sri Test",null,"Cloth",1,"Box",16,2,null]},{row:5,cells:[null,null,"Several unidentified relics",4,"Box",1,3.2]}]},{name:"DuplicatesMagenta",rows:[{row:4,cells:["Sri Test",null,null,1,"Box",16,2,"Move to D7"]}]}]});
 const rows=inventoryRows(bundle);assert.equal(rows.length,2);assert.equal(rows[0].sourceRow,4);assert.ok(rows[0].warnings.some(w=>w.includes("sheets")));assert.equal(rows[1].name,null);assert.ok(JSON.stringify(rows[0].raw).includes("Move to D7"));
});
test("duplicate workbook rows and incomplete decisions are rejected",()=>{
 assert.equal(vrindavanBundleSchema.safeParse({version:1,museum:"vrindavan",sourceName:"x",sha256:"a".repeat(64),sheets:[{name:"Sheet1",rows:[{row:1,cells:["x"]},{row:1,cells:["y"]}]}]}).success,false);
 const d={id:"id",version:"a".repeat(64),action:"link",saintIds:["s"],note:"",confirm:true};assert.equal(identityDecisionSchema.safeParse(d).success,true);assert.equal(identityDecisionSchema.safeParse({...d,confirm:false}).success,false);assert.equal(identityDecisionSchema.safeParse({...d,action:"defer"}).success,false);
});
