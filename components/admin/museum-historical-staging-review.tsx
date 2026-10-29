"use client";
import {useState} from "react";

type Preview={revision:string;reportedClearedVitrines:string[];eligible:{sourceId:string;saintId:string|null;expectedCurrentRevision:string;expectedSourceRevision:string;expectedLocationVersion:number;name:string;from:{label:string}}[];blocked:{sourceId:string;name:string;reason:string}[];preservedConfirmedCount:number;alreadyStagedCount:number};
export function MuseumHistoricalStagingReview({onSaved}:{onSaved:()=>Promise<void>}){
 const [preview,setPreview]=useState<Preview|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(""),[saved,setSaved]=useState(false);
 const [cleared,setCleared]=useState(false),[staged,setStaged]=useState(false);
 async function request(save=false){
  if(busy)return;setBusy(true);setError("");
  try{
   const today=new Date(),reportedDate=[today.getFullYear(),String(today.getMonth()+1).padStart(2,"0"),String(today.getDate()).padStart(2,"0")].join("-");
   const response=await fetch("/api/admin/museum-historical-staging",save&&preview?{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"historical.staging.reconcile",museumId:"museum-spn",clientRequestId:crypto.randomUUID(),expectedRevision:preview.revision,records:preview.eligible.map(({name,from,...record})=>record),reportedDate,historicalClearanceAcknowledged:cleared,currentStagingAcknowledged:staged})}:{cache:"no-store"});
   const result=await response.json();if(!response.ok)throw new Error(result.error||"Could not load the clearing records.");
   setPreview(save?result.preview:result);setCleared(false);setStaged(false);
   if(save){setSaved(true);await onSaved();}
  }catch(error){setError(error instanceof Error?error.message:"Could not save. Reload the list before trying again.");}finally{setBusy(false);}
 }
 return <details className="museum-display-work"><summary>Record earlier starter-row clearing</summary>
 <p>Review records still showing their original vitrine. Confirm only if these relics are still in the staging area.</p>
 <button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={busy} onClick={()=>void request()}>{busy?"Loading…":preview?"Refresh list":"Review remaining records"}</button>
 {error?<p role="alert">{error}</p>:null}{saved?<p role="status">Staging records updated.</p>:null}
 {preview?<><p>{preview.eligible.length} records to review · {preview.preservedConfirmedCount} confirmed locations preserved</p>
 <details><summary>View records</summary><ul>{preview.eligible.map(row=><li key={row.sourceId}>{row.name} · {row.from.label}</li>)}</ul></details>
 {preview.blocked.length?<details><summary>{preview.blocked.length} need separate review</summary><ul>{preview.blocked.map(row=><li key={row.sourceId}>{row.name}: {row.reason}</li>)}</ul></details>:null}
 {preview.eligible.length?<><label className="room-move__check"><input type="checkbox" checked={cleared} disabled={busy} onChange={event=>setCleared(event.target.checked)}/>Vitrines {preview.reportedClearedVitrines.join(", ")} were cleared before placement began.</label>
 <label className="room-move__check"><input type="checkbox" checked={staged} disabled={busy} onChange={event=>setStaged(event.target.checked)}/>All listed relics are still in the staging area.</label>
 <button type="button" className="museum-admin-button" disabled={busy||!cleared||!staged} onClick={()=>void request(true)}>Confirm staging records</button></>:null}</>:null}
 </details>;
}
