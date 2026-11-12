"use client";
import {useCallback,useEffect,useRef,useState} from "react";

import {mergeShuffleStates,type ShuffleState} from "@/lib/museum-shuffle-client";
export type ShufflePhysicalConfirmation={revision:string;confirmedDate:string};
export type ShufflePhysicalPreview={revision:string;alreadyAtTarget?:boolean;records:{sourceId:string;name:string;bottomShelfRequired:boolean;from:{kind:string;code:string;label:string;shelf?:string|null}|null;to:{kind:string;code:string;label:string;shelf?:string|null}}[]};
type Pending={actionId:string;completed:boolean;expectedVersion:number;clientRequestId:string;physicalConfirmation?:ShufflePhysicalConfirmation};
const endpoint="/api/museum/shuffle-guide";
export function useMuseumShuffle(){
 const [states,setStates]=useState<Record<string,ShuffleState>>({});
 const [loaded,setLoaded]=useState(false),[error,setError]=useState("");
 const [errors,setErrors]=useState<Record<string,string>>({});
 const [pendingView,setPendingView]=useState<Record<string,Pending>>({});
 const [saving,setSaving]=useState<ReadonlySet<string>>(new Set());
 const [permitted,setPermitted]=useState(true);
 const [physicalActionIds,setPhysicalActionIds]=useState<string[]>([]);
 const current=useRef(states),pending=useRef(new Map<string,Pending>()),writing=useRef(new Set<string>());
 const reading=useRef(false),mounted=useRef(true);
 const merge=useCallback((rows:ShuffleState[])=>{
  setStates(previous=>{
   const next=mergeShuffleStates(previous,rows);
   current.current=next;return next;
  });
 },[]);
 const reload=useCallback(async()=>{
  if(reading.current)return;
  reading.current=true;
  try{
   const response=await fetch(endpoint,{cache:"no-store",signal:AbortSignal.timeout(15000)});
   const result=await response.json();
   if(!response.ok||!Array.isArray(result.actions))throw Error(result.error||"Could not load the checklist.");
   if(mounted.current){merge(result.actions);setLoaded(true);setPermitted(result.canEdit!==false);setPhysicalActionIds(result.physicalActionIds??[]);setError("");}
  }catch(cause){if(mounted.current)setError(cause instanceof Error?cause.message:"Could not refresh the checklist.");}
  finally{reading.current=false;}
 },[merge]);
 useEffect(()=>{
  mounted.current=true;void reload();
  const refresh=()=>{if(document.visibilityState==="visible")void reload();};
  const timer=window.setInterval(refresh,15000);
  window.addEventListener("focus",refresh);document.addEventListener("visibilitychange",refresh);
  return()=>{mounted.current=false;window.clearInterval(timer);window.removeEventListener("focus",refresh);document.removeEventListener("visibilitychange",refresh);};
 },[reload]);
 async function preview(actionId:string):Promise<ShufflePhysicalPreview>{
  const response=await fetch(endpoint+"?actionId="+encodeURIComponent(actionId),{cache:"no-store",signal:AbortSignal.timeout(15000)});
  const result=await response.json();
  if(!response.ok||!result.physical)throw Error(result.error||"Could not load the current locations.");
  return result.physical;
 }
 async function save(actionId:string,completed:boolean,physicalConfirmation?:ShufflePhysicalConfirmation){
  if(writing.current.has(actionId))return;
  const request=pending.current.get(actionId)??{actionId,completed,expectedVersion:current.current[actionId]?.version??0,clientRequestId:crypto.randomUUID(),...(physicalConfirmation?{physicalConfirmation}:{})};
  pending.current.set(actionId,request);setPendingView(Object.fromEntries(pending.current));
  writing.current.add(actionId);setSaving(new Set(writing.current));setErrors(previous=>({...previous,[actionId]:""}));
  try{
   const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(request),signal:AbortSignal.timeout(20000)});
   const result=await response.json();
   if(!response.ok){
    if(response.status>=400&&response.status<500){pending.current.delete(actionId);if(response.status===409)void reload();}
    throw Error(result.error||"Could not save this check. Try again.");
   }
   if(!result.action||result.action.actionId!==actionId)throw Error("Save could not be verified. Retry to check.");
   pending.current.delete(actionId);if(mounted.current)merge([result.action]);
   return true;
  }catch(cause){
   if(mounted.current)setErrors(previous=>({...previous,[actionId]:cause instanceof Error&&cause.name!=="TimeoutError"?cause.message:"Save not confirmed. Retry to check."}));
   return false;
  }finally{
   writing.current.delete(actionId);
   if(mounted.current){setSaving(new Set(writing.current));setPendingView(Object.fromEntries(pending.current));}
  }
 }
 return {states,loaded,error,errors,saving,pending:pendingView,permitted,physicalActionIds,preview,reload,save};
}
