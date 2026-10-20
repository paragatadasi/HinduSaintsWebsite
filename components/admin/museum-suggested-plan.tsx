"use client";
import {useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import {previewSuggestedPlanAction,applySuggestedPlanAction,clearSuggestedPlanAction} from "@/app/vrindavanadmin/plan/actions";
import type {SuggestedPlan} from "@/lib/museum-suggested-plan";
import type {PlannerData} from "@/lib/museum-move-planner-domain";
import {MuseumDetailDialog} from "./museum-detail-dialog";
import {MuseumRoomPlan} from "./museum-room-plan";
import guide from "@/data/museum/vrindavan-suggested-plan.json";

export function MuseumSuggestedPlan({data,disabled=false}:{data:PlannerData;disabled?:boolean}){
 const router=useRouter();
 const [preview,setPreview]=useState<SuggestedPlan|null>(null),[clear,setClear]=useState(false);
 const [selectedVitrine,setSelectedVitrine]=useState("");
 const [error,setError]=useState(""),[message,setMessage]=useState("");
 const [pending,start]=useTransition();
 function run(work:()=>Promise<void>){setError("");start(async()=>{try{await work();}catch{setError("This action could not be confirmed. Reload to check the saved plan before trying again.");}});}
 const vitrines=preview?[...new Set(preview.assignments.map(a=>a.vitrine))].sort((a,b)=>Number(a)-Number(b)):[];
 return <section className="museum-planner__surface admin-stack">
  <div className="section-heading"><div><p className="eyebrow">A starting arrangement</p><h2>Let us help with the plan</h2><p>Keep related saints together, with room for frames and upper display space for primary and secondary saints.</p></div></div>
  <div className="review-actions">
   <button type="button" className="museum-admin-button" disabled={pending||disabled||!!data.suggestionId} onClick={()=>run(async()=>setPreview(await previewSuggestedPlanAction()))}>{pending?"Preparing…":"Suggest a Plan for Me"}</button>
   {data.suggestionId?<button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={pending||disabled} onClick={()=>setClear(true)}>Clear suggested plan</button>:null}
  </div>
  {data.suggestionId?<p className="muted">The suggestion is loaded. Adjust any destination below, or use the move companion when ready.</p>:<p className="muted">Preview first. Existing plans and physical placements are kept.</p>}
  {disabled?<p>Save or discard your section-area changes before loading a suggestion.</p>:null}
  {error?<p role="alert">{error}</p>:null}{message?<p role="status">{message}</p>:null}
  {preview?<MuseumDetailDialog titleId="suggested-plan-title" kicker="Review the proposed arrangement" closeLabel="Close plan preview" onClose={()=>setPreview(null)}>
   <div className="admin-stack">
    <h2 id="suggested-plan-title">Your suggested move plan</h2>
    <p>{preview.assignments.length} saints across {vitrines.length} vitrines. Existing section areas and destinations remain in place.</p>
    <p>Shared inventory entries stay together. Existing display families are provisional groupings, not reviewed lineage claims. Specific website traditions help place related groups nearby without changing family membership.</p>
    <p className="muted">Space is an estimate, not a measured capacity. Frame entries need extra allowance; unknown packaging is treated cautiously. Check the fit before moving. Shelf positions remain undecided.</p>
    <p className="muted">Vitrine comparisons use the source inventory reviewed on 20 October 2026. Missing entries do not establish that a vitrine is empty.</p>
    {!data.photosConfigured?<p>Photo tags are still unavailable. Frame evidence is included separately.</p>:null}
    <MuseumRoomPlan selected={selectedVitrine?[selectedVitrine]:[]} onSelect={setSelectedVitrine}
     counts={Object.fromEntries(vitrines.map(v=>[v,preview.assignments.filter(a=>a.vitrine===v).length]))}
     labels={Object.fromEntries(vitrines.map(v=>[v,[...new Set(preview.groups.filter(g=>g.vitrine===v).flatMap(g=>g.sections))]]))}/>
    <details><summary>Why these areas?</summary><ul>{preview.areas.map(area=><li key={area.section}><strong>{area.section} · {area.vitrines.join(", ")}</strong>{area.preserved?" · Saved area kept":null}<p>{guide.rationales.find(r=>r.section===area.section)?.rationale}</p></li>)}</ul></details>
    {vitrines.map(number=>{
     const groups=preview.groups.filter(g=>g.vitrine===number);
     const observed=guide.observedVitrines.find(v=>v.vitrine===number);
     const frames=groups.reduce((n,g)=>n+g.frames,0),entries=groups.reduce((n,g)=>n+g.entries,0);
     return <details key={number} open={selectedVitrine===number?true:undefined} className="museum-planner__surface"><summary>Vitrine {number} · {groups.reduce((n,g)=>n+g.names.length,0)} saints · {groups.reduce((n,g)=>n+g.upper,0)} primary / secondary</summary>
      <p>Suggested: {entries} source entries, including {frames} frame entries.</p>
      <p className="muted">{observed?.entries?`Source inventory recorded ${observed.entries} entries here, including ${observed.frames} frame entries. This is a comparison, not a capacity limit.`:"No source inventory was recorded here. Confirm this vitrine is available and check its size before moving."}</p>
      {observed?.entries&&frames>observed.frames?<p>More frame entries than previously recorded here; check the fit.</p>:null}
      <ul>{groups.map((group,i)=><li key={i}><strong>{group.names[0]}{group.names.length>1?` + ${group.names.length-1} related saints`:""}</strong><p>{group.sections.join(" · ")} · {group.frames} frame entries / {group.entries} inventory entries</p>{group.names.length>1?<p>{group.names.slice(1).join(" · ")}</p>:null}</li>)}</ul>
      <p>Place primary and secondary saints in the upper rows where space allows, keeping their group together. Five rows is a working assumption; choose actual shelf positions during the move.</p>
     </details>;
    })}
    {preview.held.length?<details><summary>{preview.held.reduce((n,g)=>n+g.names.length,0)} saints kept unchanged or needing a decision</summary><ul>{preview.held.map((group,i)=><li key={i}>{group.names.join(" · ")} — {group.reason}</li>)}</ul></details>:null}
    {error?<p role="alert">{error}</p>:null}
    <div className="review-actions"><button type="button" className="museum-admin-button" disabled={pending||!preview.assignments.length} onClick={()=>run(async()=>{
     const result=await applySuggestedPlanAction({revision:preview.revision,version:preview.version});if(result.error){setError(result.error);return;}
     setPreview(null);setMessage("Suggested destinations saved. Check the fit as you move; use the companion to record actual placements.");router.refresh();
    })}>{pending?"Saving…":"Load this plan"}</button><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={pending} onClick={()=>setPreview(null)}>Keep planning myself</button></div>
   </div>
  </MuseumDetailDialog>:null}
  {clear?<MuseumDetailDialog titleId="clear-suggestion-title" kicker="Clear suggestion" closeLabel="Cancel clearing" onClose={()=>setClear(false)}>
   <div className="admin-stack"><h2 id="clear-suggestion-title">Clear the suggested plan?</h2><p>This removes unchanged suggested destinations and unused suggested areas. Your earlier plans, later edits, and implemented moves stay in place.</p>{error?<p role="alert">{error}</p>:null}<div className="review-actions"><button type="button" className="museum-admin-button" disabled={pending} onClick={()=>run(async()=>{
    const result=await clearSuggestedPlanAction({revision:data.revision,suggestionId:data.suggestionId});if(result.error){setError(result.error);return;}
    setClear(false);setMessage("Unchanged suggestions cleared. Earlier plans, later edits and physical placements were kept.");router.refresh();
   })}>{pending?"Clearing…":"Clear suggested plan"}</button><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={pending} onClick={()=>setClear(false)}>Keep plan</button></div></div>
  </MuseumDetailDialog>:null}
 </section>;
}
