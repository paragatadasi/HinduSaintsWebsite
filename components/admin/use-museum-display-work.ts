"use client";
import {mergeSourceWork} from "@/lib/museum-save-receipts";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import type {CompanionRow} from "@/lib/spn-move-guide";

type Shelf={sourceId:string;saintId:string|null;vitrine:string;shelf:string|null;physicalVersion:number;version:number};
export type DisplayTask={id:string;sourceId:string;saintId:string|null;title:string;status:"open"|"completed";version:number;createdAt:string;completedAt:string|null};
type Work={shelves:Shelf[];tasks:DisplayTask[]};
const endpoint="/api/admin/museum-companion-work";
export function useMuseumDisplayWork(sourceIds?:string[]){
 const pending=useRef(new Map<string,string>());
 const scope=sourceIds?[...new Set(sourceIds)].sort().join(","):"";
 const currentScope=useRef(scope);currentScope.current=scope;
 const [work,setWork]=useState<Work>({shelves:[],tasks:[]});
 const active=useRef(new Set<string>());
 const epoch=useRef(0);
 const readSequence=useRef(0);
 const [savingSources,setSavingSources]=useState<string[]>([]);
 const busy=savingSources.length>0;
 const [loaded,setLoaded]=useState(false),[error,setError]=useState("");
 const reload=useCallback(async(signal?:AbortSignal)=>{
  const started=epoch.current,sequence=++readSequence.current;
  const params=new URLSearchParams({museumId:"museum-spn"});scope.split(",").filter(Boolean).forEach(id=>params.append("sourceId",id));
  const response=await fetch(`${endpoint}?${params}`,{cache:"no-store",signal});const result=await response.json();
  if(!response.ok)throw new Error(result.error||"Could not load shelves and to-dos.");
  if(!Array.isArray(result.shelves)||!Array.isArray(result.tasks))throw new Error("Could not load shelves and to-dos.");
  if(currentScope.current===scope&&started===epoch.current&&sequence===readSequence.current&&active.current.size===0){setWork(result);setLoaded(true);setError("");}
 },[scope]);
 useEffect(()=>{setLoaded(false);setWork({shelves:[],tasks:[]});void reload().catch(e=>setError(e.message));},[reload]);
 useEffect(()=>{
  const refresh=()=>{if(document.visibilityState!=="visible"||active.current.size)return;void reload().catch(error=>setError(error.message));};
  const interval=window.setInterval(refresh,10000);
  window.addEventListener("focus",refresh);
  return()=>{window.clearInterval(interval);window.removeEventListener("focus",refresh);};
 },[reload]);
 async function write(body:Record<string,unknown>){
  const sourceId=typeof body.sourceId==="string"?body.sourceId:work.tasks.find(task=>task.id===body.taskId)?.sourceId;
  if(!sourceId)throw new Error("Reload this record before saving.");
  if(active.current.has(sourceId))throw new Error("This record is still saving. Try again when it finishes.");
  active.current.add(sourceId);epoch.current+=1;setSavingSources(previous=>[...previous,sourceId]);
  const controller=new AbortController();const timeout=window.setTimeout(()=>controller.abort(),30000);
  try{
  const key=JSON.stringify(body);const requestId=pending.current.get(key)??crypto.randomUUID();pending.current.set(key,requestId);
  const response=await fetch(endpoint,{method:"POST",signal:controller.signal,headers:{"Content-Type":"application/json"},body:JSON.stringify({museumId:"museum-spn",clientRequestId:requestId,...body})});
  const result=await response.json();if(!response.ok){if(response.status<500)pending.current.delete(key);if(response.status===409)window.setTimeout(()=>void reload().catch(error=>setError(error.message)),0);throw new Error(result.error||"Could not save. Your details are still here.");}
  if(!Array.isArray(result.sourceIds)||!Array.isArray(result.shelves)||!Array.isArray(result.tasks))throw new Error("The save could not be confirmed. Try again to check its status.");
  pending.current.delete(key);
  if(currentScope.current===scope)setWork(previous=>mergeSourceWork(previous,result));
  }catch(error){if(error instanceof Error&&error.name==="AbortError")throw new Error("The save has not been confirmed. Try saving the same details again.");throw error;}finally{window.clearTimeout(timeout);active.current.delete(sourceId);epoch.current+=1;setSavingSources(previous=>previous.filter(id=>id!==sourceId));}
 }
 const shelvesBySource=useMemo(()=>new Map(work.shelves.map(shelf=>[shelf.sourceId,shelf])),[work.shelves]);
 function annotation(row:CompanionRow){const location=row.componentPlacement?.location??row.current,s=shelvesBySource.get(row.sourceId);return s&&s.saintId===row.saintId&&location?.kind==="vitrine"&&s.vitrine===location.code&&s.physicalVersion===row.currentVersion?s:undefined;}
 return {shelves:work.shelves,tasks:work.tasks,loaded,error,reload,busy,isSaving:(sourceId:string)=>active.current.has(sourceId),
  shelf:(row:CompanionRow)=>(row.componentPlacement||row.currentBasis==="confirmed")?(annotation(row)?annotation(row)!.shelf:(row.componentPlacement?.location??row.current)?.shelf??null):null,
  saveShelf:(row:CompanionRow,shelf:string)=>write({action:"shelf.update",sourceId:row.sourceId,saintId:row.saintId,vitrine:(row.componentPlacement?.location??row.current)?.code,shelf,expectedVersion:shelvesBySource.get(row.sourceId)?.version??0,expectedCurrentRevision:row.currentRevision,expectedSourceRevision:row.sourceRevision,expectedLocationVersion:row.currentVersion}),
  addTask:(row:CompanionRow,title:string)=>write({action:"task.create",sourceId:row.sourceId,saintId:row.saintId,title}),
  completeTask:(task:DisplayTask,completed:boolean)=>write({action:"task.complete",taskId:task.id,expectedVersion:task.version,completed})};
}
