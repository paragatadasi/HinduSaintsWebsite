"use client";
import {useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import type {Route} from "next";
import {Camera,GripVertical,Users,X} from "lucide-react";
import {plannerCounts,plannerFamilies,plannerAreasNeedingReview,isFlexible,vrindavanVitrines,type PlannerData,type PlannerRow} from "@/lib/museum-move-planner-domain";
import {assignMovePlanAction,saveSectionAreaAction,saveFlexiblePlanAction} from "@/app/vrindavanadmin/plan/actions";
import {MuseumSectionDragButton} from "./museum-section-drag-button";
import {MuseumRoomPlan} from "./museum-room-plan";
import {MuseumSaintTree} from "./museum-live-trees";
import {MuseumDetailDialog} from "./museum-detail-dialog";
import {MuseumMoveList} from "./museum-move-list";

function Counts({rows,configured}:{rows:PlannerRow[];configured:boolean}){
 const counts=plannerCounts(rows);
 return <span className="museum-planner__counts"><span>{counts.total} {counts.total===1?"saint":"saints"}</span>{configured?<><span><Camera aria-hidden="true"/> {counts.photo} photo</span><span>{counts.untagged} without photo tag</span></>:<span>Photo data pending</span>}<span>{counts.unplanned} to plan</span></span>;
}
function familyDestinationSummary(rows:PlannerRow[]){
 const exact=rows.filter(row=>row.status!=="Proposed"),flexible=rows.filter(isFlexible);
 if(exact.length===rows.length&&new Set(exact.map(row=>row.vitrine)).size===1)return `Vitrine ${exact[0].vitrine}`;
 if(flexible.length===rows.length)return `Within vitrines ${flexible[0].flexibleVitrines!.join(", ")} · exact spots flexible`;
 return `${rows.length-exact.length-flexible.length} unassigned · ${exact.length} exact destinations · ${flexible.length} flexible`;
}
function destinationLabel(row:PlannerRow){return isFlexible(row)?`Within vitrines ${row.flexibleVitrines!.join(", ")} · exact spot flexible`:row.status==="Proposed"?"No destination yet":`${row.status} · Vitrine ${row.vitrine}${row.shelf?` / ${row.shelf}`:""}`;}
export function MuseumMovePlanner({data,canEdit}:{data:PlannerData;canEdit:boolean}){
 const router=useRouter();
 const [view,setView]=useState<"plan"|"checklist">("plan");
 const [section,setSection]=useState(data.sections.find(s=>data.rows.some(row=>row.section===s.name))?.name||"");
 const [areaDrafts,setAreaDrafts]=useState<Record<string,string[]>>({});
 const [draftVersions,setDraftVersions]=useState<Record<string,number>>({});
 const [tree,setTree]=useState<{key:string;name:string}|null>(null);
 const [sectionFilter,setSectionFilter]=useState("");
 const [dropVitrine,setDropVitrine]=useState<string|null>(null);
 const [selected,setSelected]=useState<string[]>([]),[destination,setDestination]=useState("");
 const [filter,setFilter]=useState("");
 const [error,setError]=useState(""),[message,setMessage]=useState("");
 const [pending,startTransition]=useTransition();
 const rows=data.rows.filter(row=>row.section===section),chosen=rows.filter(row=>selected.includes(row.id));
 const savedArea=data.areas.find(area=>area.section===section)?.vitrines||[];
 const outsideArea=rows.filter(row=>row.status!=="Proposed"&&!savedArea.includes(row.vitrine));
 const area=areaDrafts[section]??savedArea;
 const areaDirty=JSON.stringify([...area].sort())!==JSON.stringify([...savedArea].sort());

 const counts=Object.fromEntries(vrindavanVitrines.map(number=>[number,data.rows.filter(row=>row.vitrine===number&&row.status!=="Proposed").length]));
 const labels=Object.fromEntries(vrindavanVitrines.map(number=>[number,data.sections.filter(item=>(areaDrafts[item.name]??data.areas.find(a=>a.section===item.name)?.vitrines??[]).includes(number)).map(item=>item.name).sort((a,b)=>a===section?-1:b===section?1:a.localeCompare(b))]));
 const chooseSection=(name:string)=>{setSection(name);setSelected([]);setDestination("");setFilter("");setMessage("");};
 const editArea=(number:string,name=section,addOnly=false)=>{
  if(!canEdit||pending||name==="Needs section proposal"||!data.sections.some(item=>item.name===name))return;
  if(name!==section)chooseSection(name);
  const saved=data.areas.find(a=>a.section===name);
  if(!areaDrafts[name]||JSON.stringify([...areaDrafts[name]].sort())===JSON.stringify([...(saved?.vitrines??[])].sort()))setDraftVersions(current=>({...current,[name]:saved?.version??0}));
  setAreaDrafts(current=>{const values=current[name]??data.areas.find(a=>a.section===name)?.vitrines??[];return {...current,[name]:values.includes(number)?(addOnly?values:values.filter(n=>n!==number)):[...values,number]};});
 };
 const toggle=(id:string)=>setSelected(current=>current.includes(id)?current.filter(value=>value!==id):[...current,id]);
 const selectGroup=(members:PlannerRow[])=>setSelected(current=>{const ids=members.map(row=>row.id);return ids.every(id=>current.includes(id))?current.filter(id=>!ids.includes(id)):[...new Set([...current,...ids])];});
 const save=(action:()=>Promise<{error:string}>,success:string)=>{
  setError("");setMessage("");startTransition(async()=>{try{const result=await action();if(result.error)setError(result.error);else{setMessage(success);setSelected([]);router.refresh();}}catch{setError("The save could not be confirmed. Reload to check the saved plan before trying again.");}});
 };
 const flexibleSave=(members:PlannerRow[],remove=false)=>save(()=>saveFlexiblePlanAction({revision:data.revision,section,placementIds:members.map(row=>row.id),remove}),remove?"Flexible plan removed. These saints need destinations.":`${members.length} saints can be placed within vitrines ${savedArea.join(", ")}. Choose their actual vitrine during the move.`);
 const earlierAreas=plannerAreasNeedingReview(data.areas,data.rows);
 const familyGroups=plannerFamilies(rows);
 const anchors=familyGroups.filter(group=>group.rows.length>1||group.rows.some(row=>row.tier==="Featured"));
 const individuals=familyGroups.filter(group=>group.rows.length===1&&group.rows[0].tier!=="Featured").flatMap(group=>group.rows);
 const tertiary=individuals.filter(row=>row.tier==="Tertiary"&&row.status==="Proposed"&&!isFlexible(row));
 const matches=(name:string)=>name.toLowerCase().includes(filter.toLowerCase());
 const splitFamilies=familyGroups.filter(group=>group.rows.some(row=>selected.includes(row.id))&&!group.rows.every(row=>selected.includes(row.id))&&group.rows.length>1);
 return <div className="museum-admin admin-stack museum-planner">
  <header className="section-heading"><div><p className="eyebrow">Vrindavan Museum</p><h1>{view==="plan"?"Plan the move":"Move companion"}</h1><p>{view==="plan"?"Reserve space for sections, then arrange families and saints within it.":"Find the starting location, check the relics, and confirm their destination."}</p></div></header>
  {view==="plan"?<Counts rows={data.rows} configured={data.photosConfigured}/>:null}
  {error?<p role="alert">{error}</p>:null}{message?<p role="status">{message}</p>:null}
  <div className="review-actions museum-planner__view-switch" role="group" aria-label="Move workspace">
   <button className="museum-admin-button museum-admin-button--secondary" aria-pressed={view==="plan"} onClick={()=>setView("plan")}>Plan destinations</button>
   <button className="museum-admin-button museum-admin-button--secondary" aria-pressed={view==="checklist"} onClick={()=>setView("checklist")}>Move companion</button>
  </div>
  {earlierAreas.length?<details className="museum-planner__surface admin-stack">
   <summary>Earlier saved areas to review ({earlierAreas.length})</summary>
   <p>These saved areas predate changes to the section proposals. They remain here for reference. Exact planned or implemented destinations take precedence.</p>
   <ul>{earlierAreas.map(item=><li key={item.section}>
    <strong>{item.section}</strong> · Vitrines {item.vitrines.join(", ")}
    {item.inactiveSection?<p>No saints currently use this section. Choose the appropriate current section in the planner and save its area explicitly.</p>:null}
    {item.affected.length?<details><summary>{item.affected.length} earlier flexible {item.affected.length===1?"assignment needs":"assignments need"} review</summary>
     <ul>{item.affected.map(member=><li key={member.id}>{member.name??"Saint no longer in the current proposals"}{member.currentSection&&member.currentSection!==item.section?` · Now in ${member.currentSection}`:""}</li>)}</ul>
     <p>Review these saints in their current sections and assign destinations again when ready.</p>
    </details>:null}
   </li>)}</ul>
  </details>:null}
  {view==="plan"?<>
   <section className="museum-planner__surface admin-stack" aria-label="Section areas in the room">
    <div><h2>Arrange sections in the room</h2><p>Drag a section onto each of its vitrines, or select a section and tap the vitrines. Save its area when ready.</p></div>
    <div className="museum-planner__room-workspace">
     <div className="admin-stack"><label className="admin-field">Find a section<input type="search" value={sectionFilter} onChange={event=>setSectionFilter(event.target.value)}/></label>
      <div className="museum-planner__palette" aria-label="Museum sections">{data.sections.filter(item=>item.name.toLowerCase().includes(sectionFilter.toLowerCase())&&data.rows.some(row=>row.section===item.name)).map(item=>{
       const numbers=areaDrafts[item.name]??data.areas.find(a=>a.section===item.name)?.vitrines??[];
       const dirty=JSON.stringify([...numbers].sort())!==JSON.stringify([...(data.areas.find(a=>a.section===item.name)?.vitrines??[])].sort());
       return <MuseumSectionDragButton key={item.name} section={item.name} selected={section===item.name} disabled={pending} canDrag={canEdit&&!pending&&item.name!=="Needs section proposal"} onSelect={()=>chooseSection(item.name)} onDrop={(number,name)=>editArea(number,name,true)} onHover={setDropVitrine}>
        <strong><GripVertical aria-hidden="true"/> {item.name}</strong><span>{data.rows.filter(row=>row.section===item.name).length} {data.rows.filter(row=>row.section===item.name).length===1?"saint":"saints"} · {numbers.length?`Vitrines ${numbers.join(", ")}`:"No area yet"}{dirty?" · Unsaved":""}</span>
       </MuseumSectionDragButton>;
      })}</div>
     </div>
     <div className="admin-stack"><h3>{section}</h3><MuseumRoomPlan dropVitrine={dropVitrine} multiple selected={area} labels={labels} counts={counts} disabled={!canEdit||pending} onSelect={number=>editArea(number)} onDropSection={(number,name)=>editArea(number,name,true)}/>
      <p className="muted">Highlighted vitrines form this section’s area. Shared vitrines are allowed. The drawing does not estimate capacity.</p>
      <div className="review-actions" aria-label="Selected section vitrines">{area.map(number=><button key={number} type="button" className="museum-admin-button museum-admin-button--secondary" disabled={!canEdit||pending} onClick={()=>editArea(number)} aria-label={`Remove ${section} from vitrine ${number}`}>Vitrine {number} <X aria-hidden="true"/></button>)}</div>
      <p>{area.length?"Remove a vitrine with ×, or tap it again on the map.":"Select one or more vitrines"}{areaDirty?" · Unsaved changes":""}</p>
      {savedArea.some(number=>!area.includes(number)&&rows.some(row=>row.vitrine===number&&row.status!=="Proposed"))?<p>Some saints still have exact destinations in a removed vitrine. Those destinations will be kept; review them in the section workspace below.</p>:null}
      {area.some(n=>(labels[n]?.length||0)>1)?<p>Shared with: {[...new Set(area.flatMap(n=>labels[n]||[]).filter(name=>name!==section))].join(" · ")}</p>:null}
      {!area.length&&savedArea.length?<p>Removing the area returns its flexible saints to unassigned. Exact individual destinations stay in place.</p>:null}
      <div className="review-actions"><button type="button" className="museum-admin-button" disabled={!canEdit||pending||!areaDirty||section==="Needs section proposal"} onClick={()=>save(()=>saveSectionAreaAction({revision:data.revision,section,vitrines:area,areaVersion:draftVersions[section]??data.areas.find(a=>a.section===section)?.version??0}),"Section area saved. Exact individual destinations have been kept.")}>{pending?"Saving…":"Save section area"}</button>
       {areaDirty?<button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={pending} onClick={()=>setAreaDrafts(current=>({...current,[section]:savedArea}))}>Discard area changes</button>:null}</div>
     </div>
    </div>
   </section>
   <section className="museum-planner__surface museum-planner__section-workspace" aria-label="Arrange selected section">
    <header id="museum-plan-overview" className="admin-stack"><p className="eyebrow">Section workspace</p><h2>{section}</h2>{data.sections.find(item=>item.name===section)?.idea?<p>{data.sections.find(item=>item.name===section)?.idea}</p>:null}<Counts rows={rows} configured={data.photosConfigured}/><p>{rows.filter(row=>row.tier==="Featured").length} primary saints · {familyGroups.filter(group=>group.rows.length>1).length} families · {individuals.length} remaining individuals</p><Link href={`/vrindavanadmin/sections?section=${data.sections.find(item=>item.name===section)?.slug||""}` as Route}>Explore section details</Link>{outsideArea.length?<details><summary>Exact destinations outside this section’s area ({outsideArea.length})</summary><ul>{outsideArea.map(row=><li key={row.id}>{row.name} · Vitrine {row.vitrine}</li>)}</ul><p>These destinations are kept. Save the section’s new area, then select these saints to review or replace their destinations.</p></details>:null}</header>
    {!savedArea.length?<p>Save this section’s area above to start arranging families and saints.</p>:<>
     <nav className="museum-planner__workspace-nav" aria-label="Section workspace"><a href="#museum-plan-overview">Overview</a><a href="#museum-plan-families">Primary saints & families</a><a href="#museum-plan-individuals">Individual saints</a></nav>
     <form onSubmit={event=>{event.preventDefault();const form=new FormData(event.currentTarget);save(()=>assignMovePlanAction({revision:data.revision,placementIds:selected,vitrine:destination,shelf:String(form.get("shelf")||""),replaceExisting:form.get("replaceExisting")==="on"}),`${selected.length} saints assigned to vitrine ${destination}.`);}}>
      <fieldset disabled={!canEdit||pending||areaDirty} className="admin-field form-stack">
       <legend className="sr-only">Arrange this section</legend>
       <div className="museum-planner__arrange-grid">
        <div className="admin-stack">
         <label>Find a saint or family<input value={filter} onChange={event=>setFilter(event.target.value)} type="search"/></label>
         <div className="review-actions"><button className="museum-admin-button museum-admin-button--secondary" type="button" onClick={()=>setSelected(rows.map(row=>row.id))}>Select whole section</button><button className="museum-admin-button museum-admin-button--secondary" type="button" onClick={()=>setSelected([])}>Clear selection</button></div>
         <section id="museum-plan-families" className="admin-stack"><div><h3>Primary saints & families</h3><p className="muted">Largest families first. Select a family together or expand it to choose members.</p></div>
       <div className="museum-planner__family-list">{anchors.filter(group=>matches(`${group.name} ${group.rows.map(row=>row.name).join(" ")}`)).map(group=>{
        const selectedCount=group.rows.filter(row=>selected.includes(row.id)).length,elsewhere=data.rows.filter(row=>row.familyKey&&row.familyKey===group.key&&row.section!==section).length;
        return <section key={group.key} className="museum-planner__family" data-selected={selectedCount>0}><div className="museum-planner__family-heading"><div><h4>{group.rows.length>1?<Users aria-hidden="true"/>:null} {group.name}</h4><small>{group.rows.length} {group.rows.length===1?"saint":"saints"}{selectedCount?` · ${selectedCount} selected`:""}{elsewhere?` · ${elsewhere} other members in another section`:""}</small>{group.rows.some(row=>row.tier==="Featured")?<p>Primary: {group.rows.filter(row=>row.tier==="Featured").map(row=>row.name).join(" · ")}</p>:null}<p className="muted">{familyDestinationSummary(group.rows)}</p></div><button type="button" className="museum-admin-button museum-admin-button--secondary" aria-pressed={selectedCount===group.rows.length} onClick={()=>selectGroup(group.rows)}>{selectedCount===group.rows.length?"Deselect":group.rows.length>1?`Select ${elsewhere?"section members":"whole family"}`:"Select"}</button></div>
         <div className="review-actions">{group.rows.length>1&&group.rows[0].familyKey?<button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>setTree({key:group.key,name:group.name})}>View family tree</button>:null}</div>
         <details open={filter?true:undefined}><summary>View saints and destinations</summary><div className="museum-planner__members">{group.rows.map(row=><label className="museum-planner__member" key={row.id}><input type="checkbox" checked={selected.includes(row.id)} onChange={()=>toggle(row.id)}/><span><strong>{row.name}</strong><small>{row.tier==="Featured"?"Primary":row.tier}{row.photo?" · Photo saint":""}{row.needsResearch?" · Research flagged":""}</small><small>{destinationLabel(row)}{row.arrangementNeedsReview?" · Review destination after proposal change":""}</small></span></label>)}</div></details>
        </section>;
       })}</div>

         {!anchors.filter(group=>matches(`${group.name} ${group.rows.map(row=>row.name).join(" ")}`)).length?<p>No primary saints or families match.</p>:null}
         </section>
         <section id="museum-plan-individuals" className="admin-stack museum-planner__individuals"><div><h3>Remaining individual saints</h3><p className="muted">Select several at once, then give them a destination or keep their exact spots flexible.</p></div>
          <div className="review-actions"><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={!individuals.length} onClick={()=>setSelected(current=>[...new Set([...current,...individuals.map(row=>row.id)])])}>Select all individuals</button><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={!tertiary.length} onClick={()=>{setSelected(current=>[...new Set([...current,...tertiary.map(row=>row.id)])]);setFilter("");}}>Select unassigned tertiary ({tertiary.length})</button></div>
          <div className="museum-planner__members">{individuals.filter(row=>matches(row.name)).map(row=><label key={row.id} className="museum-planner__member"><input type="checkbox" checked={selected.includes(row.id)} onChange={()=>toggle(row.id)}/><span><strong>{row.name}</strong><small>{row.tier}{row.photo?" · Photo saint":""}</small><small>{destinationLabel(row)}{row.arrangementNeedsReview?" · Review destination after proposal change":""}</small></span></label>)}</div>
          {!individuals.filter(row=>matches(row.name)).length?<p>No individual saints match.</p>:null}
         </section>
        </div>
        <aside className="museum-planner__destination-panel" aria-label="Assign selected saints">
       <div id="museum-plan-assignment" className="museum-planner__assignment admin-stack"><p><strong>{chosen.length} selected</strong>{data.photosConfigured?` · ${chosen.filter(row=>row.photo).length} with photos`:" · Photo data pending"}</p>
        {splitFamilies.length?<p role="status">Only part of {splitFamilies.map(group=>group.name).join("; ")} is selected. Use each family’s Select whole family action to include all its members.</p>:null}
        <div className="review-actions" role="group" aria-label="Assign within section area">{savedArea.map(number=><button type="button" key={number} className="museum-admin-button museum-admin-button--secondary" aria-pressed={destination===number} onClick={()=>setDestination(number)}>Vitrine {number} · {counts[number]} assigned</button>)}</div>
        {destination&&savedArea.includes(destination)?<details><summary>Already assigned to vitrine {destination} ({data.rows.filter(row=>row.status!=="Proposed"&&row.vitrine===destination).length})</summary><ul>{data.rows.filter(row=>row.status!=="Proposed"&&row.vitrine===destination).map(row=><li key={row.id}>{row.name} · {row.section}{row.shelf?` / ${row.shelf}`:""}</li>)}</ul><p>Flexible groups are not counted in every vitrine; their exact positions remain open.</p></details>:null}
        <label>Shelf / position (optional)<input name="shelf" maxLength={100} placeholder="Can be decided during the move"/></label>
        {chosen.some(row=>row.status!=="Proposed")?<label className="museum-planner__member"><input type="checkbox" name="replaceExisting" required/><span>Replace the existing destination for the selected planned or implemented saints.</span></label>:null}
        <div className="review-actions"><button type="submit" className="museum-admin-button" disabled={!selected.length||!savedArea.includes(destination)}>{pending?"Saving…":`Assign selected${destination?` → Vitrine ${destination}`:" to a vitrine"}`}</button><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={!chosen.length||chosen.some(row=>row.status!=="Proposed")} onClick={()=>flexibleSave(chosen)}>Keep selected flexible within this area</button>{chosen.length&&chosen.every(isFlexible)?<button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>flexibleSave(chosen,true)}>Remove flexible plan</button>:null}</div>
        <details><summary>How flexible placement works</summary><p className="muted">Choose any one of vitrines {savedArea.join(", ")} during the move. Existing exact destinations are kept.</p></details>
       </div>

        </aside>
       </div>
       {chosen.length?<div className="museum-planner__selection-bar"><strong>{chosen.length} saints selected</strong><a className="museum-admin-button museum-admin-button--secondary" href="#museum-plan-assignment">Choose destination</a></div>:null}
      </fieldset>{areaDirty?<p>Save or discard the section-area changes above before assigning saints.</p>:null}
     </form>
    </>}
   </section>
  </>:<MuseumMoveList data={data} canEdit={canEdit}/>}
  {tree?<MuseumDetailDialog titleId="museum-plan-tree-title" kicker="Family reference" closeLabel="Close family tree" onClose={()=>setTree(null)}><h2 id="museum-plan-tree-title">{tree.name}</h2><MuseumSaintTree familyKey={tree.key} museum="vrindavan" name={tree.name} showStatus/></MuseumDetailDialog>:null}
  <details className="museum-planner__setup"><summary>Inventory coverage</summary><p>{data.awaitingIdentityReview} source entries still await saint identity review and are not included in these assignments.</p>{data.unmappedLocations.length?<p>Locations outside the numbered map: {data.unmappedLocations.join(", ")}. These remain visible in the move list.</p>:null}<p>The source inventory can group several relics in one entry. Photo tags and counts assist planning; they do not measure available shelf space.</p></details>
 </div>;
}
