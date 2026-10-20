"use client";
import {useId,useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import {Check,ClipboardList} from "lucide-react";
import {vitrineNumber,vrindavanVitrines,type PlannerData,type PlannerRow} from "@/lib/museum-move-planner-domain";
import {completeMovePlanAction,loadMoveSaintAction} from "@/app/vrindavanadmin/plan/actions";
import {MuseumDetailDialog} from "./museum-detail-dialog";
import {MuseumSaintProfile} from "./museum-saint-profile";
import {MuseumSaintTree} from "./museum-live-trees";

function currentVitrines(row:PlannerRow){return row.lastConfirmed?[row.lastConfirmed.vitrine]:row.sources.map(source=>source.vitrine);}
export function MuseumMoveList({data,canEdit}:{data:PlannerData;canEdit:boolean}){
 const [group,setGroup]=useState<"destination"|"source">("destination");
 const [number,setNumber]=useState(""),[query,setQuery]=useState("");
 const [progress,setProgress]=useState("remaining");
 const [notice,setNotice]=useState("");
 const all=data.rows.filter(row=>row.status!=="Proposed");
 const rows=all.filter(row=>(progress==="all"||(progress==="remaining"?row.status==="Planned":row.status==="Implemented"))&&(!number||(group==="destination"?row.vitrine===number:currentVitrines(row).some(v=>vitrineNumber(v)===number)))&&row.name.toLowerCase().includes(query.toLowerCase()));
 return <section className="admin-stack">
  <div className="section-heading"><div><h2>Move-day checklist</h2><p>{all.filter(row=>row.status==="Implemented").length} implemented · {all.filter(row=>row.status==="Planned").length} still to do</p></div><button className="museum-admin-button museum-admin-button--secondary" onClick={()=>window.print()}>Print this list</button></div>
  {notice?<p role="status">{notice}</p>:null}
  <div className="museum-planner__filters">
   <label>Show<select value={progress} onChange={event=>setProgress(event.target.value)}><option value="remaining">Still to do</option><option value="completed">Implemented</option><option value="all">All planned moves</option></select></label>
   <label>Organize by<select value={group} onChange={event=>setGroup(event.target.value as typeof group)}><option value="destination">Destination vitrine</option><option value="source">Starting vitrine</option></select></label>
   <label>Vitrine<select value={number} onChange={event=>setNumber(event.target.value)}><option value="">All vitrines</option>{vrindavanVitrines.map(n=><option key={n}>{n}</option>)}</select></label>
   <label>Find a saint<input type="search" value={query} onChange={event=>setQuery(event.target.value)}/></label>
  </div>
  <p>{rows.length} {rows.length===1?"saint":"saints"} shown. Check the listed relics, place them at the destination, then confirm the saint’s arrangement. Leave a partial or uncertain move planned.</p>
  {!rows.length?<p>No moves match these filters. You can assign destinations in Plan destinations or choose another progress filter.</p>:null}
  {[...rows].sort((a,b)=>(group==="destination"?a.vitrine:currentVitrines(a)[0]||"").localeCompare(group==="destination"?b.vitrine:currentVitrines(b)[0]||"",undefined,{numeric:true})||a.name.localeCompare(b.name)).map(row=><MoveCard key={`${row.id}:${row.revision}`} row={row} canEdit={canEdit} onComplete={()=>setNotice(`${row.name}: arrangement recorded as implemented.`)}/>)}
 </section>;
}
function MoveCard({row,canEdit,onComplete}:{row:PlannerRow;canEdit:boolean;onComplete:()=>void}){
 const router=useRouter(),titleId=useId();
 const [pending,startTransition]=useTransition(),[error,setError]=useState("");
 const [open,setOpen]=useState(false),[loading,setLoading]=useState(false),[detailError,setDetailError]=useState(false);
 const [detail,setDetail]=useState<Awaited<ReturnType<typeof loadMoveSaintAction>>|null>(null);
 const showDetails=async()=>{
  setOpen(true);if(detail)return;setLoading(true);setDetailError(false);
  try{setDetail(await loadMoveSaintAction(row.saintId));}catch{setDetailError(true);}finally{setLoading(false);}
 };
 return <article className="museum-planner__move admin-stack">
  <div className="section-heading"><div><h3>{row.name}</h3><p>{row.section}{row.photo?" · Photo saint":""}</p></div><span>{row.status==="Implemented"?<Check aria-hidden="true"/>:<ClipboardList aria-hidden="true"/>} {row.status}</span></div>
  <p className="museum-planner__route"><strong>{row.status==="Implemented"?"Curator-confirmed":"Destination"}: Vitrine {row.vitrine}{row.shelf?` / ${row.shelf}`:" · Shelf undecided"}</strong></p>
  {row.lastConfirmed?<p>Last physically confirmed: Vitrine {row.lastConfirmed.vitrine}{row.lastConfirmed.shelf?` / ${row.lastConfirmed.shelf}`:""} · {new Date(row.lastConfirmed.confirmedAt).toLocaleDateString()}. Original inventory locations below are retained as reference.</p>:<p>Starting locations below are from the source inventory; check them in the museum.</p>}
  {row.lastConfirmed?.note?<p>Move note: {row.lastConfirmed.note}</p>:null}
  <button className="museum-admin-button museum-admin-button--secondary" type="button" onClick={showDetails}>Saint photos, biography and family tree</button>
  <div><h4>Relics to check</h4>{row.sources.map(source=><div key={source.id} className="museum-planner__source"><strong>{source.vitrine?`Source vitrine ${source.vitrine}`:"Source location not recorded"}{source.shelf?` / ${source.shelf}`:""}</strong><p>{source.relics||"Relic description not recorded"}{source.quantity?` · Quantity: ${source.quantity}`:""}</p>{source.shared?<p>Shared entry: check the other saints before moving its contents. This confirmation applies only to {row.name}.</p>:null}</div>)}</div>
  {row.status==="Planned"&&canEdit?<details className="museum-planner__completion"><summary>Confirm completed arrangement</summary>
   <form onSubmit={event=>{
    event.preventDefault();const form=new FormData(event.currentTarget);setError("");
    startTransition(async()=>{try{const result=await completeMovePlanAction({placementId:row.id,revision:row.revision,
     checkedSourceIds:form.getAll("source"),shelf:String(form.get("shelf")||""),note:String(form.get("note")||""),
     physicalConfirmation:form.get("physical")==="on",inventoryAcknowledged:form.get("inventory")==="on"});
     if(result.error)setError(result.error);else {onComplete();router.refresh();}
    }catch{setError("Could not confirm the save. Reload to check the arrangement before retrying.");}});
   }}>
    <fieldset className="admin-field form-stack" disabled={pending}>
     <p>Destination: <strong>Vitrine {row.vitrine}</strong>. Only confirm when this saint’s intended arrangement is in place.</p>
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
  {open?<MuseumDetailDialog titleId={titleId} kicker="Saint reference" closeLabel="Close saint reference" onClose={()=>setOpen(false)}>
   <h2 id={titleId}>{row.name}</h2>{loading?<p role="status">Loading saint reference…</p>:null}
   {detailError?<p role="alert">Could not load the reference. <button type="button" onClick={showDetails}>Retry</button></p>:null}
   {detail?<>{detail.profile?<MuseumSaintProfile profile={detail.profile} titleId={`${titleId}-profile`}/>:<p>No biography is recorded yet.</p>}<MuseumSaintTree saintId={row.saintId} name={row.name} familyKey={detail.familyKey} museum="vrindavan" showStatus/></>:null}
  </MuseumDetailDialog>:null}
 </article>;
}
