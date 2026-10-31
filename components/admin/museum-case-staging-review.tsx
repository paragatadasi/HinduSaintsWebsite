"use client";
import {useRef, useState} from "react";
import type {GuideEntry, PhysicalLocation, VitrinePreparation} from "@/lib/spn-move-guide";
import {MuseumStagingSelection} from "./museum-staging-selection";

type RecordRef = {sourceId:string; saintId:string|null; expectedCurrentRevision:string; expectedSourceRevision:string; expectedLocationVersion:number};
type Preview = {
 revision:string;
 eligible:(RecordRef & {name:string;from:PhysicalLocation})[];
 blocked:{sourceId:string;name:string;reason:string}[];
 preservedConfirmedCount:number;
 alreadyStagedCount:number;
};
type Mode = "contents" | "historical";
export function MuseumCaseStagingReview({vitrine, preparation, entries, disabled, onSaved}: {
 vitrine:string; preparation?:VitrinePreparation; entries:Pick<GuideEntry,"sourceId"|"destination">[];
 disabled:boolean; onSaved:()=>Promise<void>;
}) {
 const [preview,setPreview]=useState<Preview|null>(null),[mode,setMode]=useState<Mode>("contents");
 const [selected,setSelected]=useState<string[]>([]),[acknowledged,setAcknowledged]=useState(false),[historicallyCleared,setHistoricallyCleared]=useState(false);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[saved,setSaved]=useState(false);
 const pending=useRef<{url:string;body:Record<string,unknown>}|null>(null);
 async function load(next:Mode) {
  if(busy)return;
  setBusy(true);setError("");setPreview(null);setSelected([]);setAcknowledged(false);setHistoricallyCleared(false);setSaved(false);pending.current=null;setMode(next);
  try {
   const query=new URLSearchParams({museumId:"museum-spn",vitrine,...(next==="contents"?{mode:"contents"}:{preparationReceiptId:preparation!.receiptId})});
   const response=await fetch(`/api/admin/museum-historical-staging?${query}`,{cache:"no-store"});
   const data=await response.json();if(!response.ok)throw new Error(data.error||"Could not load these contents. Try again.");
   setPreview(data);
  } catch(error) {setError(error instanceof Error?error.message:"Could not load these contents. Try again.");}
  finally {setBusy(false);}
 }
 async function save() {
  if(busy||disabled||!preview||!selected.length||!acknowledged||(mode==="historical"&&!historicallyCleared))return;
  setBusy(true);setError("");
  try {
   if(!pending.current) {
    const now=new Date(),date=[now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
    const records=preview.eligible.filter(row=>selected.includes(row.sourceId)).map(({name,from,...record})=>record);
    const common={museumId:"museum-spn",clientRequestId:crypto.randomUUID(),records};
    pending.current=mode==="historical"?{url:"/api/admin/museum-historical-staging",body:{...common,action:"case.staging.reconcile",vitrine,preparationReceiptId:preparation!.receiptId,expectedRevision:preview.revision,reportedDate:date,historicalClearanceAcknowledged:true,currentStagingAcknowledged:true}}:
     {url:"/api/admin/museum-physical-locations",body:{...common,confirmedDate:date,datePrecision:"date",physicalConfirmation:true,inventoryAcknowledged:true,evidence:`Curator confirmed selected Vitrine ${vitrine} contents are in staging. Other recorded placements remain unchanged.`,caseContentsStaging:{vitrine,expectedRevision:preview.revision,selectedContentsPhysicallyStaged:true,confirmedTargetPlacementsPreserved:true},records:records.map(row=>({...row,to:{kind:"table",code:"staging-area",label:"Staging area"}}))}};
   }
   const response=await fetch(pending.current.url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(pending.current.body)});
   const data=await response.json();if(!response.ok)throw new Error(data.error||"Could not save. Retry or refresh this list.");
   pending.current=null;setSaved(true);setPreview(null);setSelected([]);setAcknowledged(false);
   await onSaved();
  } catch(error) {setError(error instanceof Error?error.message:"Could not save. Retry or refresh this list.");}
  finally {setBusy(false);}
 }
 const destinations=new Map(entries.map(entry=>[entry.sourceId,entry.destination]));
 return <details className="museum-display-work">
  <summary>Record contents moved to staging</summary>
  <p>Select only pieces moved out of Vitrine {vitrine}. Other entries stay unchanged; this does not mark the whole vitrine empty.</p>
  <div className="review-actions">
   <button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={busy||disabled} onClick={()=>void load("contents")}>Review current contents</button>
   {preparation?.basis==="preparation"?<button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={busy||disabled} onClick={()=>void load("historical")}>Review earlier clearing</button>:null}
  </div>
  {busy&&!preview?<p role="status">Loading…</p>:null}
  {saved?<p role="status">Staging records saved.</p>:null}
  {error?<p role="alert">{error}</p>:null}
  {preview?<>
   <p>{preview.preservedConfirmedCount} confirmed placements preserved</p>
   {preview.blocked.length?<details><summary>{preview.blocked.length} need separate review</summary><ul>{preview.blocked.map(row=><li key={row.sourceId}>{row.name}: {row.reason}</li>)}</ul></details>:null}
   {mode==="historical"?<label className="room-move__check"><input type="checkbox" checked={historicallyCleared} disabled={busy||disabled} onChange={event=>{setHistoricallyCleared(event.target.checked);pending.current=null;}}/>These pieces were cleared when Vitrine {vitrine} was marked available.</label>:null}
   <MuseumStagingSelection vitrine={vitrine} candidates={preview.eligible.map(row=>({sourceId:row.sourceId,name:row.name,shelf:row.from.shelf,destination:destinations.get(row.sourceId)}))} selectedIds={selected} acknowledged={acknowledged} busy={busy||disabled} confirmDisabled={mode==="historical"&&!historicallyCleared} onSelection={ids=>{setSelected(ids);pending.current=null;}} onAcknowledgement={value=>{setAcknowledged(value);pending.current=null;}} onConfirm={()=>void save()}/>
   {mode==="historical"&&!historicallyCleared&&selected.length>0?<small>Confirm the earlier clearing above before saving.</small>:null}
  </>:null}
 </details>;
}
