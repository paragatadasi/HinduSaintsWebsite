"use client";
import {useEffect,useState} from "react";
import type {ShelfPlanningContext} from "@/lib/museum-shelf-planning-context";
import {useMuseumReads} from "./museum-read-context";
export function useMuseumShelfPlans(enabled=true,vitrine?:string){
 const reads=useMuseumReads();
 const [state,setState]=useState<{key:string;context:ShelfPlanningContext & {availableVitrines?:string[]}}|null>(null);
 const [error,setError]=useState("");const [retry,setRetry]=useState(0);
 const url="/api/admin/museum-shelf-plans"+(vitrine?"?vitrine="+encodeURIComponent(vitrine):"");
 useEffect(()=>{
  if(!enabled)return;let stopped=false,inFlight=false;
  async function refresh(force=false){
   if(inFlight||document.visibilityState==="hidden")return;inFlight=true;
   try{const data=await reads.read<ShelfPlanningContext & {availableVitrines?:string[]}>(url,force);
    if(data.mode!=="recommendations_only"||data.physicalActionsEnabled!==false||!Array.isArray(data.cases))throw new Error("Invalid shelf response");
    if(!stopped){setState({key:url,context:data});setError("");}
   }catch{if(!stopped)setError("Shelf plans could not be refreshed. Try again.");}finally{inFlight=false;}
  }
  setError("");void refresh();const timer=window.setInterval(()=>void refresh(true),30000);
  const resume=()=>void refresh();window.addEventListener("focus",resume);
  return()=>{stopped=true;window.clearInterval(timer);window.removeEventListener("focus",resume);};
 },[enabled,url,retry,reads]);
 return {context:state?.key===url?state.context:null,error,refresh:()=>{reads.invalidate(url);setRetry(value=>value+1);}};
}
