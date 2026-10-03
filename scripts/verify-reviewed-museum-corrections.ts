import assert from "node:assert/strict";
import {reviewedSaints,REVIEWED_MUSEUM_BATCH} from "../lib/reviewed-museum-correction-domain";
const url=process.env.MUSEUM_TEST_DATABASE_URL;if(!url||new URL(url).hostname!=="127.0.0.1"||new URL(url).pathname!=="/museum_integration_test")throw Error("Disposable local database required");process.env.DATABASE_URL=url;
const {db}=await import("../lib/db");const {applyReviewedMuseumCorrections,readReviewedMuseumDecisions}=await import("../lib/reviewed-museum-corrections");
try{
 const actor=await db.user.create({data:{email:"reviewed-test@example.invalid",roles:["site_admin"]}});
 for(const s of reviewedSaints)await db.saint.create({data:{id:s.id,slug:s.slug,canonicalName:s.name,displayName:s.name,status:"published"}});
 const jaipur=await db.place.create({data:{name:"Jaipur",slug:"test-jaipur",alternateNames:[],country:"India",placeKind:"city"}});
 const madurai=await db.place.create({data:{name:"Madurai",slug:"test-madurai",alternateNames:[],country:"India",placeKind:"city"}});
 const puri=await db.place.create({data:{name:"Puri",slug:"test-puri",alternateNames:[],country:"India",placeKind:"city"}});
 await db.saintPlace.create({data:{saintId:reviewedSaints[1].id,placeId:jaipur.id,placeType:"primary"}});
 await db.saintPlace.create({data:{saintId:reviewedSaints[2].id,placeId:madurai.id,placeType:"primary"}});
 await db.saintPlace.create({data:{saintId:reviewedSaints[0].id,placeId:puri.id,placeType:"primary"}});
 const before=await db.saintPlace.findMany({where:{saintId:{in:[reviewedSaints[0].id,reviewedSaints[2].id]}},orderBy:{id:"asc"}});
 assert.equal((await applyReviewedMuseumCorrections(actor.id)).applied,true);
 const after=await db.saintPlace.findMany({where:{saintId:reviewedSaints[1].id},include:{place:true}});
 assert.equal(after.find(p=>p.placeType==="primary")?.place.name,"Vrindavan");assert.ok(after.some(p=>p.place.name==="Vamshi Vat"));
 assert.equal(after.find(p=>p.placeId===jaipur.id)?.placeType,"associated");assert.ok(after.find(p=>p.placeId===jaipur.id)?.notes?.includes("deity"));
 assert.deepEqual(await db.saintPlace.findMany({where:{saintId:{in:[reviewedSaints[0].id,reviewedSaints[2].id]}},orderBy:{id:"asc"}}),before);
 assert.equal((await readReviewedMuseumDecisions()).length,3);assert.equal(await db.museumItemPlacement.count(),0);assert.equal(await db.saintMuseumSection.count(),0);
 const edit=after.find(p=>p.place.name==="Vamshi Vat")!;await db.saintPlace.update({where:{id:edit.id},data:{notes:"Later curator note"}});
 assert.equal((await applyReviewedMuseumCorrections(actor.id)).applied,false);assert.equal((await db.saintPlace.findUniqueOrThrow({where:{id:edit.id}})).notes,"Later curator note");
 assert.equal(await db.auditEvent.count({where:{action:"museum.reviewed_geography_applied"}}),1);
 console.log("PASS website locality correction, deity-context retention, source review decisions, no physical/accepted-placement writes, and idempotent replay preserving later edits");
}finally{await db.$disconnect();}