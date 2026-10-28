import test from "node:test";
import assert from "node:assert/strict";
import { guideDecisionInput,assertDeclineAlternative,declineAlternativeValues } from "./museum-guide-decision-domain";
import { inheritGuideDecisions } from "./museum-guide-decision-inheritance";
const input={museumId:"museum-spn",guideVersion:"guide",contentDigest:"a".repeat(64),assignmentDigest:"b".repeat(64),suggestionId:"row:a",expectedVersion:0,clientRequestId:"a9230f9a-f7ba-4c60-864a-c3b462c4f1dd",decision:"declined"};
test("decline accepts optional text shelf, normalizes blank and rejects shelf without vitrine or nondecline preference",()=>{
 const parsed=guideDecisionInput.parse({...input,alternativeVitrine:" 80 ",alternativeShelf:"3.10"});assert.equal(parsed.alternativeVitrine,"80");assert.equal(parsed.alternativeShelf,"3.10");
 assert.equal(guideDecisionInput.parse({...input,alternativeVitrine:" ",alternativeShelf:""}).alternativeVitrine,null);
 assert.equal(guideDecisionInput.safeParse({...input,alternativeShelf:"A"}).success,false);
 for(const decision of ["pending","deferred"])assert.equal(guideDecisionInput.safeParse({...input,decision,alternativeVitrine:"80"}).success,false);
 assert.equal(guideDecisionInput.safeParse({...input,alternativeShelf:"x".repeat(101)}).success,false);
});
test("only available general-display vitrines can be preferred; future, special and unknown targets are rejected",()=>{
 const layout=[{number:"80",availability:"existing",restriction:"general"},{number:"78",availability:"new",restriction:"general"},{number:"99",availability:"future",restriction:"general"},{number:"30",availability:"existing",restriction:"walking_sticks"}];
 assert.doesNotThrow(()=>assertDeclineAlternative({alternativeVitrine:"80"},layout));assert.doesNotThrow(()=>assertDeclineAlternative({alternativeVitrine:"78"},layout));
 for(const alternativeVitrine of ["99","30","staging-area","missing"])assert.throws(()=>assertDeclineAlternative({alternativeVitrine},layout));
});
test("exact inherited decision carries alternative metadata without altering its historical version",()=>{
 const suggestion={id:"old",kind:"row" as const,sourceIds:["a"],targetVitrine:"2"};const context={guideVersion:"old",contentDigest:"digest",assignmentDigest:"assignment"};
 const decision={suggestionId:"old",decision:"declined",note:null,alternativeVitrine:"80",alternativeShelf:"3.10",version:4,updatedAt:new Date()};
 const [inherited]=inheritGuideDecisions({context:{...context,guideVersion:"new"},suggestions:[{...suggestion,id:"new"}]},[],[{guide:{context,suggestions:[suggestion]},decisions:[decision]}]);
 assert.equal(inherited.alternativeVitrine,"80");assert.equal(inherited.alternativeShelf,"3.10");assert.equal(inherited.version,0);assert.equal(decision.version,4);
});

test("older callers cannot silently erase an existing declined preference by omitting new fields",()=>{
 const previous={alternativeVitrine:"80",alternativeShelf:"3.10"};const omitted={decision:"declined",alternativeVitrine:null,alternativeShelf:null};
 assert.deepEqual(declineAlternativeValues(omitted,previous,false),previous);
 assert.deepEqual(declineAlternativeValues(omitted,previous,true),{alternativeVitrine:null,alternativeShelf:null});
 assert.deepEqual(declineAlternativeValues({...omitted,decision:"pending"},previous,false),{alternativeVitrine:null,alternativeShelf:null});
});
