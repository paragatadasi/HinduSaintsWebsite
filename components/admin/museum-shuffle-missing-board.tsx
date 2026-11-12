"use client";

import React,{useCallback,useEffect,useState} from "react";
import type {ShuffleMissingRecord} from "@/lib/museum-shuffle-missing-types";

function MissingPhoto({photo}:{photo:ShuffleMissingRecord["photos"][number]}){
 const [failed,setFailed]=useState(false);
 return failed?<span className="muted">Photo unavailable</span>:<a href={photo.url} target="_blank" rel="noreferrer"><img src={photo.url} alt={photo.alt} loading="lazy" onError={()=>setFailed(true)}/></a>;
}
export function MuseumShuffleMissingBoard(){
 const [records,setRecords]=useState<ShuffleMissingRecord[]|null>(null);
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 const reload=useCallback(async(signal?:AbortSignal)=>{
  setBusy(true);
  try{
   const response=await fetch("/api/museum/shuffle-guide/missing",{cache:"no-store",signal});
   const result=await response.json();
   if(!response.ok)throw new Error(result.error||"Could not load missing records.");
   setRecords(result.records);setError("");
  }catch(cause){if(!signal?.aborted)setError(cause instanceof Error?cause.message:"Could not load missing records.");}
  finally{if(!signal?.aborted)setBusy(false);}
 },[]);
 useEffect(()=>{const controller=new AbortController();void reload(controller.signal);return()=>controller.abort();},[reload]);
 return <section className="museum-admin-panel museum-missing-board" aria-label="Missing relics">
  <div className="section-heading"><h2>Missing relics{records?` · ${records.length}`:""}</h2><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={busy} onClick={()=>void reload()}>Refresh</button></div>
  <p className="muted">Southern island · missing records without a preliminary note</p>
  {error?<p role="alert">{error}</p>:null}
  {!records?(busy?<p role="status">Loading missing records…</p>:null):!records.length?<p>No missing records awaiting a preliminary note.</p>:<div className="museum-missing-board__records">{records.map(record=><article key={record.sourceId} className="museum-missing-board__record">
   <h3>{record.name}</h3>
   <div className="museum-missing-board__photos">{(["saint","relic"] as const).map(kind=><div key={kind}><small>{kind==="saint"?"Saint":"Relic"}</small>{record.photos.filter(photo=>photo.kind===kind).length?record.photos.filter(photo=>photo.kind===kind).map(photo=><MissingPhoto key={photo.url} photo={photo}/>):<p className="muted">No photo available</p>}</div>)}</div>
   {record.description?<p>{record.description}</p>:null}
   <small className="muted">{record.location}</small>
   {record.note?<p className="museum-missing-board__note"><strong>Missing:</strong> {record.note}</p>:null}
  </article>)}</div>}
 </section>;
}

