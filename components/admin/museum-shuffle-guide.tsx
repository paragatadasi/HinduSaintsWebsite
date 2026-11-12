"use client";
import React,{useState} from "react";
import {MuseumDetailDialog} from "./museum-detail-dialog";
import {MuseumShuffleMissingBoard} from "./museum-shuffle-missing-board";
import type {ShufflePhysicalPreview} from "./use-museum-shuffle";
import {shuffleSections,shuffleGuideIntro,shuffleProgress} from "@/lib/spn-shuffle-guide";
import {useMuseumShuffle} from "./use-museum-shuffle";

export function MuseumShuffleGuide({canEdit}:{canEdit:boolean}){
 const work=useMuseumShuffle();
 const [confirm,setConfirm]=useState<{id:string;preview:ShufflePhysicalPreview|null;error:string}|null>(null);
 const [confirming,setConfirming]=useState(false);
 async function confirmMove(id:string){
  setConfirm({id,preview:null,error:""});
  try{const preview=await work.preview(id);setConfirm(current=>current?.id===id?{id,preview,error:""}:current);}
  catch(cause){setConfirm(current=>current?.id===id?{id,preview:null,error:cause instanceof Error?cause.message:"Could not load locations."}:current);}
 }
 async function saveMove(){
  if(!confirm?.preview)return;
  setConfirming(true);
  const today=new Date();
  const confirmedDate=[today.getFullYear(),String(today.getMonth()+1).padStart(2,"0"),String(today.getDate()).padStart(2,"0")].join("-");
  const saved=await work.save(confirm.id,true,{revision:confirm.preview.revision,confirmedDate});
  setConfirming(false);if(saved)setConfirm(current=>current?.id===confirm.id?null:current);
 }
 const completed=new Set(Object.values(work.states).filter(action=>action.completed).map(action=>action.actionId));
 const progress=shuffleProgress(completed);
 return <section className="museum-shuffle" aria-label="Shuffle Guide">
  <header className="museum-admin-panel">
   <div className="section-heading"><h2>Shuffle Guide</h2><button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>void work.reload()}>Refresh</button></div>
   <p>{shuffleGuideIntro}</p>
   <p className="muted">Confirming a move saves the relic locations. Unchecking only reopens the checklist; it does not move relics back.</p>
   {work.loaded?<p role="status"><strong>{progress.completed} of {progress.total}</strong> required actions complete</p>:<p role="status">Loading checklist…</p>}
   {work.error?<p role="alert">{work.error} <button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>void work.reload()}>Retry</button></p>:null}
   <nav className="review-actions" aria-label="Shuffle steps">{shuffleSections.map((section,index)=><a key={section.id} href={"#shuffle-"+section.id}>Step {index+1}</a>)}</nav>
  </header>
  <MuseumShuffleMissingBoard/>
  {shuffleSections.map(section=><section key={section.id} id={"shuffle-"+section.id} className="museum-admin-panel museum-shuffle__section">
   <h2>{section.title}</h2>
   {section.groups.map(group=><section key={group.id} className="museum-shuffle__group" aria-labelledby={"shuffle-"+group.id}>
    <h3 id={"shuffle-"+group.id}>{group.title}</h3>
    {group.notes.map((note,index)=><p key={index} className={note.startsWith("If the last")?"admin-notice":undefined}>{note}</p>)}
    <ul className="museum-shuffle__actions">{group.actions.map(action=>{
     const busy=work.saving.has(action.id),retry=work.pending[action.id];
     const checked=busy&&retry?retry.completed:completed.has(action.id);
     return <li key={action.id}>
      <label className="room-move__check"><input type="checkbox" checked={checked} disabled={!canEdit||!work.permitted||!work.loaded||busy||!!retry} onChange={event=>event.target.checked&&work.physicalActionIds.includes(action.id)?void confirmMove(action.id):void work.save(action.id,event.target.checked)}/><span>{action.text.includes(":")?<><strong>{action.text.split(":")[0]}:</strong>{action.text.slice(action.text.indexOf(":")+1)}</>:action.text}{action.note?<small className="muted">To-do: {action.note}</small>:null}{action.conditional?<small className="muted">Conditional · not counted in required progress</small>:null}</span></label>
      {busy?<small role="status">Saving…</small>:null}
      {checked&&work.physicalActionIds.includes(action.id)&&!work.states[action.id]?.physicalReceiptId?<button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={!canEdit||!work.permitted||busy||!!retry} onClick={()=>void confirmMove(action.id)}>Confirm move</button>:null}
      {work.errors[action.id]?<p role="alert">{work.errors[action.id]} {retry?<button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={busy} onClick={()=>void work.save(action.id,retry.completed)}>Retry save</button>:null}</p>:null}
     </li>;
    })}</ul>
   </section>)}
  </section>)}
 {confirm?<MuseumDetailDialog titleId="shuffle-confirm-title" kicker="Record move" closeLabel="Close move confirmation" onClose={()=>{if(!confirming)setConfirm(null);}}>
   <h2 id="shuffle-confirm-title">{confirm.preview?.alreadyAtTarget?"Confirm this step is complete":"Confirm these relics are in place"}</h2>
   {confirm.error?<p role="alert">{confirm.error} <button type="button" onClick={()=>void confirmMove(confirm.id)}>Retry</button></p>:!confirm.preview?<p role="status">Loading current locations…</p>:<>
    <ul>{confirm.preview.records.map(record=><li key={record.sourceId}><strong>{record.name}</strong><p>{record.from?.label??"Location not recorded"} → {record.to.label}</p>{record.bottomShelfRequired?<small>Bottom shelf</small>:null}</li>)}</ul>
    <button type="button" className="museum-admin-button" disabled={confirming||!!work.pending[confirm.id]} onClick={()=>void saveMove()}>{confirming?"Saving…":confirm.preview.alreadyAtTarget?"Confirm checklist":"Confirm moved"}</button>
    {work.errors[confirm.id]?<p role="alert">{work.errors[confirm.id]} {work.pending[confirm.id]?<button type="button" disabled={confirming||work.saving.has(confirm.id)} onClick={()=>void saveMove()}>Retry save</button>:<button type="button" onClick={()=>void confirmMove(confirm.id)}>Refresh locations</button>}</p>:null}
   </>}
  </MuseumDetailDialog>:null}
 </section>;
}
