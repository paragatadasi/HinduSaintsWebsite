import assert from "node:assert/strict";
import test from "node:test";
import { proposeRelic } from "./museum-relic-proposal";
import { sourceKey } from "./museum-update-domain";
const saints=[{id:"recA",fields:{Name:"Saint", "Vitrine #":52,Shelf:"c"}},{id:"recB",fields:{Name:"Saint", "Vitrine #":25,Shelf:"E"}}];
const links=saints.map(s=>({externalId:sourceKey("Saints",s.id),entityType:"Saint",entityId:"s1"}));
const relic=(ids:string[])=>({id:"recR",fields:{"Item Name":"Garment",Saint:ids}});
test("each relic uses its specific source row, not one saint-wide location",()=>{
 assert.equal(proposeRelic(relic(["recA"]),saints,links,new Set(["s1"])).normalized.location?.code,"52/C");
 assert.equal(proposeRelic(relic(["recB"]),saints,links,new Set(["s1"])).normalized.location?.code,"25/E");
 assert.equal(proposeRelic(relic(["recA","recB"]),saints,links,new Set(["s1"])).normalized.location,null);
});
test("unlinked and archived saints block baseline, attachments do not create discrepancies",()=>{
 assert.ok(proposeRelic(relic(["recA"]),saints,links,new Set()).blockers.length);
 const a=proposeRelic(relic(["recA"]),saints,links,new Set(["s1"]));
 const b=proposeRelic({...relic(["recA"]),fields:{...relic(["recA"]).fields,"Relic picture":[{url:"rotating"}]}},saints,links,new Set(["s1"]));
 assert.equal(a.hash,b.hash);
});
