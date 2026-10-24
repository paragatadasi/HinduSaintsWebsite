"use client";
import {useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import {loadCuratorReviewAction,loadCuratorReviewProfileAction,saveCuratorReviewAction} from "@/app/vrindavanadmin/plan/actions";
import type {CuratorReviewCase,CuratorReviewQueue} from "@/lib/museum-curator-review-domain";
import type {MuseumSaintProfile as Profile} from "@/lib/museum-saint-profile";
import {MuseumSaintProfile} from "./museum-saint-profile";

export function MuseumCuratorReview({canEdit,disabled=false}:{canEdit:boolean;disabled?:boolean}){
 const router=useRouter();
 const [open,setOpen]=useState(false),[queue,setQueue]=useState<CuratorReviewQueue|null>(null);
 const [active,setActive]=useState<string|null>(null),[error,setError]=useState(""),[message,setMessage]=useState("");
 const [pending,start]=useTransition();
 const [saving,setSaving]=useState(false),[generation,setGeneration]=useState(0);
 const busy=pending||saving;
 function load(){setError("");start(async()=>{try{setQueue(await loadCuratorReviewAction());setGeneration(value=>value+1);}catch{setError("Could not load current review cases. Try loading again.");}});}
 const cases=queue?.cases.filter(item=>item.status!=="resolved")??[];
 const ready=cases.filter(item=>item.status!=="blocked"),blocked=cases.filter(item=>item.status==="blocked");
 const selected=cases.find(item=>item.caseId===active)??ready[0]??blocked[0];
 function caseButton(item:CuratorReviewCase){return <button type="button" className="museum-curator-review__case" aria-current={item.caseId===selected?.caseId?"true":undefined} key={item.caseId} disabled={busy} onClick={()=>{setActive(item.caseId);setMessage("");}}>
  <strong>{item.title}</strong><span>{item.locationLabel||item.sourceLabel}</span><span>{item.status==="blocked"?"More evidence or record review needed":item.status==="unsure"?"Awaiting more evidence":item.status==="different"?"Different saint reported":"Identity question"}</span>
 </button>;}
 async function saved(){
  router.refresh();
  try{setQueue(await loadCuratorReviewAction());setGeneration(value=>value+1);setMessage("Review saved. The list now shows the latest decisions.");}
  catch{setQueue(null);setError("Your review was saved, but the updated list could not load. Reload the review list before continuing.");}
 }
 return <section className="museum-planner__surface admin-stack" aria-labelledby="curator-review-heading">
  <div className="section-heading"><div><p className="eyebrow">Curator review</p><h2 id="curator-review-heading">Help identify the remaining saints</h2><p>Check a portrait or label, then review the proposal that your answer would update.</p></div>
   <button type="button" className="museum-admin-button museum-admin-button--secondary" aria-expanded={open} aria-controls="curator-review-workspace" disabled={busy} onClick={()=>{setOpen(!open);if(!open)load();}}>{open?"Close review list":"Review identities"}</button>
  </div>
  {open?<div id="curator-review-workspace" className="admin-stack" aria-busy={busy}>
   {error?<p role="alert">{error}</p>:null}{message?<p role="status">{message}</p>:null}
   <div className="review-actions"><p className="muted">{queue?`${cases.length} awaiting review · ${queue.resolvedCount} resolved`:pending?"Loading current cases…":"Review list unavailable."}</p><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={busy} onClick={load}>Reload review list</button></div>
   {disabled?<p>Save or discard your section-area changes before recording a review.</p>:null}
   {queue&&!cases.length?<p>There are no remaining identity questions in this reviewed list.</p>:null}
   {selected?<div className="museum-curator-review">
    <nav className="museum-curator-review__list" aria-label="Identity review cases">
     <p className="eyebrow">Identity questions ({ready.length})</p>{ready.map(caseButton)}
     {blocked.length?<details open={selected.status==="blocked"?true:undefined}><summary>More evidence or record review ({blocked.length})</summary><div className="museum-curator-review__list">{blocked.map(caseButton)}</div></details>:null}
    </nav>
    <CuratorReviewCard key={`${selected.caseId}:${selected.revision}:${selected.status}:${generation}`} item={selected} canEdit={canEdit&&!disabled&&!busy} onSaved={saved} onBusy={setSaving}/>
   </div>:null}
   {queue?.cases.some(item=>item.status==="resolved")?<details><summary>Resolved reviews</summary><ul>{queue.cases.filter(item=>item.status==="resolved").map(item=><li key={item.caseId}>{item.title}{item.note?` — ${item.note}`:""}</li>)}</ul><p>Use the saint’s existing proposal and identity controls if a confirmed decision needs correction.</p></details>:null}
  </div>:null}
 </section>;
}

function CuratorReviewCard({item,canEdit,onSaved,onBusy}:{item:CuratorReviewCase;canEdit:boolean;onSaved:()=>Promise<void>;onBusy:(busy:boolean)=>void}){
 const [choice,setChoice]=useState(""),[note,setNote]=useState(item.note??""),[identityAck,setIdentityAck]=useState(false);
 const [error,setError]=useState(""),[needsReload,setNeedsReload]=useState(false),[pending,start]=useTransition();
 const option=item.options.find(value=>value.id===choice);
 const locked=!canEdit||pending||needsReload;
 function save(decision:"confirm_supported"|"different"|"unsure"){
  setError("");onBusy(true);start(async()=>{try{
   const result=await saveCuratorReviewAction({caseId:item.caseId,revision:item.revision,decision,note,explicitChoiceId:decision==="confirm_supported"?choice:undefined,confirmIdentityLink:decision==="confirm_supported"&&identityAck});
   if(result.error){setError(result.error);setNeedsReload(true);return;}
   await onSaved();
  }catch{setError("The save could not be confirmed. Reload the review list to check its current state before trying again.");setNeedsReload(true);}finally{onBusy(false);}});
 }
 return <article className="museum-planning-card admin-stack" aria-labelledby="curator-case-title" aria-busy={pending}>
  <header className="museum-planning-heading"><p className="eyebrow">Identity check</p><h3 id="curator-case-title">{item.title}</h3><p>{item.sourceLabel}{item.locationLabel?` · ${item.locationLabel}`:""}</p></header>
  <p>{item.question}</p>
  {item.uncertainty?<p className="muted">{item.uncertainty}</p>:null}
  {item.sourceDetails?<details><summary>Original inventory clues</summary><p className="muted">Historical source wording; this may need correction and does not establish the identity.</p><dl><dt>Name on inventory</dt><dd>{item.sourceDetails.name||"Not recorded"}</dd><dt>Place on inventory</dt><dd>{item.sourceDetails.place||"Not recorded"}</dd><dt>Relic description</dt><dd>{item.sourceDetails.relic||"Not recorded"}</dd></dl></details>:null}
  {item.saintId?<ReviewPortrait item={item}/>:null}
  {item.evidence.length?<details open><summary>Evidence to compare</summary><ul>{item.evidence.map((evidence,index)=><li key={`${evidence.url}:${index}`}><a href={evidence.url} target="_blank" rel="noopener noreferrer">{evidence.label}</a></li>)}</ul></details>:<p className="muted">No additional evidence links are available in this review. Check the physical label or leave the case unresolved.</p>}
  {item.blockedReason?<p role="status">{item.blockedReason}</p>:null}
  <fieldset className="admin-stack" disabled={locked||item.status==="blocked"}><legend>Which identity does the evidence support?</legend>
   {item.options.map(value=><label className="museum-curator-review__option" key={value.id}><input type="radio" name={`identity-${item.caseId}`} checked={choice===value.id} disabled={!!value.unavailableReason} onChange={()=>{setChoice(value.id);setIdentityAck(false);}}/><span><strong>{value.label}</strong>{value.description?<span>{value.description}</span>:null}{value.unavailableReason?<span>{value.unavailableReason}</span>:null}</span></label>)}
  </fieldset>
  {option?<section className="admin-stack" aria-label="Changes if confirmed"><h4>What confirmation will change</h4><div className="museum-curator-review__changes"><table><thead><tr><th scope="col">Field</th><th scope="col">Current</th><th scope="col">After confirmation</th></tr></thead><tbody>{option.changes.map((change,index)=><tr key={`${change.field}:${index}`}><th scope="row">{change.field}</th><td>{change.before||"Not recorded"}</td><td>{change.after||"Not recorded"}</td></tr>)}</tbody></table></div>
   {option.requiresIdentityLink?<label className="museum-curator-review__option"><input type="checkbox" checked={identityAck} disabled={locked} onChange={event=>setIdentityAck(event.target.checked)}/><span>I have checked the evidence and approve the identity changes shown above.</span></label>:null}
  </section>:null}
  <label className="admin-field">Review note<textarea aria-describedby={`review-note-${item.caseId}`} value={note} maxLength={2000} disabled={locked} onChange={event=>setNote(event.target.value)} placeholder="What did you recognize, or what should we check next?"/></label>
  <p id={`review-note-${item.caseId}`} className="muted">Add a note for “Different saint” or “Unsure.” The review stays open.</p>
  {error?<p role="alert">{error}</p>:null}
  <div className="review-actions">
   <button type="button" className="museum-admin-button" disabled={locked||item.status==="blocked"||!option||!!option.unavailableReason||(option.requiresIdentityLink&&!identityAck)} onClick={()=>save("confirm_supported")}>{pending?"Saving…":"Confirm identity and update proposal"}</button>
   <button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={locked||!note.trim()} onClick={()=>save("different")}>Different saint</button>
   <button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={locked||!note.trim()} onClick={()=>save("unsure")}>Unsure — keep for review</button>
  </div>
 </article>;
}

function ReviewPortrait({item}:{item:CuratorReviewCase}){
 const [profile,setProfile]=useState<Profile|null>(null),[loaded,setLoaded]=useState(false),[error,setError]=useState("");
 const [pending,start]=useTransition();
 function load(){setError("");start(async()=>{try{setProfile(await loadCuratorReviewProfileAction(item.caseId,item.revision));setLoaded(true);}catch{setError("Could not load the current candidate profile. Reload the review list if the record has changed.");}});}
 return <details className="admin-stack" onToggle={event=>{if(event.currentTarget.open&&!loaded&&!pending&&!error)load();}}>
  <summary>Compare the website candidate’s portrait and biography</summary>
  <p className="muted">This is the website candidate, not a photograph of this museum object. Compare it with the actual portrait or label before confirming identity.</p>
  {pending?<p role="status">Loading candidate profile…</p>:null}
  {error?<><p role="alert">{error}</p><button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={load}>Try loading profile again</button></>:null}
  {profile?<MuseumSaintProfile profile={profile} titleId="review-candidate-profile"/>:loaded?<p>No candidate profile is available. Check the physical label or leave the case unresolved.</p>:null}
 </details>;
}
