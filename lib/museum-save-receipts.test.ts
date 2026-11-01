import test from "node:test";
import assert from "node:assert/strict";
import {mergeSavedRows,mergeSourceWork} from "./museum-save-receipts";

test("independent concurrent placement responses preserve both changes in either completion order",async()=>{
 for(const order of [["a","b"],["b","a"]]){
  let rows=[{sourceId:"a",currentVersion:0,code:"1"},{sourceId:"b",currentVersion:0,code:"2"}];
  const finish=new Map<string,()=>void>();
  const requests=["a","b"].map(sourceId=>new Promise<void>(resolve=>finish.set(sourceId,()=>{rows=mergeSavedRows(rows,[{sourceId,currentVersion:1,code:"19"}]);resolve();})));
  for(const id of order)finish.get(id)!();await Promise.all(requests);
  assert.deepEqual(rows.map(row=>[row.sourceId,row.currentVersion,row.code]),[["a",1,"19"],["b",1,"19"]]);
 }
});
test("late or replayed receipt cannot undo a newer physical confirmation",()=>{
 const rows=[{sourceId:"a",currentVersion:3,code:"36"},{sourceId:"b",currentVersion:0,code:"2"}];
 assert.deepEqual(mergeSavedRows(rows,[{sourceId:"a",currentVersion:2,code:"19"}]),rows);
 assert.deepEqual(mergeSavedRows(rows,[rows[0]]),rows);
});
test("independent shelf and task receipts merge without replacing other users' work",()=>{
 const initial={shelves:[{sourceId:"a",shelf:"A"}],tasks:[{sourceId:"b",title:"Existing"}]};
 const a={sourceIds:["a"],shelves:[{sourceId:"a",shelf:"B"}],tasks:[{sourceId:"a",title:"New task"}]};
 const b={sourceIds:["b"],shelves:[],tasks:[{sourceId:"b",title:"Updated"}]};
 for(const receipts of [[a,b],[b,a]]){
  const result=receipts.reduce(mergeSourceWork,initial);
  assert.deepEqual(result.shelves,[{sourceId:"a",shelf:"B"}]);
  assert.deepEqual(result.tasks.sort((a,b)=>a.sourceId.localeCompare(b.sourceId)),[{sourceId:"a",title:"New task"},{sourceId:"b",title:"Updated"}]);
 }
});
