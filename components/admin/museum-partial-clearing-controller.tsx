"use client";

import {useEffect, useRef, useState} from "react";
import {MuseumPartialClearing} from "./museum-partial-clearing";
import type {CompanionRow, GuideEntry, PhysicalState} from "@/lib/spn-move-guide";

type RecordRef = {sourceId:string; saintId:string|null; expectedCurrentRevision:string; expectedSourceRevision:string; expectedLocationVersion:number};
type Preview = {revision:string; eligible:(RecordRef & {name:string; from:unknown})[]; blocked:{sourceId:string;reason:string}[]; alreadyStagedCount:number};
type Context = {guideVersion:string;contentDigest:string;assignmentDigest:string};
export function MuseumPartialClearingController({vitrine, guideContext, rows, missing, entries, disabled, ready, onSaved}: {
  vitrine:string; guideContext:Context; rows:CompanionRow[];
  missing:PhysicalState["unmappedCurrentLocations"]; entries:Pick<GuideEntry,"sourceId"|"destination">[];
  disabled:boolean; ready:boolean; onSaved:()=>Promise<void>;
}) {
  const [preview,setPreview]=useState<Preview|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const lock=useRef(false);
  const pending=useRef<{kind:"stage"|"space"; body:Record<string,unknown>}|null>(null);
  const loadingRequest=useRef<AbortController|null>(null);
  async function load() {
    loadingRequest.current?.abort();
    const request=new AbortController();loadingRequest.current=request;setError("");
    const timeout=setTimeout(()=>request.abort(),30000);
    try {
      const query=new URLSearchParams({museumId:"museum-spn",vitrine,mode:"contents"});
      const response=await fetch(`/api/admin/museum-historical-staging?${query}`,{cache:"no-store",signal:request.signal});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"Could not load contents. Refresh and try again.");
      if(loadingRequest.current===request)setPreview(data as Preview);
    } catch(e) {
      if(loadingRequest.current===request)setError(request.signal.aborted?"Loading contents took too long. Refresh contents to try again.":e instanceof Error?e.message:"Could not load contents. Refresh and try again.");
    } finally {
      clearTimeout(timeout);
      if(loadingRequest.current===request)loadingRequest.current=null;
    }
  }
  useEffect(()=>{void load();return()=>{const request=loadingRequest.current;loadingRequest.current=null;request?.abort();};},[vitrine]);
  async function save(kind:"stage"|"space", ids:string[]=[]):Promise<boolean> {
    if(lock.current||disabled||!preview)return false;
    if(pending.current&&pending.current.kind!==kind){setError("Retry the previous save or refresh its status before another action.");return false;}
    if(pending.current&&kind==="stage"){
      const previous=(pending.current.body.records as {sourceId:string}[]).map(row=>row.sourceId).sort();
      if(JSON.stringify(previous)!==JSON.stringify([...ids].sort())){setError("The previous save is still unconfirmed. Retry with the same selection, then refresh before changing it.");return false;}
    }
    lock.current=true;setBusy(true);setError("");
    let committed=false;
    try {
      if(!pending.current){
        let body:Record<string,unknown>;
        if(kind==="stage"){
          const now=new Date(),date=[now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
          const records=preview.eligible.filter(row=>ids.includes(row.sourceId)).map(({name,from,...record})=>({...record,to:{kind:"table",code:"staging-area",label:"Staging area"}}));
          if(!records.length)return false;
          body={museumId:"museum-spn",clientRequestId:crypto.randomUUID(),confirmedDate:date,datePrecision:"date",physicalConfirmation:true,inventoryAcknowledged:true,evidence:`Selected contents of Vitrine ${vitrine} moved to staging.`,caseContentsStaging:{vitrine,expectedRevision:preview.revision,selectedContentsPhysicallyStaged:true,confirmedTargetPlacementsPreserved:true},records};
        }else{
          const query=new URLSearchParams({museumId:"museum-spn",view:"receiver-availability",vitrine,guideVersion:guideContext.guideVersion});
          const response=await fetch(`/api/admin/museum-physical-locations?${query}`,{cache:"no-store"});
          const data=await response.json();if(!response.ok)throw new Error(data.error||"Could not check available space. Try again.");
          body={action:"receiver.availability",museumId:"museum-spn",clientRequestId:crypto.randomUUID(),guideContext,vitrine,expectedRevision:data.revision,expectedPreparationVersion:data.expectedPreparationVersion,availableSpaceAcknowledged:true};
        }
        pending.current={kind,body};
      }
      const response=await fetch("/api/admin/museum-physical-locations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(pending.current.body)});
      const data=await response.json();
      if(!response.ok){if(response.status<500)pending.current=null;throw new Error(data.error||"Could not save. Retry this action.");}
      pending.current=null;committed=true;
      await onSaved();await load();
      return true;
    }catch(e){setError(committed?"Saved. Refresh the companion to see the updated contents.":e instanceof Error?e.message:"Could not save. Retry this action.");return committed;}
    finally{lock.current=false;setBusy(false);}
  }
  const eligible=new Set(preview?.eligible.map(row=>row.sourceId));
  return <>
    {!preview ? <section className="museum-admin-panel"><p role="status">{error||"Loading current contents…"}</p><button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>void load().catch(e=>setError(e.message))}>Refresh contents</button></section> :
      <MuseumPartialClearing vitrine={vitrine} rows={rows} missing={missing} entries={entries} editable={!disabled} busy={busy} error={error} stagedCount={preview.alreadyStagedCount} ready={ready}
        blockedReason={row=>preview.blocked.find(item=>item.sourceId===row.sourceId)?.reason??(!eligible.has(row.sourceId)?"Placement preserved; not selected for clearing.":null)}
        onStage={ids=>save("stage",ids)} onConfirmSpace={()=>save("space")}/>}
    {preview&&error&&!pending.current?<button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={busy} onClick={()=>{setError("");void Promise.all([load(),onSaved()]).catch(e=>setError(e.message));}}>Refresh contents</button>:null}
  </>;
}
