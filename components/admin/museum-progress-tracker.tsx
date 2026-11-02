"use client";
import {useEffect,useMemo,useState} from "react";
import type {FinalReviewDecision} from "@/lib/museum-vitrine-progress";
import {museumProgressSummary} from "@/lib/museum-progress-summary";
import type {CompanionPhase} from "@/lib/museum-companion-navigation";
import type {StarterMoveGuide,CompanionRow,GuideDecision} from "@/lib/spn-move-guide";
import {useMuseumReads} from "./museum-read-context";

type Counts={total:number;addressed:number;deferred:number};
const percent=(p:Counts)=>p.total?Math.round(100*p.addressed/p.total):0;
function Fill({counts}: {counts:Counts}){
 const done=counts.total?100*counts.addressed/counts.total:0;
 const deferred=counts.total?100*counts.deferred/counts.total:0;
 return <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none"><rect className="museum-vitrine-progress__done" width={done} height="100"/><rect className="museum-vitrine-progress__deferred" x={done} width={deferred} height="100"/></svg>;
}
function Summary({counts}:{counts:Counts}){
 return <><strong className="museum-progress__percent">{percent(counts)}%</strong><span>{counts.addressed} of {counts.total} records addressed · {counts.deferred} deferred</span><div className="museum-progress__bar museum-vitrine-progress"><Fill counts={counts}/></div></>;
}
export function MuseumProgressTracker({guides,rows,disabled,onOpen,reviewDecisions=[]}:{guides?:Record<CompanionPhase,StarterMoveGuide>;rows:CompanionRow[];reviewDecisions?:FinalReviewDecision[];disabled:boolean;onOpen:(phase:CompanionPhase,code:string)=>void}){
 const reads=useMuseumReads();
 const [decisions,setDecisions]=useState<Record<string,GuideDecision[]>|null>(null);
 const [error,setError]=useState("");const [refresh,setRefresh]=useState(0);
 const versions=JSON.stringify([...new Set(Object.values(guides??{}).map(g=>g.version))].sort());
 useEffect(()=>{
  if(!guides)return;
  let cancelled=false;
  const load=()=>{const params=new URLSearchParams({view:"progress",museumId:"museum-spn"});for(const version of JSON.parse(versions))params.append("guideVersion",version);
   void reads.read<{decisions:Record<string,GuideDecision[]>}>("/api/admin/museum-guide-decisions?"+params,true).then(data=>{if(!cancelled){setDecisions(data.decisions);setError("");}}).catch(()=>{if(!cancelled)setError("Progress could not refresh. Try again.");});};
  setDecisions(null);load();window.addEventListener("focus",load);
  return()=>{cancelled=true;window.removeEventListener("focus",load);};
 },[versions,reads,refresh,!!guides]);
 const progress=useMemo(()=>guides&&decisions?museumProgressSummary(guides,rows,decisions,reviewDecisions):null,[guides,rows,decisions,reviewDecisions]);
 return <section className="museum-admin-panel museum-progress" aria-label="Move progress">
  <div className="section-heading"><h2>Move progress</h2><button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>setRefresh(n=>n+1)}>Refresh progress</button></div>
  {error?<p role="alert">{error}</p>:null}
  {!progress?<p role="status">Loading progress across the museum…</p>:<>
   <div className="museum-progress__summary"><Summary counts={progress}/><small className="muted">Available move guides · Addressed = placed, declined or not on display.</small></div>
   {progress.total===0?<p>No records are assigned in the available guides.</p>:null}
   {progress.regions.map(region=><section className="museum-progress__region" key={region.value} aria-label={region.label}>
    <h3>{region.label}</h3><div className="museum-progress__summary"><Summary counts={region}/></div>
    <div className="room-move__phase">{region.vitrines.map(v=><button key={v.code} type="button" className="museum-admin-button museum-admin-button--secondary museum-vitrine-progress museum-progress__vitrine" disabled={disabled} onClick={()=>onOpen(v.owner,v.code)} aria-label={`Vitrine ${v.code}: ${v.addressed} of ${v.total} addressed, ${v.deferred} deferred. Open guide.`}><Fill counts={v}/><span>Vitrine {v.code}</span><small>{v.total?`${percent(v)}% · ${v.addressed}/${v.total}`:"No assignments"}</small>{v.deferred?<small>{v.deferred} deferred</small>:null}</button>)}</div>
   </section>)}
  </>}
 </section>;
}
