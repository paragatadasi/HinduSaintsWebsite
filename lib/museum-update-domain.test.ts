import assert from "node:assert/strict";
import test from "node:test";
import { fingerprint, reviewMuseumSources, sourceKey } from "./museum-update-domain";
const active=new Set(["s1"]);
const row=(id:string,vitrine:unknown=12)=>({id,fields:{Name:"Same name", "Vitrine #":vitrine, Shelf:"C"}});
const link=(id:string)=>({externalId:sourceKey("Saints",id),entityType:"Saint",entityId:"s1"});
test("clear existing links project locations; same names do not link new rows",()=>{
 const result=reviewMuseumSources([row("recA"),row("recB")],[link("recA")],active);
 assert.equal(result.locations.size,1);assert.equal(result.reviews.length,1);assert.equal(result.reviews[0].recordId,"recB");
 assert.equal(result.reviews[0].reason,"Saint identity needs review");
});
test("conflicting linked rows generate review rather than one selected vitrine",()=>{
 const result=reviewMuseumSources([row("recA"),row("recB",13)],[link("recA"),link("recB")],active);
 assert.equal(result.locations.size,0);assert.equal(result.reviews.length,2);
 const changed=reviewMuseumSources([row("recA"),row("recB",14)],[link("recA"),link("recB")],active);
 assert.notEqual(result.reviews[0].sourceHash,changed.reviews[0].sourceHash);
});
test("missing and archived links remain pending; blank source values hide locations",()=>{
 assert.equal(reviewMuseumSources([row("recA")],[link("recA")],new Set()).reviews[0].reason,"Saint identity needs review");
 assert.equal(reviewMuseumSources([row("recA",null)],[link("recA")],active).reviews[0].reason,"Source has no vitrine");
});
test("stable evidence hashes ignore key ordering but detect cleared fields",()=>{
 assert.equal(fingerprint({a:1,b:2}),fingerprint({b:2,a:1}));assert.notEqual(fingerprint({a:1}),fingerprint({a:null}));
});
