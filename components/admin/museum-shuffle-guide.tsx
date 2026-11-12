"use client";
import React from "react";
import {shuffleSections,shuffleGuideIntro,shuffleProgress} from "@/lib/spn-shuffle-guide";
import {useMuseumShuffle} from "./use-museum-shuffle";

export function MuseumShuffleGuide({canEdit}:{canEdit:boolean}){
 const work=useMuseumShuffle();
 const completed=new Set(Object.values(work.states).filter(action=>action.completed).map(action=>action.actionId));
 const progress=shuffleProgress(completed);
 return <section className="museum-shuffle" aria-label="Shuffle Guide">
  <header className="museum-admin-panel">
   <div className="section-heading"><h2>Shuffle Guide</h2><button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>void work.reload()}>Refresh</button></div>
   <p>{shuffleGuideIntro}</p>
   <p className="muted">Checks are shared with the team. They track this checklist; recorded relic locations stay unchanged.</p>
   {work.loaded?<p role="status"><strong>{progress.completed} of {progress.total}</strong> required actions complete</p>:<p role="status">Loading checklist…</p>}
   {work.error?<p role="alert">{work.error} <button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>void work.reload()}>Retry</button></p>:null}
   <nav className="review-actions" aria-label="Shuffle steps">{shuffleSections.map((section,index)=><a key={section.id} href={"#shuffle-"+section.id}>Step {index+1}</a>)}</nav>
  </header>
  {shuffleSections.map(section=><section key={section.id} id={"shuffle-"+section.id} className="museum-admin-panel museum-shuffle__section">
   <h2>{section.title}</h2>
   {section.groups.map(group=><section key={group.id} className="museum-shuffle__group" aria-labelledby={"shuffle-"+group.id}>
    <h3 id={"shuffle-"+group.id}>{group.title}</h3>
    {group.notes.map((note,index)=><p key={index} className={note.startsWith("If the last")?"admin-notice":undefined}>{note}</p>)}
    <ul className="museum-shuffle__actions">{group.actions.map(action=>{
     const busy=work.saving.has(action.id),retry=work.pending[action.id];
     const checked=busy&&retry?retry.completed:completed.has(action.id);
     return <li key={action.id}>
      <label className="room-move__check"><input type="checkbox" checked={checked} disabled={!canEdit||!work.permitted||!work.loaded||busy||!!retry} onChange={event=>void work.save(action.id,event.target.checked)}/><span>{action.text.includes(":")?<><strong>{action.text.split(":")[0]}:</strong>{action.text.slice(action.text.indexOf(":")+1)}</>:action.text}{action.conditional?<small className="muted">Conditional · not counted in required progress</small>:null}</span></label>
      {busy?<small role="status">Saving…</small>:null}
      {work.errors[action.id]?<p role="alert">{work.errors[action.id]} {retry?<button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={busy} onClick={()=>void work.save(action.id,retry.completed)}>Retry save</button>:null}</p>:null}
     </li>;
    })}</ul>
   </section>)}
  </section>)}
 </section>;
}
