"use client";
import {useState} from "react";
import {AdminViewTabs} from "./admin-view-tabs";
import {MuseumRoomPlan} from "./museum-room-plan";
import {spnMuseumLayout} from "@/lib/spn-museum-layout";
import {displayMoveStatus,emptyMoveFilters,filterRoomMoveDisplays,type RoomMoveDisplay,type MoveFilters} from "@/lib/spn-room-move-domain";

type Tab="room"|"tables"|"find";
export function SpnRoomMoveCompanion({rows,title,proposalVersion}:{rows:RoomMoveDisplay[];title:string;proposalVersion:string}){
 const [tab,setTab]=useState<Tab>("room"),[selected,setSelected]=useState<string[]>([]),[filters,setFilters]=useState({...emptyMoveFilters});
 const [limit,setLimit]=useState(50);
 const staged=rows.filter(r=>r.current?.kind==="table");
 const tableNames=[...new Set(staged.map(r=>r.current!.code))];
 function select(number:string){setSelected(old=>old.includes(number)?old.filter(n=>n!==number):[...old,number]);}
 function filter(key:keyof MoveFilters,value:string){setFilters(old=>({...old,[key]:value,...(key==="region"?{section:""}:{})}));setLimit(50);}
 const results=filterRoomMoveDisplays(rows,filters);
 function picker(key:keyof MoveFilters,label:string,values:string[]){
  return <label className="admin-field"><span>{label}</span><select value={filters[key]} onChange={e=>filter(key,e.target.value)}><option value="">All</option>{[...new Set(values.filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})).map(value=><option key={value}>{value}</option>)}</select></label>;
 }
 function displayList(items:RoomMoveDisplay[],preserveOrder=false){
  return <div className="room-move__displays">{(preserveOrder?items:filterRoomMoveDisplays(items,emptyMoveFilters)).map(row=><article key={row.id} className="room-move__display">
   <div><p className="eyebrow">{row.tier==="Featured"?"Primary":row.tier}</p><h3>{row.name}</h3><p className="muted">{row.section}{row.region?" · "+row.region:""}</p></div>
   <div><small>{row.currentBasis==="confirmed"?"Current location":"Last recorded location"}</small><strong>{row.current?.label??"Location not recorded"}</strong><p>Destination: {row.destination?"Vitrine "+row.destination:"Not assigned"}</p><small>{displayMoveStatus(row)}</small></div>
   <details><summary>Location details</summary><p>Original recorded location: {row.original?.label??"Not recorded"}</p><p>{row.currentBasis==="source"?"Based on the supplied museum records; no later move has been confirmed.":row.currentBasis==="unknown"?"Check the location before moving this display.":"Updated by a recorded physical confirmation."}</p>{row.holdReason?<p role="note">{row.holdReason}</p>:null}{row.history.length?<ol>{row.history.map((loc,index)=><li key={index}>{loc.label}</li>)}</ol>:null}<small>Record: {row.sourceId}</small></details>
  </article>)}</div>;
 }
 return <div className="room-move admin-stack">
  <header><p className="eyebrow">SPN · Move companion</p><h1>Clear a space. Bring its families home.</h1><p>Work by vitrine, at your own pace.</p><p className="muted">{title} · {proposalVersion}</p></header>
  <p className="admin-notice">Preparation view. Explore recorded locations and proposed destinations here. Physical move recording and reviewed guidance are being connected; nothing on this screen changes museum locations.</p>
  <AdminViewTabs<Tab> label="Move companion tools" value={tab} onChange={setTab} options={[{value:"room",label:"Clear & refill"},{value:"tables",label:"Staging tables"},{value:"find",label:"Find a display"}]}/>
  {tab==="room"?<div className="room-move__workspace"><div className="admin-stack">
   <section className="museum-admin-panel"><p className="eyebrow">Your working area</p><h2>Which vitrines are you working on?</h2><p>Select one or several to see their recorded contents and proposed replacements.</p>
   <MuseumRoomPlan layout={spnMuseumLayout} mode="browse" selected={selected} multiple onSelect={select}/>
   <div className="review-actions"><p>{selected.length?selected.map(n=>"Vitrine "+n).join(" · "):"Select a vitrine on the map."}</p>{selected.length?<button className="museum-admin-button museum-admin-button--secondary" onClick={()=>setSelected([])}>Clear selection</button>:null}</div>
   <p className="muted">Future vitrines are for reference only. Vitrines 30 and 31 hold walking sticks only.</p></section>
   <section className="museum-admin-panel"><p className="eyebrow">Bring into your selected vitrines</p><h2>What goes here</h2>{!selected.length?<p>Select a vitrine above to see its proposed contents and where to find them.</p>:selected.map(n=>{
    const incoming=rows.filter(r=>r.destination===n),outgoing=rows.filter(r=>r.current?.kind==="vitrine"&&r.current.code===n&&r.destination!==n);
    return <section key={n} className="room-move__arrival"><h3>Vitrine {n}</h3><p>{incoming.length} proposed display records · {outgoing.length} recorded here with a different destination</p>
    {spnMuseumLayout.vitrines.find(v=>v.number===n)?.availability==="future"?<p>Future space. Not available for this move.</p>:null}
    {outgoing.length?<details><summary>Recorded here, proposed elsewhere ({outgoing.length})</summary>{displayList(outgoing)}</details>:null}
    {incoming.length?displayList(incoming):<p>No destination assignments in this proposal. This does not mean the vitrine is empty.</p>}</section>;
   })}</section></div>
   <aside className="admin-stack"><section className="museum-admin-panel"><p className="eyebrow">Staging</p><h2>On the tables</h2>{staged.length?<><p>{staged.length} display records</p><button className="museum-admin-button museum-admin-button--secondary" onClick={()=>setTab("tables")}>See staging tables</button></>:<p>No staging locations recorded. Table tracking will appear here when a move session starts.</p>}</section>
   <section className="museum-admin-panel"><p className="eyebrow">Optional guidance</p><h2>Suggested order</h2><p>Reviewed move batches will appear here as the guidance is prepared.</p><p className="muted">Proposed destinations are not instructions to move an object before its space and restrictions are checked.</p></section></aside></div>:null}
  {tab==="tables"?<section className="museum-admin-panel"><h2>Staging tables</h2>{tableNames.length?tableNames.map(code=><section key={code}><h3>{staged.find(r=>r.current?.code===code)?.current?.label}</h3>{displayList(staged.filter(r=>r.current?.code===code))}</section>):<p>No staging locations recorded yet.</p>}</section>:null}
  {tab==="find"?<section className="museum-admin-panel"><h2>Find a display</h2><div className="room-move__filters"><label className="admin-field"><span>Search saint, family or record</span><input type="search" value={filters.query} onChange={e=>filter("query",e.target.value)}/></label><label className="admin-field"><span>Sort by</span><select value={filters.sort} onChange={e=>filter("sort",e.target.value)}><option value="tier">Primary → secondary → tertiary</option><option value="name">Saint name</option><option value="current">Current location</option></select></label></div>
   <details open><summary>Filter displays</summary><div className="room-move__filters">{picker("start","Original vitrine",rows.map(r=>r.original?.code??""))}{picker("current","Current location",rows.map(r=>r.current?.code??""))}{picker("destination","Destination vitrine",rows.map(r=>r.destination))}{picker("region","Region",rows.map(r=>r.region))}{picker("section","Section",rows.filter(r=>!filters.region||r.region===filters.region).map(r=>r.section))}{picker("tier","Priority",rows.map(r=>r.tier))}{picker("status","Status",rows.map(displayMoveStatus))}</div></details>
   <button className="museum-admin-button museum-admin-button--secondary" onClick={()=>{setFilters({...emptyMoveFilters});setLimit(50);}}>Clear filters</button><p role="status">{results.length} matching display records</p>{displayList(results.slice(0,limit),true)}{!results.length?<p>No matching displays. Try clearing the filters.</p>:null}{results.length>limit?<button className="museum-admin-button" onClick={()=>setLimit(old=>old+50)}>Show more displays</button>:null}</section>:null}
 </div>;
}
