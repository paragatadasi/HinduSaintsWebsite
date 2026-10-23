"use client";
import {useState} from "react";
import Link from "next/link";
import {MuseumRoomPlan} from "./museum-room-plan";
import {destinationEligibility,type MuseumRoomLayout} from "@/lib/museum-room-layout";
import type {LocationBrowserRow} from "@/lib/museum-location-browser";

export function MuseumLayoutWorkspace({layout,rows,collisions}:{layout:MuseumRoomLayout;rows:LocationBrowserRow[];collisions:string[]}){
 const [selected,setSelected]=useState<string|null>(null),[view,setView]=useState<"map"|"list">("map"),[query,setQuery]=useState("");
 const active=layout.vitrines.find(v=>v.number===selected);
 const contents=rows.filter(r=>r.vitrine===selected);
 const current=contents.filter(r=>!r.sourceOnly),source=contents.filter(r=>r.sourceOnly);
 const knownNumbers=new Set(layout.vitrines.map(v=>v.number));
 const outside=[...new Set(rows.filter(r=>r.vitrine&&!knownNumbers.has(r.vitrine)).map(r=>r.vitrine))];
 const options=layout.vitrines.filter(v=>!query.trim()||`${v.number} ${v.position} ${v.availability} ${v.restriction==="walking_sticks"?"walking sticks":""}`.toLowerCase().includes(query.trim().toLowerCase()));
 const summary=active?destinationEligibility(active):null;
 return <div className="museum-planner admin-stack">
  <header className="museum-planning-heading"><p className="eyebrow">SPN museum</p><h1>Plan the move</h1><p>Start with the room. Explore the vitrines and their recorded contents before arranging sections.</p></header>
  <div className="review-actions"><span aria-current="page">Museum layout</span><Link className="museum-admin-button museum-admin-button--secondary" href="/museumadmin" prefetch={false}>Section proposals</Link><Link className="museum-admin-button museum-admin-button--secondary" href="/museumadmin/locations" prefetch={false}>Vitrines and shelves</Link></div>
  <section className="museum-admin-panel admin-stack">
   <div className="museum-planning-heading"><p className="eyebrow">The space for this reorganization</p><h2>Museum layout</h2><p>Transcribed from the team’s sketch. Positions show adjacency, not measured size or capacity.</p></div>
   <dl className="museum-planning-stats"><div><dd>{layout.vitrines.filter(v=>v.availability!=="future").length}</dd><dt>Current vitrines</dt></div><div><dd>{layout.vitrines.filter(v=>v.availability==="new").length}</dd><dt>New for this reorganization</dt></div><div><dd>{layout.vitrines.filter(v=>v.availability==="future").length}</dd><dt>Future spaces</dt></div></dl>
   <p className="muted">New vitrines are expected to be generally empty; an empty list is not proof of an empty vitrine. Numbers with * are provisional layout labels, not newly created inventory locations.</p>
   {collisions.length?<p role="alert">Provisional labels {collisions.join(", ")} already appear in recorded SPN locations. Review their numbers before using them as destinations. This layout has not renumbered any records.</p>:null}
   <div className="review-actions"><label className="admin-field">Find a vitrine<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Number, new, future or sticks"/></label><button type="button" className="museum-admin-button museum-admin-button--secondary" aria-pressed={view==="map"} onClick={()=>setView("map")}>Map</button><button type="button" className="museum-admin-button museum-admin-button--secondary" aria-pressed={view==="list"} onClick={()=>setView("list")}>List</button></div>
   {query.trim()?<div className="review-actions" aria-label="Matching vitrines">{options.map(v=><button className="museum-admin-button museum-admin-button--secondary" type="button" key={v.id} onClick={()=>setSelected(v.number)}>Vitrine {v.number}{v.provisional?"*":""}</button>)}{!options.length?<p>No matching vitrines.</p>:null}</div>:null}
   <div className="museum-layout-legend"><span>Green outline: new</span><span>Dashed outline: future, unavailable now</span><span>Gold outline / Sticks: walking sticks only</span><span>* Provisional number</span></div>
   <div className="museum-layout-workspace">
    {view==="map"?<MuseumRoomPlan layout={layout} mode="browse" selected={selected?[selected]:[]} onSelect={setSelected}/>:<div className="museum-layout-list">{options.map(v=><button type="button" className="museum-admin-button museum-admin-button--secondary" aria-pressed={selected===v.number} key={v.id} onClick={()=>setSelected(v.number)}><span>Vitrine {v.number}{v.provisional?"*":""}<br/><small>{v.position}<br/>{v.availability}{v.restriction==="walking_sticks"?" · Walking sticks only":""}</small></span></button>)}</div>}
    <section className="museum-admin-panel admin-stack" aria-live="polite" aria-label="Selected vitrine">
     {active?<><div className="museum-planning-heading"><p className="eyebrow">{active.availability==="future"?"Future space":active.availability==="new"?"New vitrine":"Vitrine details"}</p><h2>Vitrine {active.number}{active.provisional?"*":""}</h2><p>{active.position}</p></div>
      {active.restriction==="walking_sticks"?<p><strong>Walking sticks only.</strong> Other relics cannot be assigned here.</p>:null}
      {active.availability==="future"?<p><strong>Unavailable for the current reorganization.</strong> Kept on the map for later planning.</p>:<p>{summary?.reason}</p>}
      {active.provisional?<p className="muted">Provisional number assigned to the sketch’s “{active.sourceLabel}” space. Confirm the label before creating inventory locations.</p>:null}
      {collisions.includes(active.number)?<p role="alert">Number collision: the records below may belong to a different location using this number.</p>:null}
      <h3>Recorded contents</h3><p>{current.length} inventory items · {source.length} source-only saint locations</p>
      {!contents.length?<p>No recorded contents found for this number. Check the vitrine in person.</p>:<ul className="admin-stack">{contents.map(row=><li key={row.key}><strong>{row.label}</strong><br/><span>{row.shelf?`Shelf ${row.shelf}`:"Shelf not recorded"} · {row.sourceOnly?"Source location, unverified":"Inventory location"}</span>{row.sections.length?<p className="muted">{row.sections.join(" · ")}</p>:null}</li>)}</ul>}
      <Link className="museum-admin-button museum-admin-button--secondary" href={{pathname:"/museumadmin/locations",query:{vitrine:active.number}}} prefetch={false}>Open vitrine records</Link>
     </>:<><p className="eyebrow">Explore the layout</p><h2>Select a vitrine</h2><p>See its restrictions and recorded contents here. Clicking the map does not move or assign anything.</p><p>The entrance is at the bottom right; Babaji cave is beyond the top of the upper room.</p></>}
    </section>
   </div>
   <details><summary>Provisional numbering</summary><p>Number 69 is retained from the sketch. Unnumbered new vitrines use 70–82; future spaces use 83–85. These labels do not overwrite existing source numbers.</p><ul>{layout.vitrines.filter(v=>v.provisional).map(v=><li key={v.id}><strong>{v.number}*</strong> — {v.position}{v.availability==="future"?" · Future":""}</li>)}</ul></details>
   {outside.length?<p>Recorded vitrine numbers outside this sketch: {outside.join(", ")}. These records remain available in Vitrines and shelves.</p>:null}
   <p className="muted">This first planning step records the layout and constraints. Saved section assignments and an SPN move checklist will build on this layout.</p>
  </section>
 </div>;
}
