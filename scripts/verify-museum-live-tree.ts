import assert from "node:assert/strict";
const url=process.env.MUSEUM_MEMBERSHIP_TEST_DATABASE_URL;
if(!url)throw Error("Set the disposable local museum_membership_test database URL");
const target=new URL(url);
if(!["localhost","127.0.0.1"].includes(target.hostname)||target.pathname!=="/museum_membership_test")throw Error("Refusing to test outside the disposable local database");
process.env.DATABASE_URL=url;
const {db}=await import("../lib/db");const {readMuseumLiveTree}=await import("../lib/museum-live-tree");
const ids:string[]=[];const suffix=Date.now();
try{
 for(let i=0;i<4;i++){const saint=await db.saint.create({data:{slug:`live-tree-${suffix}-${i}`,canonicalName:`Tree fixture ${i}`,displayName:`Tree fixture ${i}`,status:i===3?"archived":"draft"}});ids.push(saint.id);}
 const first=await db.saintRelationship.create({data:{fromSaintId:ids[1],toSaintId:ids[0],relationshipType:"guru",status:"published",evidenceStatus:"certain"}});
 await db.saintRelationship.create({data:{fromSaintId:ids[2],toSaintId:ids[1],relationshipType:"guru",status:"needs_review"}});
 await db.saintRelationship.create({data:{fromSaintId:ids[3],toSaintId:ids[0],relationshipType:"guru",status:"published"}});
 const before=await db.saintRelationship.count({where:{fromSaintId:{in:ids}}});
 const reviewed=await readMuseumLiveTree([ids[1]],"spn",false);assert.equal(reviewed.layout.nodes.length,2);assert.equal(reviewed.layout.edges[0].from,ids[0]);assert.ok(reviewed.layout.nodes.every(n=>n.presence==="none"));
 const pending=await readMuseumLiveTree([ids[1]],"spn",true);assert.equal(pending.layout.nodes.length,3);assert.ok(pending.layout.edges.some(e=>e.claims.some(c=>c.status==="needs_review")));assert.ok(!pending.layout.nodes.some(n=>n.id===ids[3]));
 await db.saintRelationship.update({where:{id:first.id},data:{status:"archived"}});
 const refreshed=await readMuseumLiveTree([ids[1]],"spn",false);assert.equal(refreshed.layout.nodes.length,1);assert.equal(refreshed.layout.edges.length,0);
 assert.equal(await db.saintRelationship.count({where:{fromSaintId:{in:ids}}}),before);
 console.log("PASS live canonical edges, direction, review toggle, archived exclusion, refreshed corrections, absent museum evidence and read-only behavior");
}finally{await db.saint.deleteMany({where:{id:{in:ids}}});await db.$disconnect();}
