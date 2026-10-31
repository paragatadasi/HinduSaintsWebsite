import test from "node:test";
import assert from "node:assert/strict";
import { companionWorkInput, assertShelfContext, companionShelfApplies } from "./museum-companion-work-domain";
const base={museumId:"museum-spn",clientRequestId:"a9230f9a-f7ba-4c60-864a-c3b462c4f1dd",sourceId:"source",saintId:"saint"};
const shelf={...base,action:"shelf.update" as const,vitrine:"80",shelf:"3.10",expectedVersion:0,expectedCurrentRevision:"a".repeat(64),expectedSourceRevision:"b".repeat(64),expectedLocationVersion:2};
const physical={sourceId:"source",saintId:"saint",currentBasis:"confirmed",current:{kind:"vitrine",code:"80"},currentVersion:2,currentRevision:"a".repeat(64),sourceRevision:"b".repeat(64)};
test("shelf remains text, allows clearing, and is valid only for exact confirmed physical context",()=>{
 const parsed=companionWorkInput.parse(shelf);assert.equal(parsed.action,"shelf.update");if(parsed.action!=="shelf.update")throw new Error("Unexpected action");assert.equal(parsed.shelf,"3.10");
 assert.doesNotThrow(()=>assertShelfContext(physical,parsed));assert.equal(companionWorkInput.safeParse({...shelf,shelf:""}).success,true);
 for(const row of [{...physical,currentBasis:"source"},{...physical,currentVersion:3},{...physical,current:{kind:"vitrine",code:"3"}},{...physical,sourceRevision:"c".repeat(64)}])assert.throws(()=>assertShelfContext(row,parsed));
});
test("shelf annotations cease to apply after a move, undo, rematch or loss of confirmation",()=>{
 const note={sourceId:"source",saintId:"saint",vitrine:"80",physicalVersion:2};assert.equal(companionShelfApplies(note,physical),true);
 for(const row of [{...physical,currentVersion:3},{...physical,currentBasis:"source"},{...physical,saintId:"different"},{...physical,current:{kind:"table",code:"staging-area"}}])assert.equal(companionShelfApplies(note,row),false);
});
test("task text and scope validated; completion requires version and explicit desired status",()=>{
 assert.equal(companionWorkInput.safeParse({...base,action:"task.create",title:"  Print the biography label  "}).success,true);
 for(const title of [" ","x".repeat(501)])assert.equal(companionWorkInput.safeParse({...base,action:"task.create",title}).success,false);
 assert.equal(companionWorkInput.safeParse({...base,museumId:"other",action:"task.create",title:"Label"}).success,false);
 const complete={museumId:"museum-spn",clientRequestId:base.clientRequestId,action:"task.complete",taskId:"task",expectedVersion:1,completed:true};
 assert.equal(companionWorkInput.safeParse(complete).success,true);assert.equal(companionWorkInput.safeParse({...complete,completed:false}).success,true);
 assert.equal(companionWorkInput.safeParse({...complete,expectedVersion:0}).success,false);
 assert.equal(companionWorkInput.safeParse({...complete,saintId:"injected"}).success,false);
});

test("a retained Sikh display cannot acquire a new final shelf annotation",()=>{
 assert.throws(()=>assertShelfContext({...physical,current:{kind:"vitrine",code:"68"}},{...shelf,vitrine:"68",museumId:"museum-spn"}),/Sikh display retained here/);
});
