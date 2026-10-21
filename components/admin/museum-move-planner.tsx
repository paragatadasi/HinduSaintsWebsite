"use client";
import {useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import type {Route} from "next";
import {Camera,GripVertical,Users,X} from "lucide-react";
import {plannerDestination,plannerCounts,plannerFamilies,plannerRegionGroups,plannerAreasNeedingReview,isFlexible,vrindavanVitrines,type PlannerData,type PlannerRow} from "@/lib/museum-move-planner-domain";
import {assignMovePlanAction,saveSectionAreaAction,saveFlexiblePlanAction} from "@/app/vrindavanadmin/plan/actions";
import {MuseumSectionDragButton} from "./museum-section-drag-button";
import {MuseumRoomPlan} from "./museum-room-plan";
import {MuseumSaintTree} from "./museum-live-trees";
import {MuseumDetailDialog} from "./museum-detail-dialog";
import {MuseumPlanningStats} from "./museum-planning-stats";
import {MuseumConnectedTraditions,museumRegionIndex} from "./museum-connected-traditions";
import {MuseumPackagingSummary} from "./museum-packaging-summary";
import {MuseumArrangementLegend} from "./museum-arrangement-indicator";
import {MuseumMoveList} from "./museum-move-list";
import {requiredPlanningVitrine} from "@/lib/museum-planning-constraints";
import {MuseumVitrineContents} from "./museum-vitrine-contents";
import {MuseumPlannerProposalEditor} from "./museum-planner-proposal-editor";
import {MuseumPlanSearch} from "./museum-plan-search";
import {MuseumSuggestedPlan} from "./museum-suggested-plan";
import {MuseumCuratorReview} from "./museum-curator-review";

function Counts({rows,configured}:{rows:PlannerRow[];configured:boolean}){
 const counts=plannerCounts(rows);
 return <span className="museum-planner__counts"><span>{counts.total} {counts.total===1?"saint":"saints"}</span>{configured?<><span><Camera aria-hidden="true"/> {counts.photo} photo</span><span>{counts.untagged} without photo tag</span></>:null}<span>{counts.unplanned} to plan</span></span>;
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
 const regionGroups=plannerRegionGroups(data.sections,data.rows);
 const [view,setView]=useState<"plan"|"checklist">("plan");
 const [section,setSection]=useState("");
 const [editMap,setEditMap]=useState(false);
 const [inspectVitrine,setInspectVitrine]=useState<string|null>(null);
 const [areaDrafts,setAreaDrafts]=useState<Record<string,string[]>>({});
 const [draftVersions,setDraftVersions]=useState<Record<string,number>>({});
 const [editSaint,setEditSaint]=useState<{saintId:string;name:string}|null>(null);
 const [tree,setTree]=useState<{key:string;name:string}|null>(null);
 const [sectionFilter,setSectionFilter]=useState("");
 const [dropVitrine,setDropVitrine]=useState<string|null>(null);
 const [selected,setSelected]=useState<string[]>([]),[destination,setDestination]=useState("");
 const [filter,setFilter]=useState("");
 const [error,setError]=useState(""),[message,setMessage]=useState("");
 const [pending,startTransition]=useTransition();
 const rows=data.rows.filter(row=>row.section===section),chosen=rows.filter(row=>selected.includes(row.id));
 const savedArea=data.areas.find(area=>area.section===section)?.vitrines||[];
 const requiredVitrine=requiredPlanningVitrine("museum-vrindavan",section);
 const activeDestination=plannerDestination(savedArea,destination);
 const unassigned=rows.filter(row=>row.status==="Proposed");
 const outsideArea=rows.filter(row=>row.status!=="Proposed"&&!savedArea.includes(row.vitrine));
 const area=areaDrafts[section]??savedArea;
 const areaDirty=JSON.stringify([...area].sort())!==JSON.stringify([...savedArea].sort());

 const counts=Object.fromEntries(vrindavanVitrines.map(number=>[number,data.rows.filter(row=>row.vitrine===number&&row.status!=="Proposed").length]));
 const labels=Object.fromEntries(vrindavanVitrines.map(number=>[number,data.sections.filter(item=>(areaDrafts[item.name]??data.areas.find(a=>a.section===item.name)?.vitrines??[]).includes(number)).map(item=>item.name).sort((a,b)=>a===section?-1:b===section?1:a.localeCompare(b))]));
 const chooseSection=(name:string)=>{setSection(name);setEditMap(false);setSelected([]);setDestination("");setFilter("");setMessage("");};
 const editArea=(number:string,name=section,addOnly=false)=>{
  if(!canEdit||pending||name==="Needs section proposal"||!data.sections.some(item=>item.name===name))return;
  const required=requiredPlanningVitrine("museum-vrindavan",name);
  if(required&&number!==required){setError("The Sikh section must remain in Vitrine 11 because a relic is permanently fixed there.");return;}
  if(name!==section)chooseSection(name);
  const saved=data.areas.find(a=>a.section===name);
  if(!areaDrafts[name]||JSON.stringify([...areaDrafts[name]].sort())===JSON.stringify([...(saved?.vitrines??[])].sort()))setDraftVersions(current=>({...current,[name]:saved?.version??0}));
  setAreaDrafts(current=>{const values=current[name]??data.areas.find(a=>a.section===name)?.vitrines??[];return {...current,[name]:required?[required]:values.includes(number)?(addOnly?values:values.filter(n=>n!==number)):[...values,number]};});
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
  {view==="plan"&&canEdit?<MuseumSuggestedPlan data={data} disabled={Object.entries(areaDrafts).some(([name,values])=>JSON.stringify([...values].sort())!==JSON.stringify([...(data.areas.find(a=>a.section===name)?.vitrines??[])].sort()))}/>:null}
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
   <MuseumCuratorReview canEdit={canEdit} disabled={Object.entries(areaDrafts).some(([name,values])=>JSON.stringify([...values].sort())!==JSON.stringify([...(data.areas.find(a=>a.section===name)?.vitrines??[])].sort()))}/>
   <MuseumPlanSearch data={data} onVitrine={setInspectVitrine} onSection={name=>{chooseSection(name);requestAnimationFrame(()=>document.getElementById("museum-plan-overview")?.scrollIntoView({block:"start"}));}}/>
   <section className="museum-planner__surface admin-stack" aria-label="Section areas in the room">
    <div><h2>Arrange sections in the room</h2><p>Click a vitrine to see its planned saints. To reserve space, drag a section onto the map or choose Edit section area.</p></div>
    <div className="museum-planner__room-workspace">
     <div className="admin-stack"><label className="admin-field">Find a section<input type="search" value={sectionFilter} onChange={event=>setSectionFilter(event.target.value)}/></label>
      <div className="museum-planner__palette" aria-label="Museum sections in visitor order">{regionGroups.map(group=>({...group,sections:group.sections.filter(name=>`${group.title} ${name}`.toLowerCase().includes(sectionFilter.toLowerCase()))})).filter(group=>group.sections.length).map(group=><section key={group.title} className="museum-planner__region" data-region={museumRegionIndex(group.title)}><header><p className="eyebrow">{group.badge ? `Region ${group.badge}` : "Additional context"}</p><h4>{group.title}</h4><small>{group.sections.length} {group.sections.length===1?"section":"sections"}</small></header>{group.sections.map(name=>data.sections.find(item=>item.name===name)!).map(item=>{
       const numbers=areaDrafts[item.name]??data.areas.find(a=>a.section===item.name)?.vitrines??[];
       const dirty=JSON.stringify([...numbers].sort())!==JSON.stringify([...(data.areas.find(a=>a.section===item.name)?.vitrines??[])].sort());
       return <MuseumSectionDragButton key={item.name} section={item.name} selected={section===item.name} disabled={pending} canDrag={canEdit&&!pending&&item.name!=="Needs section proposal"} onSelect={()=>chooseSection(item.name)} onDrop={(number,name)=>editArea(number,name,true)} onHover={setDropVitrine}>
        <strong><GripVertical aria-hidden="true"/> {item.name}</strong><span>{data.rows.filter(row=>row.section===item.name).length} {data.rows.filter(row=>row.section===item.name).length===1?"saint":"saints"} · {numbers.length?`Vitrines ${numbers.join(", ")}`:"No area yet"}{dirty?" · Unsaved":""}</span>
       </MuseumSectionDragButton>;
      })}</section>)}</div>
     </div>
     <div className="museum-planner__map-companion"><div className="admin-stack museum-admin-panel"><p className="eyebrow">Museum layout</p><h3>{section||"Explore the room"}</h3><div className="review-actions">{section?<button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>chooseSection("")}>Clear section selection</button>:null}{section&&section!=="Needs section proposal"&&canEdit?<button type="button" className="museum-admin-button museum-admin-button--secondary" aria-pressed={editMap} onClick={()=>setEditMap(value=>!value)}>{editMap?"Done editing area":"Edit section area"}</button>:null}</div><MuseumRoomPlan mode={editMap?"assign":"browse"} dropVitrine={dropVitrine} multiple selected={area} labels={labels} counts={counts} disabled={pending} onSelect={number=>editMap?editArea(number):setInspectVitrine(number)} onDropSection={canEdit?(number,name)=>editArea(number,name,true):undefined}/>
      <p className="muted">Highlighted vitrines show the selected section’s area. Clicking only opens the contents unless Edit section area is active. The drawing does not estimate capacity.</p>
      {section?<><div className="review-actions" aria-label="Selected section vitrines">{area.map(number=><button key={number} type="button" className="museum-admin-button museum-admin-button--secondary" disabled={!canEdit||pending||number===requiredVitrine} onClick={()=>editArea(number)} aria-label={`Remove ${section} from vitrine ${number}`}>Vitrine {number} <X aria-hidden="true"/></button>)}</div>
      <p>{area.length?"Remove a vitrine with ×, or use Edit section area.":"Select one or more vitrines"}{areaDirty?" · Unsaved changes":""}</p>
      {savedArea.some(number=>!area.includes(number)&&rows.some(row=>row.vitrine===number&&row.status!=="Proposed"))?<p>Some saints still have exact destinations in a removed vitrine. Those destinations will be kept; review them in the section workspace below.</p>:null}
      {area.some(n=>(labels[n]?.length||0)>1)?<p>Shared with: {[...new Set(area.flatMap(n=>labels[n]||[]).filter(name=>name!==section))].join(" · ")}</p>:null}
      {!area.length&&savedArea.length?<p>Removing the area returns its flexible saints to unassigned. Exact individual destinations stay in place.</p>:null}
      <div className="review-actions"><button type="button" className="museum-admin-button" disabled={!canEdit||pending||!areaDirty||section==="Needs section proposal"} onClick={()=>save(()=>saveSectionAreaAction({revision:data.revision,section,vitrines:area,areaVersion:draftVersions[section]??data.areas.find(a=>a.section===section)?.version??0}),"Section area saved. Exact individual destinations have been kept.")}>{pending?"Saving…":"Save section area"}</button>
       {areaDirty?<button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={pending} onClick={()=>setAreaDrafts(current=>({...current,[section]:savedArea}))}>Discard area changes</button>:null}</div>
     </>:null}</div>
     <MuseumConnectedTraditions section={section} onChoose={chooseSection} available={data.sections.map(item=>item.name)}/>
     </div>
    </div>
   </section>
   {section?<section className="museum-planner__surface museum-planner__section-workspace" aria-label="Arrange selected section">
    <div className="museum-planning-overview-layout"><header id="museum-plan-overview" className="museum-admin-hero museum-admin-hero--detail museum-planning-overview"><p className="eyebrow">Museum section</p><h2>{section}</h2><MuseumArrangementLegend/><MuseumPlanningStats items={[{label:"Saints",value:rows.length},{label:"Primary",value:rows.filter(row=>row.tier==="Featured").length},{label:"Secondary",value:rows.filter(row=>row.tier==="Secondary").length},{label:"Tertiary",value:rows.filter(row=>row.tier==="Tertiary").length}]}/>{data.sections.find(item=>item.name===section)?.idea?<p>{data.sections.find(item=>item.name===section)?.idea}</p>:null}{data.photosConfigured?<p className="museum-planning-meta">{rows.filter(row=>row.photo).length} with photo tags</p>:null}<Link href={`/vrindavanadmin/sections?section=${data.sections.find(item=>item.name===section)?.slug||""}` as Route}>Explore section details</Link>{outsideArea.length?<details><summary>Exact destinations outside this section’s area ({outsideArea.length})</summary><ul>{outsideArea.map(row=><li key={row.id}>{row.name} · Vitrine {row.vitrine}</li>)}</ul><p>These destinations are kept. Save the section’s new area, then select these saints to review or replace their destinations.</p></details>:null}</header><aside className="admin-stack"><section className="museum-admin-panel"><p className="eyebrow">Arrangement progress</p><MuseumPlanningStats items={[{label:"To plan",value:plannerCounts(rows).unplanned},{label:"Planned",value:plannerCounts(rows).planned},{label:"Implemented",value:plannerCounts(rows).implemented}]}/></section><section className="museum-admin-panel"><MuseumPackagingSummary rows={rows}/></section></aside></div>
    {requiredVitrine?<p role="note">Fixed location: Vitrine {requiredVitrine}. A Sikh relic is permanently installed there. {savedArea.length!==1||savedArea[0]!==requiredVitrine?<button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={!canEdit||pending} onClick={()=>save(()=>saveSectionAreaAction({revision:data.revision,section,vitrines:[requiredVitrine],areaVersion:data.areas.find(a=>a.section===section)?.version??0}),"Fixed section area saved. Review the saints’ destinations below.")}>Set area to Vitrine {requiredVitrine}</button>:null}</p>:null}
    {section==="Needs section proposal"?<p>These saints do not yet have an agreed section. Open a saint’s details to review and change the proposal; no room area is required to browse.</p>:section==="Needs Research"?<p>This is the earlier research holding group. Review each saint’s details to choose a more specific section. It is separate from saints with no section proposal.</p>:null}
    {!savedArea.length?<p>You can browse everyone below. Reserve a section area when you are ready to assign destinations.</p>:null}
    {savedArea.length===1?<div className="review-actions"><p>This section has one destination: Vitrine {savedArea[0]}. Shelf and position are optional.</p><button type="button" className="museum-admin-button" disabled={!canEdit||pending||areaDirty||!unassigned.length||!!requiredVitrine&&savedArea[0]!==requiredVitrine} onClick={()=>save(()=>assignMovePlanAction({revision:data.revision,placementIds:unassigned.map(row=>row.id),vitrine:savedArea[0],shelf:"",replaceExisting:false}),`${unassigned.length} saints assigned to Vitrine ${savedArea[0]}.`)}>Assign all {unassigned.length} unassigned saints to Vitrine {savedArea[0]}</button></div>:null}
    <>
     <nav className="museum-planner__workspace-nav" aria-label="Section workspace"><a href="#museum-plan-overview">Overview</a><a href="#museum-plan-families">Primary saints & families</a><a href="#museum-plan-individuals">Individual saints</a></nav>
     <form onSubmit={event=>{event.preventDefault();const form=new FormData(event.currentTarget);save(()=>assignMovePlanAction({revision:data.revision,placementIds:selected,vitrine:activeDestination,shelf:String(form.get("shelf")||""),replaceExisting:form.get("replaceExisting")==="on"}),`${selected.length} saints assigned to vitrine ${activeDestination}.`);}}>
      <fieldset disabled={!canEdit||pending||areaDirty} className="admin-field form-stack">
       <legend className="sr-only">Arrange this section</legend>
       <div className="museum-planner__arrange-grid">
        <div className="admin-stack">
         <label>Find a saint or family<input value={filter} onChange={event=>setFilter(event.target.value)} type="search"/></label>
         <div className="review-actions"><button className="museum-admin-button museum-admin-button--secondary" type="button" onClick={()=>setSelected(rows.map(row=>row.id))}>Select whole section</button><button className="museum-admin-button museum-admin-button--secondary" type="button" onClick={()=>setSelected([])}>Clear selection</button></div>
         <section id="museum-plan-families" className="admin-stack"><div className="museum-planning-heading"><p className="eyebrow">Anchor the section</p><h3>Primary saints & families</h3><p className="muted">Largest families first. Select a family together or expand it to choose members.</p></div>
       <div className="museum-planner__family-list">{anchors.filter(group=>matches(`${group.name} ${group.rows.map(row=>row.name).join(" ")}`)).map(group=>{
        const selectedCount=group.rows.filter(row=>selected.includes(row.id)).length,elsewhere=data.rows.filter(row=>row.familyKey&&row.familyKey===group.key&&row.section!==section).length;
        return <section key={group.key} className="museum-planner__family museum-planning-card museum-family-card" data-selected={selectedCount>0}><div className="museum-planner__family-heading"><div><h4>{group.rows.length>1?<Users aria-hidden="true"/>:null} {group.name}</h4><small>{group.rows.length} {group.rows.length===1?"saint":"saints"}{selectedCount?` · ${selectedCount} selected`:""}{elsewhere?` · ${elsewhere} other members in another section`:""}</small>{group.rows.some(row=>row.tier==="Featured")?<p>Primary: {group.rows.filter(row=>row.tier==="Featured").map(row=>row.name).join(" · ")}</p>:null}<p className="muted">{familyDestinationSummary(group.rows)}</p><MuseumPackagingSummary rows={group.rows} compact/></div><button type="button" className="museum-admin-button museum-admin-button--secondary" aria-pressed={selectedCount===group.rows.length} onClick={()=>selectGroup(group.rows)}>{selectedCount===group.rows.length?"Deselect":group.rows.length>1?`Select ${elsewhere?"section members":"whole family"}`:"Select"}</button></div>
         <div className="review-actions">{group.rows.length>1&&group.rows[0].familyKey?<button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>setTree({key:group.key,name:group.name})}>View family tree</button>:null}</div>
         <details open={filter?true:undefined}><summary>View saints and destinations</summary><div className="museum-planner__members">{group.rows.map(row=><div className="museum-planner__member" key={row.id}><input aria-label={`Select ${row.name}`} type="checkbox" checked={selected.includes(row.id)} onChange={()=>toggle(row.id)}/><span><span className={row.tier==="Featured"?"museum-family-card__primary":"museum-planning-member-name"}>{row.name}</span><small>{row.tier==="Featured"?"Primary":row.tier}{row.photo?" · Photo saint":""}{row.needsResearch?" · Research flagged":""}</small><small><Link href={`/vrindavanadmin?q=${encodeURIComponent(row.name)}` as Route}>Open saint details</Link></small>{canEdit?<small><button type="button" className="museum-saint-link" onClick={()=>setEditSaint({saintId:row.saintId,name:row.name})}>Edit tier / family</button></small>:null}<small>{destinationLabel(row)}{row.arrangementNeedsReview?" · Review destination after proposal change":""}</small></span></div>)}</div></details>
        </section>;
       })}</div>

         {!anchors.filter(group=>matches(`${group.name} ${group.rows.map(row=>row.name).join(" ")}`)).length?<p>No primary saints or families match.</p>:null}
         </section>
         <section id="museum-plan-individuals" className="admin-stack museum-planner__individuals"><div className="museum-planning-heading"><p className="eyebrow">Complete the arrangement</p><h3>Remaining individual saints</h3><p className="muted">Select several at once, then give them a destination or keep their exact spots flexible.</p></div>
          <div className="review-actions"><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={!individuals.length} onClick={()=>setSelected(current=>[...new Set([...current,...individuals.map(row=>row.id)])])}>Select all individuals</button><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={!tertiary.length} onClick={()=>{setSelected(current=>[...new Set([...current,...tertiary.map(row=>row.id)])]);setFilter("");}}>Select unassigned tertiary ({tertiary.length})</button></div>
          <div className="museum-planner__members">{individuals.filter(row=>matches(row.name)).map(row=><div key={row.id} className="museum-planner__member"><input aria-label={`Select ${row.name}`} type="checkbox" checked={selected.includes(row.id)} onChange={()=>toggle(row.id)}/><span><span className={row.tier==="Featured"?"museum-family-card__primary":"museum-planning-member-name"}>{row.name}</span><small>{row.tier}{row.photo?" · Photo saint":""}</small><small><Link href={`/vrindavanadmin?q=${encodeURIComponent(row.name)}` as Route}>Open saint details</Link></small>{canEdit?<small><button type="button" className="museum-saint-link" onClick={()=>setEditSaint({saintId:row.saintId,name:row.name})}>Edit tier / family</button></small>:null}<small>{destinationLabel(row)}{row.arrangementNeedsReview?" · Review destination after proposal change":""}</small></span></div>)}</div>
          {!individuals.filter(row=>matches(row.name)).length?<p>No individual saints match.</p>:null}
         </section>
        </div>
        <aside className="museum-planner__destination-panel" aria-label="Assign selected saints">
       <div id="museum-plan-assignment" className="museum-planner__assignment admin-stack"><div className="museum-planning-heading"><p className="eyebrow">Destination</p><h3>Place your selection</h3></div><p><strong>{chosen.length} selected</strong>{data.photosConfigured?` · ${chosen.filter(row=>row.photo).length} with photos`:""}</p>
        {splitFamilies.length?<p role="status">Only part of {splitFamilies.map(group=>group.name).join("; ")} is selected. Use each family’s Select whole family action to include all its members.</p>:null}
        <MuseumPackagingSummary rows={chosen} compact/><div className="review-actions" role="group" aria-label="Assign within section area">{savedArea.map(number=><button type="button" key={number} className="museum-admin-button museum-admin-button--secondary" aria-pressed={activeDestination===number} onClick={()=>setDestination(number)}>Vitrine {number} · {counts[number]} assigned</button>)}</div>
        {activeDestination&&savedArea.includes(activeDestination)?<details><summary>Already assigned to vitrine {activeDestination} ({data.rows.filter(row=>row.status!=="Proposed"&&row.vitrine===activeDestination).length})</summary><ul>{data.rows.filter(row=>row.status!=="Proposed"&&row.vitrine===activeDestination).map(row=><li key={row.id}>{row.name} · {row.section}{row.shelf?` / ${row.shelf}`:""}</li>)}</ul><p>Flexible groups are not counted in every vitrine; their exact positions remain open.</p></details>:null}
        <label>Shelf / position (optional)<input name="shelf" maxLength={100} placeholder="Can be decided during the move"/></label>
        {chosen.some(row=>row.status!=="Proposed")?<label className="museum-planner__member"><input type="checkbox" name="replaceExisting" required/><span>Replace the existing destination for the selected planned or implemented saints.</span></label>:null}
        <div className="review-actions"><button type="submit" className="museum-admin-button" disabled={!selected.length||!savedArea.includes(activeDestination)||!!requiredVitrine&&activeDestination!==requiredVitrine}>{pending?"Saving…":`Assign selected${activeDestination?` → Vitrine ${activeDestination}`:" to a vitrine"}`}</button><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={savedArea.length<2||!chosen.length||chosen.some(row=>row.status!=="Proposed")} onClick={()=>flexibleSave(chosen)}>Keep selected flexible within this area</button>{chosen.length&&chosen.every(isFlexible)?<button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>flexibleSave(chosen,true)}>Remove flexible plan</button>:null}</div>
        {!savedArea.length?<p>Choose and save a section area above before assigning destinations. You can still open saint details to change their sections.</p>:null}
        <details><summary>How flexible placement works</summary><p className="muted">Choose any one of vitrines {savedArea.join(", ")} during the move. Existing exact destinations are kept.</p></details>
       </div>

        </aside>
       </div>
       {chosen.length?<div className="museum-planner__selection-bar"><strong>{chosen.length} saints selected</strong><a className="museum-admin-button museum-admin-button--secondary" href="#museum-plan-assignment">Choose destination</a></div>:null}
      </fieldset>{areaDirty?<p>Save or discard the section-area changes above before assigning saints.</p>:null}
     </form>
    </>
   </section>:<p>Select a section to explore its saints, or click any vitrine to browse its planned contents.</p>}
  </>:<MuseumMoveList data={data} canEdit={canEdit}/>}
  {editSaint?<MuseumPlannerProposalEditor key={editSaint.saintId} saintId={editSaint.saintId} name={editSaint.name} onClose={()=>setEditSaint(null)}/>:null}
  {inspectVitrine!==null?<MuseumVitrineContents data={data} number={inspectVitrine} onClose={()=>setInspectVitrine(null)}/>:null}
  {tree?<MuseumDetailDialog titleId="museum-plan-tree-title" kicker="Family reference" closeLabel="Close family tree" onClose={()=>setTree(null)}><h2 id="museum-plan-tree-title">{tree.name}</h2><MuseumPackagingSummary rows={data.rows.filter(row=>row.familyKey===tree.key)}/><MuseumSaintTree familyKey={tree.key} museum="vrindavan" name={tree.name} showStatus/></MuseumDetailDialog>:null}
  <details className="museum-planner__setup"><summary>Inventory coverage</summary><p>{data.awaitingIdentityReview} source entries still await saint identity review and are not included in these assignments.</p>{data.unmappedLocations.length?<p>Locations outside the numbered map: {data.unmappedLocations.join(", ")}. These remain visible in the move list.</p>:null}<p>The source inventory can group several relics in one entry. Photo tags and counts assist planning; they do not measure available shelf space.</p></details>
 </div>;
}
