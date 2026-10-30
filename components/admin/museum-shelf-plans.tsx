"use client";
import {useEffect,useState} from "react";
import type {ShelfPlanningContext} from "@/lib/museum-shelf-planning-context";
import type {CompanionRow} from "@/lib/spn-move-guide";
import {MuseumShelfGuide} from "./museum-shelf-guide";
import {AdminViewTabs} from "./admin-view-tabs";

export function MuseumShelfPlans({rows,availableGuides,onOpenGuide}:{rows:CompanionRow[];availableGuides:string[];onOpenGuide:(code:string)=>void}){
 const [context,setContext]=useState<ShelfPlanningContext|null>(null);
 const [selected,setSelected]=useState("2");
 const [error,setError]=useState("");
 const [retry,setRetry]=useState(0);
 useEffect(()=>{
  const saved=new URL(window.location.href).searchParams.get("shelfVitrine");
  if(saved)setSelected(saved);
 },[]);
 useEffect(()=>{
  let stopped=false,inFlight=false;
  let controller:AbortController|null=null;
  async function refresh(){
   if(inFlight||document.visibilityState==="hidden")return;
   inFlight=true;controller=new AbortController();
   const timeout=window.setTimeout(()=>controller?.abort(),20000);
   try{
    const response=await fetch("/api/admin/museum-shelf-plans",{cache:"no-store",signal:controller.signal});
    const data=await response.json();
    if(!response.ok||data.mode!=="recommendations_only"||data.physicalActionsEnabled!==false||!Array.isArray(data.cases))throw new Error("Shelf plans could not be refreshed. Try again.");
    if(!stopped){setContext(data);setError("");}
   }catch{if(!stopped)setError("Shelf plans could not be refreshed. Try again.");}
   finally{window.clearTimeout(timeout);inFlight=false;}
  }
  void refresh();
  const timer=window.setInterval(()=>void refresh(),30000);
  const resume=()=>void refresh();
  window.addEventListener("focus",resume);
  return()=>{stopped=true;controller?.abort();window.clearInterval(timer);window.removeEventListener("focus",resume);};
 },[retry]);
 const plan=context?.cases.find(item=>item.code===selected)??context?.cases[0];
 function select(code:string){setSelected(code);const url=new URL(window.location.href);url.searchParams.set("shelfVitrine",code);window.history.replaceState(window.history.state,"",url);}
 return <section className="museum-admin-panel" aria-label="Shelf plans">
  <header className="section-heading"><div><p className="museum-guide-kicker">Vraj & East</p><h2>Shelf plans</h2></div><button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>setRetry(value=>value+1)}>Refresh plans</button></header>
  <p>Suggested shelf positions. Use the move guide to record placements.</p>
  {error?<p role="alert">{error}</p>:null}
  {!context&&!error?<p role="status">Loading shelf plans…</p>:null}
  {context?<AdminViewTabs label="Shelf plan vitrine" scrollable value={plan?.code??selected} onChange={select} options={context.cases.map(item=>({value:item.code,label:`Vitrine ${item.code}`}))}/>:null}
  {plan?<><header className="section-heading"><div><h3>Vitrine {plan.code}</h3><small>{plan.allocations.length} recommendations{plan.reviewedChanges.length?` · ${plan.reviewedChanges.length} to review`:""}</small></div>{availableGuides.includes(plan.code)?<button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>onOpenGuide(plan.code)}>Open move guide</button>:null}</header>
   <MuseumShelfGuide key={plan.code} plan={{...plan,refinedBandExceptions:plan.bandExceptions.map(item=>({shelfIndex:item.band,knownLoad:item.knownLoad}))}} vitrine={plan.code} entries={new Map(plan.entries.map(entry=>[entry.sourceId,entry]))} rows={rows} sourceIds={plan.allocations.map(item=>item.sourceId)} renderControl={()=>null} renderActions={()=>null}/>
   {plan.reviewedChanges.length?<section aria-label="Shelf recommendations to review"><h3>Changed since this shelf plan</h3>{plan.reviewedChanges.map(item=><article className="museum-guide-check" key={item.sourceId}><div className="museum-guide-check__body"><strong>{/^rec[A-Za-z0-9]{14}$/.test(item.name)?"Unlabelled inventory entry":item.name}</strong><small>{item.reason}</small>{item.capturedShelfIndex?<small>Earlier suggestion: row {item.capturedShelfIndex} · awaiting review</small>:null}<small>{item.effectiveDestination?`Current proposal: Vitrine ${item.effectiveDestination}`:"Destination to review"}</small></div></article>)}</section>:null}
  </>:null}
 </section>;
}
