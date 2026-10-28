"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import type {CompanionRow} from "@/lib/spn-move-guide";

type Shelf={sourceId:string;saintId:string|null;vitrine:string;shelf:string|null;physicalVersion:number;version:number};
export type DisplayTask={id:string;sourceId:string;saintId:string|null;title:string;status:"open"|"completed";version:number;createdAt:string;completedAt:string|null};
type Work={shelves:Shelf[];tasks:DisplayTask[]};
const endpoint="/api/admin/museum-companion-work";
export function useMuseumDisplayWork(sourceIds:string[]){
 const pending=useRef(new Map<string,string>());
 const scope=[...new Set(sourceIds)].sort().join(",");
 const currentScope=useRef(scope);currentScope.current=scope;
 const [work,setWork]=useState<Work>({shelves:[],tasks:[]});
 const [busy,setBusy]=useState(false);
 const [loaded,setLoaded]=useState(false),[error,setError]=useState("");
 const reload=useCallback(async()=>{
  const params=new URLSearchParams({museumId:"museum-spn"});scope.split(",").filter(Boolean).forEach(id=>params.append("sourceId",id));
  const response=await fetch(`${endpoint}?${params}`,{cache:"no-store"});const result=await response.json();
  if(!response.ok)throw new Error(result.error||"Could not load shelves and to-dos.");
  if(!Array.isArray(result.shelves)||!Array.isArray(result.tasks))throw new Error("Could not load shelves and to-dos.");
  if(currentScope.current===scope){setWork(result);setLoaded(true);setError("");}
 },[scope]);
 useEffect(()=>{setLoaded(false);setWork({shelves:[],tasks:[]});void reload().catch(e=>setError(e.message));},[reload]);
 async function write(body:Record<string,unknown>){
  setBusy(true);try{
  const key=JSON.stringify(body);const requestId=pending.current.get(key)??crypto.randomUUID();pending.current.set(key,requestId);
  const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({museumId:"museum-spn",clientRequestId:requestId,...body})});
  const result=await response.json();if(!response.ok){if(response.status<500)pending.current.delete(key);if(response.status===409)await reload();throw new Error(result.error||"Could not save. Your details are still here.");}
  if(!Array.isArray(result.sourceIds)||!Array.isArray(result.shelves)||!Array.isArray(result.tasks))throw new Error("The save could not be confirmed. Try again to check its status.");
  pending.current.delete(key);
  if(currentScope.current===scope)setWork(previous=>({shelves:[...previous.shelves.filter(s=>!result.sourceIds.includes(s.sourceId)),...result.shelves],tasks:[...previous.tasks.filter(t=>!result.sourceIds.includes(t.sourceId)),...result.tasks]}));
  }finally{setBusy(false);}
 }
 function annotation(row:CompanionRow){return work.shelves.find(s=>s.sourceId===row.sourceId&&s.saintId===row.saintId&&row.current?.kind==="vitrine"&&s.vitrine===row.current.code&&s.physicalVersion===row.currentVersion);}
 return {tasks:work.tasks,loaded,error,reload,busy,
  shelf:(row:CompanionRow)=>row.currentBasis==="confirmed"?(annotation(row)?annotation(row)!.shelf:row.current?.shelf??null):null,
  saveShelf:(row:CompanionRow,shelf:string)=>write({action:"shelf.update",sourceId:row.sourceId,saintId:row.saintId,vitrine:row.current?.code,shelf,expectedVersion:work.shelves.find(s=>s.sourceId===row.sourceId)?.version??0,expectedCurrentRevision:row.currentRevision,expectedSourceRevision:row.sourceRevision,expectedLocationVersion:row.currentVersion}),
  addTask:(row:CompanionRow,title:string)=>write({action:"task.create",sourceId:row.sourceId,saintId:row.saintId,title}),
  completeTask:(task:DisplayTask,completed:boolean)=>write({action:"task.complete",taskId:task.id,expectedVersion:task.version,completed})};
}
