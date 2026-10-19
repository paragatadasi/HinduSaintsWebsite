import {test} from "node:test";
import assert from "node:assert/strict";
import {mainLocalities,usableKeyLocalities,normalizedCountry,keyLocalityBundleSchema} from "./key-locality-domain";
import research from "../data/research/saints-key-localities-2026-10-19-v4.json";
test("research preserves 172 supported records, 42 unresolved and citation references",()=>{
 const parsed=keyLocalityBundleSchema.parse(research);
 assert.equal(parsed.records.length,214);assert.equal(parsed.records.filter(r=>r.status==="supported_shortlist").length,172);
 assert.equal(parsed.records.filter(r=>r.status==="unresolved_no_recommendation").length,42);
 assert.equal(parsed.records.flatMap(r=>r.recommended_localities).length,363);
 const madhu=parsed.records.find(r=>r.external_id.endsWith(":sri-madhu-pandit-goswami"))!;
 assert.deepEqual(usableKeyLocalities(madhu).map(l=>l.locality),["Vrindavan"]);
});
test("key locality presentation keeps research order separate from route order",()=>{
 const rows=[{name:"Old collection place",keyLocalityOrder:null,routeOrder:0},{name:"Second",keyLocalityOrder:2,routeOrder:1},{name:"First",keyLocalityOrder:1,routeOrder:4}];
 assert.deepEqual(mainLocalities(rows).map(l=>l.name),["First","Second"]);assert.equal(rows.length,3);
 assert.deepEqual(mainLocalities([rows[0]]),[rows[0]]);
});
test("country normalization reuses equivalent full names and codes",()=>{assert.equal(normalizedCountry("India"),"IN");assert.equal(normalizedCountry("in"),"IN");assert.equal(normalizedCountry("United States"),"US");assert.equal(normalizedCountry(null),"");});
