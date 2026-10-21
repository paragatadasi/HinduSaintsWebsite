"use client";
import {useState} from "react";
import {MuseumPlanSaintOverview} from "./museum-plan-saint-overview";
import {isFlexible,type PlannerData} from "@/lib/museum-move-planner-domain";

export function MuseumPlanSearch({data,onVitrine,onSection,stayInPlace=false}:{stayInPlace?:boolean;data:PlannerData;onVitrine:(number:string)=>void;onSection:(name:string)=>void}) {
 const [query,setQuery]=useState("");
 const [saint,setSaint]=useState<{id:string;name:string}|null>(null);
 const terms=query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
 const matches=terms.length?data.rows.filter(row=>terms.every(term=>row.name.toLocaleLowerCase().includes(term))).sort((a,b)=>a.name.localeCompare(b.name)):[];
 return <section className="museum-planner__surface admin-stack" aria-label="Find a saint in the saved plan">
  <div className="museum-planning-heading"><p className="eyebrow">Explore destinations</p><h2>Find a saint</h2><p>Find a saint’s section and planned vitrines without changing the arrangement.</p></div>
  <label className="admin-field"><span>Saint name</span><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search any saint’s name"/></label>
  {terms.length?<><p role="status">{matches.length} {matches.length===1?"saint":"saints"} found{matches.length>30?" · Showing the first 30; refine the name for more specific results":""}.</p>
   <div className="admin-stack">{matches.slice(0,30).map(row=><article key={row.id} className="museum-planning-card admin-stack">
    <h3>{row.name}</h3><div className="review-actions">
    {row.status!=="Proposed"?<button type="button" className="museum-admin-button" onClick={()=>onVitrine(row.vitrine)}>{row.status} · Vitrine {row.vitrine}{row.shelf?` / ${row.shelf}`:""}</button>:isFlexible(row)?<><span>Flexible within:</span>{row.flexibleVitrines!.map(number=><button type="button" key={number} className="museum-admin-button museum-admin-button--secondary" onClick={()=>onVitrine(number)}>Vitrine {number}</button>)}</>:<span>{stayInPlace?"Stay in current location · No move in this proposal":"No destination assigned yet"}</span>}
    <button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>onSection(row.section)}>{row.section}</button>
    <button type="button" className="museum-admin-button museum-admin-button--secondary" aria-haspopup="dialog" onClick={()=>setSaint({id:row.saintId,name:row.name})}>Saint details</button></div>
    {row.arrangementNeedsReview?<p>Review the destination after the proposal change.</p>:null}
   </article>)}</div>
  </>:null}
  {saint?<MuseumPlanSaintOverview key={saint.id} saintId={saint.id} name={saint.name} onClose={()=>setSaint(null)}/>:null}
 </section>;
}
