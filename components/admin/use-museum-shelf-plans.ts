"use client";
import {useEffect,useState} from "react";
import type {ShelfPlanningContext} from "@/lib/museum-shelf-planning-context";

export function useMuseumShelfPlans(enabled=true){
 const [context,setContext]=useState<ShelfPlanningContext|null>(null);
 const [error,setError]=useState("");
 const [retry,setRetry]=useState(0);
 useEffect(()=>{
  if(!enabled)return;
  let stopped=false,inFlight=false;
  let controller:AbortController|null=null;
  async function refresh(){
   if(inFlight||document.visibilityState==="hidden")return;
   inFlight=true;controller=new AbortController();
   const timeout=window.setTimeout(()=>controller?.abort(),20000);
   try{
    const response=await fetch("/api/admin/museum-shelf-plans",{cache:"no-store",signal:controller.signal});
    const data=await response.json();
    if(!response.ok||data.mode!=="recommendations_only"||data.physicalActionsEnabled!==false||!Array.isArray(data.cases))throw new Error("Invalid shelf response");
    if(!stopped){setContext(data);setError("");}
   }catch{if(!stopped)setError("Shelf plans could not be refreshed. Try again.");}
   finally{window.clearTimeout(timeout);inFlight=false;}
  }
  void refresh();
  const timer=window.setInterval(()=>void refresh(),30000);
  const resume=()=>void refresh();
  window.addEventListener("focus",resume);
  return()=>{stopped=true;controller?.abort();window.clearInterval(timer);window.removeEventListener("focus",resume);};
 },[enabled,retry]);
 return {context,error,refresh:()=>setRetry(value=>value+1)};
}
