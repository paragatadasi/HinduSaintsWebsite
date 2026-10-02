import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {researchBundleSchema} from "../lib/visit-place-domain";
const url=process.env.MUSEUM_TEST_DATABASE_URL;
if(!url||!["localhost","127.0.0.1"].includes(new URL(url).hostname)||new URL(url).pathname!=="/museum_integration_test") throw Error("Disposable local test database required");
const bundlePath=process.env.VISIT_RESEARCH_TEST_BUNDLE;if(!bundlePath) throw Error("Private test bundle path required");
const bundle=researchBundleSchema.parse(JSON.parse(readFileSync(bundlePath,"utf8")));process.env.DATABASE_URL=url;
const {db}=await import("../lib/db");
const {stageVisitPlaceResearch}=await import("../lib/visit-place-review");
const {previewVisitAcceptance,acceptVisitPlaces}=await import("../lib/visit-place-acceptance");
try {
 assert.equal(await db.saint.count(),0,"Use a fresh disposable database");
 const actor=await db.user.create({data:{email:"full-visit-pilot@example.invalid",roles:["data_admin"]}});
 const old=await db.place.create({data:{slug:"older-reviewed-place",name:"Older reviewed place"}});
 for(const row of bundle.rows) await db.saint.create({data:{slug:String(row.slug),displayName:String(row.name),canonicalName:String(row.canonical_name),status:"published",places:{create:{placeId:old.id,placeType:"primary"}}}});
 assert.deepEqual(await stageVisitPlaceResearch(actor.id,bundle),{staged:214,unchanged:0,unmatched:0});
 const rows=await db.visitPlaceProposal.findMany();const high=rows.filter(r=>(r.normalizedJson as {location_confidence:string}).location_confidence==="high");assert.equal(high.length,155);
 const started=Date.now();const plans=[];for(const row of high) plans.push(await previewVisitAcceptance(row.id));
 const eligible=plans.filter(p=>!p.blocked&&!p.primaryBlocked);const blocked=plans.filter(p=>p.blocked||p.primaryBlocked);
 assert.ok(blocked.some(p=>/pushpa/i.test(p.data.visit_place_name)));assert.ok(eligible.length>140);
 const result=await acceptVisitPlaces(actor.id,{selections:eligible.map(p=>p.selection),updatePrimary:true,confirm:"on"});assert.equal(result.accepted,eligible.length);
 assert.equal(await db.saintVisitPlace.count(),eligible.length);assert.equal(await db.visitPlaceProposal.count({where:{status:"pending"}}),214-eligible.length);
 for(const plan of eligible) {
  const links=await db.saintPlace.findMany({where:{saintId:plan.row.saintId!},include:{place:true}});
  assert.equal(links.find(l=>l.placeType==="primary")?.place.name,plan.data.locality);assert.ok(links.some(l=>l.placeId===old.id&&l.placeType==="associated"));
 }
 assert.deepEqual(await stageVisitPlaceResearch(actor.id,bundle),{staged:0,unchanged:214,unmatched:0});
 console.log(`PASS actual 214-row bundle: ${high.length} high-confidence previewed, ${eligible.length} accepted, ${blocked.length} blocked for review; canonical primary changes verified, remaining confidence levels untouched, replay preserved acceptance (${Date.now()-started}ms)`);
} finally {await db.$disconnect();}
