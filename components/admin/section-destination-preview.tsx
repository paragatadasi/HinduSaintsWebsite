"use client";
import {useEffect,useState} from "react";
import {loadSectionDestinationPreviewAction} from "@/app/vrindavanadmin/actions";

type Request={saintId?:string;familyKey?:string;groupKey?:string;section:string};
type Preview=Awaited<ReturnType<typeof loadSectionDestinationPreviewAction>>;
export function useSectionDestinationPreview(request:Request|null){
 const key=request?JSON.stringify(request):"";
 const [attempt,setAttempt]=useState(0);
 const [result,setResult]=useState<{key:string;attempt:number;data?:Preview;failed?:boolean}|null>(null);
 useEffect(()=>{if(!key)return;let active=true;loadSectionDestinationPreviewAction(JSON.parse(key)).then(data=>{if(active)setResult({key,attempt,data});}).catch(()=>{if(active)setResult({key,attempt,failed:true});});return()=>{active=false;};},[key,attempt]);
 const current=result?.key===key&&result.attempt===attempt?result:null;
 return {required:!!key,data:current?.data,failed:!!current?.failed,ready:!key||!!current?.data&&!current.data.blockedReason,refresh:()=>setAttempt(n=>n+1)};
}
export function SectionDestinationPreview({preview}:{preview:ReturnType<typeof useSectionDestinationPreview>}){
 if(!preview.required)return null;
 return <section className="museum-saint-review-section" aria-label="Destination after section change">
  <h3>Destination after section change</h3>
  <input type="hidden" name="destinationRevision" value={preview.ready?preview.data?.revision||"":""}/>
  {preview.failed?<p role="alert">Could not load the destination preview. Refresh it before saving.</p>:!preview.data?<p role="status">Checking the section’s saved vitrines…</p>:<>
   {preview.data.blockedReason?<p role="alert">{preview.data.blockedReason}</p>:null}
   {preview.data.rows.length?<ul>{preview.data.rows.map(row=><li key={row.saintId}><strong>{row.name}</strong>: {row.message}</li>)}</ul>:<p>The section is unchanged; existing destinations are retained.</p>}
   <p>Check the updated destination before saving.</p>
  </>}
  <button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={preview.refresh}>Refresh destination preview</button>
 </section>;
}
