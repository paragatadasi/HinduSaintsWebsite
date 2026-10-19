import assert from "node:assert/strict";
const url=process.env.MUSEUM_SEARCH_TEST_DATABASE_URL;
if(!url)throw Error("Set a disposable local museum_integration_test database URL");
const target=new URL(url);
if(!["localhost","127.0.0.1"].includes(target.hostname)||target.pathname!=="/museum_integration_test")throw Error("Refusing to test outside the disposable local database");
process.env.DATABASE_URL=url;
const {db}=await import("../lib/db");
const {getSaintSearchCandidateIds}=await import("../lib/postgres-saint-search");
const {rankSaintSearchResults}=await import("../lib/saint-search");
const ids:string[]=[],suffix=Date.now();
try{
 for(const [i,name] of ["Sri Jagad Bandhu Sundar","Unrelated display name","Unpublished Jagad Bandhu Sundar"].entries()){
  const saint=await db.saint.create({data:{slug:`spacing-fixture-${suffix}-${i}`,canonicalName:name,displayName:name,publicationStatus:i===2?"unpublished":"published",teamVisibility:i===2?"private":"public",aliases:i===1?{create:{alias:"Sri Jagad Bandhu Sundar"}}:undefined}});ids.push(saint.id);
 }
 const published=await getSaintSearchCandidateIds("Jagadbandhu","published");
 assert.ok(published.includes(ids[0]),"spaced display/canonical name retrieved");assert.ok(published.includes(ids[1]),"spaced alias retrieved");assert.ok(!published.includes(ids[2]),"unpublished saint excluded");
 const full=await getSaintSearchCandidateIds("Jagadbandhu","full");assert.ok(full.includes(ids[2]));
 const candidates=await db.saint.findMany({where:{id:{in:published.filter(id=>ids.includes(id))}},include:{aliases:true}});
 assert.equal(rankSaintSearchResults(candidates,"Jagadbandhu").length,2);
 console.log("PASS joined-name PostgreSQL retrieval, alias retrieval, published/private scope and shared ranking");
}catch(error){console.error("Search integration failed:",error);throw error;}finally{if(ids.length)await db.saint.deleteMany({where:{id:{in:ids}}});await db.$disconnect();}
