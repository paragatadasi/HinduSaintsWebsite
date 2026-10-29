import test from "node:test";
import assert from "node:assert/strict";
import {assertAlternativeGuideContext} from "./museum-guide-alternative-domain";
import type {GuideDefinition} from "./spn-starter-guide-registry";
const old:GuideDefinition={context:{guideVersion:"old",contentDigest:"d",assignmentDigest:"a"},suggestions:[{id:"row:a",kind:"row",targetVitrine:"2",sourceIds:["a"]}]};
test("alternative confirmations require their owning active guide",()=>{
 assert.equal(assertAlternativeGuideContext(old,old,"row:a").id,"row:a");
 assert.throws(()=>assertAlternativeGuideContext({...old,context:{...old.context,guideVersion:"unrelated"}},old,"row:a"),/current phase/);
 assert.throws(()=>assertAlternativeGuideContext({...old,readOnly:true},old,"row:a"),/current phase/);
});
test("historical alternatives inherit only through registered equivalent scopes",()=>{
 const current={...old,context:{...old.context,guideVersion:"new"},previousVersions:["old"]};
 assert.equal(assertAlternativeGuideContext(current,old,"row:a").id,"row:a");
 assert.throws(()=>assertAlternativeGuideContext({...current,suggestions:[{...old.suggestions[0],targetVitrine:"78"}]},old,"row:a"),/current phase/);
 assert.throws(()=>assertAlternativeGuideContext({...current,suggestions:[]},old,"row:a"),/current phase/);
});
