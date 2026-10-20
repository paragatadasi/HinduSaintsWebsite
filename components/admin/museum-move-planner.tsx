"use client";
import {useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import type {Route} from "next";
import {Camera} from "lucide-react";
import {plannerCounts,vrindavanVitrines,type PlannerData,type PlannerRow} from "@/lib/museum-move-planner-domain";
import {assignMovePlanAction} from "@/app/vrindavanadmin/plan/actions";
import {MuseumRoomPlan} from "./museum-room-plan";
import {MuseumMoveList} from "./museum-move-list";

function Counts({rows,configured}:{rows:PlannerRow[];configured:boolean}){
 const counts=plannerCounts(rows);
 return <span className="museum-planner__counts"><span>{counts.total} saints</span>{configured?<><span><Camera aria-hidden="true"/> {counts.photo} photo</span><span>{counts.untagged} without photo tag</span></>:<span>Photo data pending</span>}<span>{counts.unplanned} to plan</span></span>;
}
export function MuseumMovePlanner({data,canEdit}:{data:PlannerData;canEdit:boolean}){
 const router=useRouter();
 const [view,setView]=useState<"plan"|"checklist">("plan");
 const [section,setSection]=useState(data.sections[0]?.name||"");
 const [sectionMenuOpen,setSectionMenuOpen]=useState(false);
 const [selected,setSelected]=useState<string[]>([]);
 const [destination,setDestination]=useState("");
 const [filter,setFilter]=useState("");
 const [error,setError]=useState(""),[message,setMessage]=useState("");
 const [pending,startTransition]=useTransition();
 const rows=data.rows.filter(row=>row.section===section);
 const chosen=rows.filter(row=>selected.includes(row.id));
 const targetRows=data.rows.filter(row=>row.vitrine===destination&&row.status!=="Proposed");
 const counts=Object.fromEntries(vrindavanVitrines.map(number=>[number,data.rows.filter(row=>row.vitrine===number&&row.status!=="Proposed").length]));
 const chooseSection=(name:string)=>{setSection(name);setSelected(data.rows.filter(row=>row.section===name&&row.status==="Proposed").map(row=>row.id));setFilter("");setMessage("");setSectionMenuOpen(false);};
 const toggle=(id:string)=>setSelected(current=>current.includes(id)?current.filter(value=>value!==id):[...current,id]);
 const save=(action:()=>Promise<{error:string}>,success:string)=>{
  setError("");setMessage("");
  startTransition(async()=>{try{const result=await action();if(result.error)setError(result.error);else{setMessage(success);setSelected([]);router.refresh();}}catch{setError("The save could not be confirmed. Reload to check the saved plan before trying again.");}});
 };
 return <div className="museum-admin admin-stack museum-planner">
  <header className="section-heading"><div><p className="eyebrow">Vrindavan Museum</p><h1>Plan the move</h1><p>Choose where each section will live, then take the saved plan into the museum.</p></div></header>
  <Counts rows={data.rows} configured={data.photosConfigured}/>
  {error?<p role="alert">{error}</p>:null}{message?<p role="status">{message}</p>:null}
  <div className="review-actions museum-planner__view-switch" role="group" aria-label="Move workspace">
   <button className="museum-admin-button museum-admin-button--secondary" aria-pressed={view==="plan"} onClick={()=>setView("plan")}>Plan destinations</button>
   <button className="museum-admin-button museum-admin-button--secondary" aria-pressed={view==="checklist"} onClick={()=>setView("checklist")}>Move-day checklist</button>
  </div>
  {view==="plan"?<div className="museum-planner__workspace">
   <details className="museum-planner__setup" open={sectionMenuOpen} onToggle={event=>setSectionMenuOpen(event.currentTarget.open)}><summary>Choose a section · {section}</summary><div className="museum-planner__sections" aria-label="Sections to arrange">
    {data.sections.map(item=><button type="button" className="museum-planner__section" key={item.name} aria-pressed={section===item.name} onClick={()=>chooseSection(item.name)}>
     <strong>{item.name}</strong><Counts rows={data.rows.filter(row=>row.section===item.name)} configured={data.photosConfigured}/>
    </button>)}
   </div></details>
   <section className="admin-stack" aria-label="Destination planning">
    <div className="museum-planner__surface"><h2>{section}</h2><p>{data.sections.find(item=>item.name===section)?.idea}</p>
     <p><strong>Primary saints:</strong> {rows.filter(row=>row.tier==="Featured").map(row=>row.name).join(" · ")||"No primary saints designated"}</p>
     <Counts rows={rows} configured={data.photosConfigured}/>
     <Link href={`/vrindavanadmin/sections?section=${data.sections.find(item=>item.name===section)?.slug||""}` as Route}>Explore section and family trees</Link>
    </div>
    <div className="museum-planner__destination"><div><h3>Destination vitrine</h3><MuseumRoomPlan selected={destination?[destination]:[]} counts={counts} disabled={!canEdit||pending} onSelect={setDestination}/><p className="muted">Room arrangement from your sketch; not to scale. Counts are saints, not a space-capacity estimate.</p></div>
     <div className="admin-stack"><h3>{destination?`Vitrine ${destination}${destination==="0"?" · Temple hall":""}`:"Choose a numbered vitrine"}</h3>
      {destination?<><Counts rows={targetRows} configured={data.photosConfigured}/><p>{[...new Set(targetRows.map(row=>row.section))].join(" · ")||"No saints assigned yet."}</p></>:null}
      <p>A section can span several vitrines. Choose a subset below, save it, then assign the remaining saints.</p>
     </div>
    </div>
    <form className="museum-planner__surface admin-stack" onSubmit={event=>{event.preventDefault();const form=new FormData(event.currentTarget);save(()=>assignMovePlanAction({revision:data.revision,placementIds:selected,vitrine:destination,shelf:String(form.get("shelf")||""),replaceExisting:form.get("replaceExisting")==="on"}),`${selected.length} saints planned for vitrine ${destination}.`);}}>
     <fieldset disabled={!canEdit||pending} className="admin-field form-stack">
      <legend><h3>Choose saints to assign</h3></legend>
      <div className="review-actions"><button className="museum-admin-button museum-admin-button--secondary" type="button" onClick={()=>setSelected(rows.map(row=>row.id))}>Whole section</button><button className="museum-admin-button museum-admin-button--secondary" type="button" onClick={()=>setSelected(rows.filter(row=>row.status==="Proposed").map(row=>row.id))}>Unplanned only</button><button className="museum-admin-button museum-admin-button--secondary" type="button" onClick={()=>setSelected([])}>Clear selection</button></div>
      <label>Find within this section<input value={filter} onChange={event=>setFilter(event.target.value)} type="search"/></label>
      <div className="museum-planner__members">{rows.filter(row=>`${row.name} ${row.family}`.toLowerCase().includes(filter.toLowerCase())).map(row=><label className="museum-planner__member" key={row.id}>
       <input type="checkbox" checked={selected.includes(row.id)} onChange={()=>toggle(row.id)}/>
       <span><strong>{row.name}</strong>{row.family?<small>{row.family}</small>:null}<small>{row.photo?"Photo saint · ":""}{row.status==="Proposed"?"No destination yet":`${row.status} · Vitrine ${row.vitrine}${row.shelf?` / ${row.shelf}`:""}`}{row.needsResearch?" · Research flagged":""}</small></span>
      </label>)}</div>
      <p><strong>{chosen.length} selected</strong>{chosen.some(row=>row.family)?` · ${chosen.filter(row=>row.photo).length} photo saints`:""}</p>
      <label>Shelf / position (optional)<input name="shelf" maxLength={100} placeholder="Can be decided during the move"/></label>
      {chosen.some(row=>row.status!=="Proposed")?<label><input type="checkbox" name="replaceExisting" required/> Replace the existing destination for the selected planned or implemented saints.</label>:null}
      <button type="submit" className="museum-admin-button" disabled={!selected.length||!destination||section==="Needs section proposal"}>{pending?"Saving…":`Plan ${selected.length||"selected"} saints${destination?` → Vitrine ${destination}`:""}`}</button>
      {section==="Needs section proposal"?<p>Choose a section proposal in the saint’s card before assigning a destination.</p>:null}
     </fieldset>
    </form>
   </section>
  </div>:<MuseumMoveList data={data} canEdit={canEdit}/>}
  <details className="museum-planner__setup"><summary>Inventory coverage</summary><p>{data.awaitingIdentityReview} source entries still await saint identity review and are not included in these assignments.</p>{data.unmappedLocations.length?<p>Locations outside the numbered map: {data.unmappedLocations.join(", ")}. These remain visible in the move list.</p>:null}<p>The source inventory can group several relics in one entry. Photo tags and counts assist planning; they do not measure available shelf space.</p></details>
 </div>;
}
