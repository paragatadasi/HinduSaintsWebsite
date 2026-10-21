"use client";
import {useState} from "react";
import Link from "next/link";
import type {Route} from "next";
import {isFlexible,type PlannerData} from "@/lib/museum-move-planner-domain";

export function MuseumPlanSearch({data,onVitrine,onSection}:{data:PlannerData;onVitrine:(number:string)=>void;onSection:(name:string)=>void}) {
 const [query,setQuery]=useState("");
 const terms=query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
 const matches=terms.length?data.rows.filter(row=>terms.every(term=>row.name.toLocaleLowerCase().includes(term))).sort((a,b)=>a.name.localeCompare(b.name)):[];
 return <section className="museum-planner__surface admin-stack" aria-label="Find a saint in the saved plan">
  <label className="admin-field"><span>Find a saint in the plan</span><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search any saint’s name"/></label>
  {terms.length?<><p role="status">{matches.length} {matches.length===1?"saint":"saints"} found{matches.length>30?" · Showing the first 30; refine the name for more specific results":""}.</p>
   <div className="admin-stack">{matches.slice(0,30).map(row=><article key={row.id} className="museum-planning-card admin-stack">
    <h3>{row.name}</h3><div className="review-actions"><button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>onSection(row.section)}>{row.section}</button>
    {row.status!=="Proposed"?<button type="button" className="museum-admin-button" onClick={()=>onVitrine(row.vitrine)}>{row.status} · Vitrine {row.vitrine}{row.shelf?` / ${row.shelf}`:""}</button>:isFlexible(row)?<><span>Flexible within:</span>{row.flexibleVitrines!.map(number=><button type="button" key={number} className="museum-admin-button museum-admin-button--secondary" onClick={()=>onVitrine(number)}>Vitrine {number}</button>)}</>:<span>No destination assigned yet</span>}
    <Link href={`/vrindavanadmin?q=${encodeURIComponent(row.name)}` as Route}>Saint details</Link></div>
    {row.arrangementNeedsReview?<p>Review the destination after the proposal change.</p>:null}
   </article>)}</div>
  </>:null}
 </section>;
}
