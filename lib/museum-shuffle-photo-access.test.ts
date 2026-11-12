import test from "node:test";
import assert from "node:assert/strict";
import {shuffleAttachmentUrl} from "./museum-shuffle-photo-access";
import {MuseumIntakeError} from "./museum-intake-domain";
const make=(url="https://v5.airtableusercontent.com/photo")=>({id:"recRelic",fields:{Saint:["recSaint"],"Relic picture":[{id:"attPhoto",url}]}});
const read=(row:ReturnType<typeof make>)=>shuffleAttachmentUrl(row,"Relics","recRelic","recSaint","attPhoto");
test("relic photos require exact source membership and attachment ID",()=>{
 assert.equal(read(make()).hostname,"v5.airtableusercontent.com");
 const wrong=make();wrong.fields.Saint=["recOther"];
 assert.throws(()=>read(wrong),MuseumIntakeError);
 assert.throws(()=>shuffleAttachmentUrl(make(),"Relics","recRelic","recSaint","attOther"),MuseumIntakeError);
 assert.throws(()=>shuffleAttachmentUrl(make(),"Relics","recOther","recSaint","attPhoto"),MuseumIntakeError);
});
test("photo URLs reject non-Airtable hosts, credentials, ports and non-HTTPS",()=>{
 for(const url of ["https://evil.test/a","https://airtableusercontent.com.evil.test/a","http://v5.airtableusercontent.com/a","https://name:pass@v5.airtableusercontent.com/a","https://v5.airtableusercontent.com:8080/a","file:///tmp/photo","not a URL"]){assert.throws(()=>read(make(url)),MuseumIntakeError);}
});
test("legacy saint photo requires the same exact inventory source",()=>{
 const row={id:"recSaint",fields:{"Relics Pictures (move to other table)":[{id:"attPhoto",url:"https://v5.airtableusercontent.com/a"}]}};
 assert.ok(shuffleAttachmentUrl(row,"Saints","recSaint","recSaint","attPhoto"));
 assert.throws(()=>shuffleAttachmentUrl(row,"Saints","recSaint","recOther","attPhoto"),MuseumIntakeError);
});
