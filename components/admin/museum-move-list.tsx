"use client";
import {useId,useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import {Check,ClipboardList} from "lucide-react";
import {filterMoveRows,startingVitrines,destinationVitrines,moveRegion,type MoveFilters} from "@/lib/museum-move-companion";
import {isFlexible,vitrineNumber,vrindavanVitrines,type PlannerData,type PlannerRow} from "@/lib/museum-move-planner-domain";
import {completeMovePlanAction,loadMoveSaintAction} from "@/app/vrindavanadmin/plan/actions";
import {MuseumPackagingComponents} from "./museum-packaging-components";
import {MuseumPlanningStats} from "./museum-planning-stats";
import {MuseumDetailDialog} from "./museum-detail-dialog";
import {MuseumSaintProfile} from "./museum-saint-profile";
import {MuseumSaintTree} from "./museum-live-trees";

export function MuseumMoveList({data,canEdit}:{data:PlannerData;canEdit:boolean}){
 const initial:MoveFilters={query:"",source:"",destination:"",region:"",section:"",status:"remaining",sort:"destination"};
 const [filters,setFilters]=useState<MoveFilters>(initial),[notice,setNotice]=useState("");
 const update=(key:keyof MoveFilters,value:string)=>setFilters(current=>({...current,[key]:value,...(key==="region"?{section:""}:{})}));
 const all=data.rows,rows=filterMoveRows(all,filters);
 const regions=[...new Set(all.map(row=>moveRegion(row.section)))].sort();
 const sections=[...new Set(all.filter(row=>!filters.region||moveRegion(row.section)===filters.region).map(row=>row.section))].sort();
 const sourceOptions=[...new Set(all.flatMap(startingVitrines).map(v=>vitrineNumber(v)||v))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
 return <section className="admin-stack">
  <div className="section-heading"><div className="museum-planning-heading"><p className="eyebrow">At the museum</p><h2>Move-day checklist</h2><MuseumPlanningStats items={[{label:"Implemented",value:all.filter(row=>row.status==="Implemented"&&!row.arrangementNeedsReview).length},{label:"Still to do",value:all.filter(row=>row.status!=="Implemented"&&!row.arrangementNeedsReview).length},{label:"To review",value:all.filter(row=>row.arrangementNeedsReview).length}]}/></div><button className="museum-admin-button museum-admin-button--secondary" onClick={()=>window.print()}>Print this list</button></div>
  {notice?<p role="status">{notice}</p>:null}
  <section className="museum-admin-panel museum-move-controls admin-stack" aria-label="Search, sort and filter moves">
   <div className="museum-move-controls__top">
    <label className="admin-field">Find a saint<input type="search" value={filters.query} onChange={event=>update("query",event.target.value)}/></label>
    <label className="admin-field">Sort by<select value={filters.sort} onChange={event=>update("sort",event.target.value)}><option value="destination">Destination vitrine</option><option value="source">Starting vitrine</option><option value="name">Saint name</option><option value="section">Section</option></select></label>
   </div>
   <fieldset className="museum-move-controls__filters"><legend>Filter moves</legend>
    <label className="admin-field">Starting vitrine<select value={filters.source} onChange={event=>update("source",event.target.value)}><option value="">All</option>{sourceOptions.map(n=><option key={n} value={n}>{n}</option>)}<option value="unknown">Not recorded</option></select></label>
    <label className="admin-field">Destination vitrine<select value={filters.destination} onChange={event=>update("destination",event.target.value)}><option value="">All</option>{vrindavanVitrines.map(n=><option key={n} value={n}>{n}</option>)}<option value="unknown">Not assigned</option></select></label>
    <label className="admin-field">Region<select value={filters.region} onChange={event=>update("region",event.target.value)}><option value="">All regions</option>{regions.map(n=><option key={n}>{n}</option>)}</select></label>
    <label className="admin-field">Section<select value={filters.section} onChange={event=>update("section",event.target.value)}><option value="">All sections</option>{sections.map(n=><option key={n}>{n}</option>)}</select></label>
    <label className="admin-field">Status<select value={filters.status} onChange={event=>update("status",event.target.value)}><option value="remaining">Still to do</option><option value="implemented">Implemented</option><option value="planned">Exact destination planned</option><option value="flexible">Flexible area planned</option><option value="unassigned">No destination yet</option><option value="review">Needs destination review</option><option value="all">All saints</option></select></label>
   </fieldset>
   <div className="review-actions"><button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>setFilters({...initial,query:filters.query,sort:filters.sort,status:"all"})}>Clear filters</button></div>
  </section>
  <p>{rows.length} {rows.length===1?"saint":"saints"} shown. Check the listed relics, place them at the destination, then confirm the saint’s arrangement. Leave a partial or uncertain move planned.</p>
  {!rows.length?<p>No moves match these filters. You can assign destinations in Plan destinations or choose another progress filter.</p>:null}
  {rows.map(row=><MoveCard key={`${row.id}:${row.revision}:${row.flexibleVitrines?.join(",")||""}`} row={row} planRevision={data.revision} canEdit={canEdit} onComplete={()=>setNotice(`${row.name}: arrangement recorded as implemented.`)}/>)}
 </section>;
}
function MoveCard({row,planRevision,canEdit,onComplete}:{row:PlannerRow;planRevision:string;canEdit:boolean;onComplete:()=>void}){
 const router=useRouter(),titleId=useId();
 const flexible=isFlexible(row);
 const [pending,startTransition]=useTransition(),[error,setError]=useState("");
 const [treeOpen,setTreeOpen]=useState(false);
 const [open,setOpen]=useState(false),[loading,setLoading]=useState(false),[detailError,setDetailError]=useState(false);
 const [detail,setDetail]=useState<Awaited<ReturnType<typeof loadMoveSaintAction>>|null>(null);
 const showDetails=async()=>{
  setOpen(true);if(detail)return;setLoading(true);setDetailError(false);
  try{setDetail(await loadMoveSaintAction(row.saintId));}catch{setDetailError(true);}finally{setLoading(false);}
 };
 return <article className="museum-planner__move museum-planning-card admin-stack">
  <details className="museum-move-entry">
   <summary><span className="museum-move-entry__identity"><strong>{row.name}</strong><small>{row.tier==="Featured"?"Primary":row.tier} saint</small><span>{row.section}</span><small>{moveRegion(row.section)}</small></span><span className="museum-move-entry__route"><span><small>Starting vitrine</small>{startingVitrines(row).join(", ")||"Not recorded"}</span><span><small>Destination vitrine</small>{destinationVitrines(row).join(", ")||"Not assigned"}{flexible?" · Flexible":""}</span></span></summary>
   <div className="admin-stack museum-move-entry__details">
   <p>{row.status==="Implemented"?<Check aria-hidden="true"/>:<ClipboardList aria-hidden="true"/>} {flexible?"Area planned":row.status}{row.photo?" · Photo saint":""}</p>
  {row.status!=="Implemented"&&!row.shelf&&(row.tier==="Featured"||row.tier==="Secondary")?<p className="muted">{row.tier==="Featured"?"Primary":"Secondary"} saint: prefer an upper row where space allows, keeping related saints together.</p>:null}
  <p className="museum-planner__route">{flexible?<strong>Place within vitrines {row.flexibleVitrines!.join(", ")} · choose the actual vitrine when placing</strong>:<strong>{row.vitrine?`${row.status==="Implemented"?"Curator-confirmed":"Destination"}: Vitrine ${row.vitrine}${row.shelf?` / ${row.shelf}`:" · Shelf undecided"}`:"No destination assigned yet. Choose one in Plan destinations."}</strong>}</p>
  {row.arrangementNeedsReview?<p role="status"><strong>Review this destination.</strong> The section proposal changed after this destination was saved. The saved location is retained. Use Plan destinations to review or replace it before moving relics; a completed arrangement should be physically checked against the latest proposal.</p>:null}
  {row.lastConfirmed?<p>Last physically confirmed: Vitrine {row.lastConfirmed.vitrine}{row.lastConfirmed.shelf?` / ${row.lastConfirmed.shelf}`:""} · {new Date(row.lastConfirmed.confirmedAt).toLocaleDateString()}. Original inventory locations below are retained as reference.</p>:<p>Starting locations below are from the source inventory; check them in the museum.</p>}
  {row.lastConfirmed?.note?<p>Move note: {row.lastConfirmed.note}</p>:null}
  <button className="museum-admin-button museum-admin-button--secondary" type="button" onClick={showDetails}>{row.hasTree?"Saint photos, biography and family tree":"Saint photos and biography"}</button>
  <MuseumPackagingComponents rows={[row]}/><div><h4>Relics to check</h4>{row.sources.map(source=><div key={source.id} className="museum-planner__source"><strong>{source.vitrine?`Source vitrine ${source.vitrine}`:"Source location not recorded"}{source.shelf?` / ${source.shelf}`:""}</strong><p>{source.relics||"Relic description not recorded"}{source.quantity?` · Quantity: ${source.quantity}`:""}</p>{source.packagingText?<p>Container: {source.packagingText}</p>:null}{source.shared?<p>Shared entry: check the other saints before moving its contents. This confirmation applies only to {row.name}.</p>:null}</div>)}</div>
  {(row.status==="Planned"||flexible)&&canEdit?<details className="museum-planner__completion"><summary>Confirm completed arrangement</summary>
   <form onSubmit={event=>{
    event.preventDefault();const form=new FormData(event.currentTarget);setError("");
    startTransition(async()=>{try{const result=await completeMovePlanAction({placementId:row.id,revision:row.revision,planRevision,vitrine:flexible?String(form.get("vitrine")||""):undefined,
     checkedSourceIds:form.getAll("source"),shelf:String(form.get("shelf")||""),note:String(form.get("note")||""),
     physicalConfirmation:form.get("physical")==="on",inventoryAcknowledged:form.get("inventory")==="on"});
     if(result.error)setError(result.error);else {onComplete();router.refresh();}
    }catch{setError("Could not confirm the save. Reload to check the arrangement before retrying.");}});
   }}>
    <fieldset className="admin-field form-stack" disabled={pending}>
     {flexible?<label>Where did you place this saint?<select name="vitrine" required defaultValue=""><option value="" disabled>Choose the actual vitrine</option>{row.flexibleVitrines!.map(number=><option key={number} value={number}>Vitrine {number}</option>)}</select></label>:<p>Destination: <strong>Vitrine {row.vitrine}</strong>. Only confirm when this saint’s intended arrangement is in place.</p>}
     {row.sources.map((source,index)=><label className="museum-planner__member" key={source.id}><input required type="checkbox" name="source" value={source.id}/><span>I checked entry {index+1}: {source.relics||"Description missing"} (source {source.vitrine||"unknown"}{source.shelf?` / ${source.shelf}`:""}).</span></label>)}
     <label>Final shelf / position (optional)<input name="shelf" defaultValue={row.shelf} maxLength={100}/></label>
     <label>Move note (optional)<textarea name="note" maxLength={2000} rows={2}/></label>
     <label className="museum-planner__member"><input required type="checkbox" name="physical"/><span>I have physically checked that the latest arrangement is in place at this destination.</span></label>
     <label className="museum-planner__member"><input required type="checkbox" name="inventory"/><span>I understand that the complete relic inventory has not been verified. This records my confirmation, not individual relic-location verification.</span></label>
     {error?<p role="alert">{error}</p>:null}
     <button className="museum-admin-button" type="submit">{pending?"Saving…":"Mark arrangement implemented"}</button>
    </fieldset>
   </form>
  </details>:null}
   </div>
  </details>
  {row.hasTree?<div className="review-actions"><button type="button" className="museum-admin-button museum-admin-button--secondary" aria-haspopup="dialog" onClick={()=>setTreeOpen(true)}>View family tree</button></div>:null}
  {treeOpen?<MuseumDetailDialog titleId={`${titleId}-tree`} kicker="Family tree" closeLabel="Close family tree" onClose={()=>setTreeOpen(false)}><h2 id={`${titleId}-tree`}>{row.name}</h2><MuseumSaintTree saintId={row.saintId} familyKey={row.familyKey} name={row.name} museum="vrindavan" showStatus/></MuseumDetailDialog>:null}
  {open?<MuseumDetailDialog titleId={titleId} kicker="Saint reference" closeLabel="Close saint reference" onClose={()=>setOpen(false)}>
   <h2 id={titleId}>{row.name}</h2>{loading?<p role="status">Loading saint reference…</p>:null}
   {detailError?<p role="alert">Could not load the reference. <button type="button" onClick={showDetails}>Retry</button></p>:null}
   {detail?<>{detail.profile?<MuseumSaintProfile profile={detail.profile} titleId={`${titleId}-profile`}/>:<p>No biography is recorded yet.</p>}{row.hasTree?<MuseumSaintTree saintId={row.saintId} name={row.name} familyKey={detail.familyKey} museum="vrindavan" showStatus/>:null}</>:null}
  </MuseumDetailDialog>:null}
 </article>;
}
