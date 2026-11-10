"use client";

import React,{useEffect,useMemo,useState,type ReactNode} from "react";
import {companionLocationLabel,currentLocationLabel} from "@/lib/spn-move-guide";
import {emptyReviewFilters,filterReviewRecords,partitionReviewRecords,sortReviewRecords,type FinalReviewRecord,type ReviewFilters,type ReviewFlag} from "@/lib/museum-final-review-view";
import {spnMuseumLayout} from "@/lib/spn-museum-layout";
import {finalReviewProgress} from "@/lib/museum-final-review-progress";
import {MuseumRoomPlan} from "./museum-room-plan";
import {AdminViewTabs} from "./admin-view-tabs";
import {MuseumDetailDialog} from "./museum-detail-dialog";

export type FinalReviewAction =
  | {action:"place"}
  | {action:"review"}
  | {action:"unreview"}
  | {action:"undo"}
  | {action:"destination";vitrine:string;shelf:string;moved:boolean;note:string;notOnDisplay:boolean}
  | {action:"flag";type:ReviewFlag["type"];note:string}
  | {action:"resolve"}
  | {action:"note";note:string};

type Props={
  emptyVitrines?:string[];
  mode:"final"|"unaddressed";
  records:FinalReviewRecord[];
  vitrines:string[];
  selected:string;
  onSelect:(code:string)=>void;
  tones:Record<string,string>;
  canEdit:boolean;
  savingSources:ReadonlySet<string>;
  pendingSources:ReadonlySet<string>;
  errors:Record<string,string>;
  onRetry:(sourceId:string)=>Promise<void>;
  onAction:(record:FinalReviewRecord,action:FinalReviewAction)=>Promise<void>;
  renderWork:(record:FinalReviewRecord)=>ReactNode;
};
const pageSize=30;

function LocationFilters({value,onChange,vitrines}:{value:ReviewFilters;onChange:(value:ReviewFilters)=>void;vitrines:string[]}){
  return <div className="museum-review-filters">
    <label className="admin-field"><span>Find a saint</span><input type="search" value={value.query} onChange={event=>onChange({...value,query:event.target.value})}/></label>
    {([['starting','Starting vitrine'],['proposed','Proposed vitrine'],['current','Current vitrine']] as const).map(([key,label])=><label className="admin-field" key={key}><span>{label}</span><select value={value[key]} onChange={event=>onChange({...value,[key]:event.target.value})}><option value="">All</option>{vitrines.map(code=><option key={code} value={code}>{code}</option>)}{key!=="proposed"?<option value="staging">Staging area</option>:null}<option value="unknown">Not recorded</option></select></label>)}
    <label className="admin-field"><span>Preliminary note</span><select value={value.noteStatus??""} onChange={event=>onChange({...value,noteStatus:event.target.value as ReviewFilters["noteStatus"]})}><option value="">All</option><option value="needed">Needs a note</option><option value="added">Note added</option></select></label>
  </div>;
}

function ReviewPanel({title,records,vitrines,renderRow,filters,setFilters}:{title:string;records:FinalReviewRecord[];vitrines:string[];renderRow:(record:FinalReviewRecord)=>ReactNode;filters:ReviewFilters;setFilters:(value:ReviewFilters)=>void}){
  const [page,setPage]=useState(0);
  const filtered=useMemo(()=>sortReviewRecords(filterReviewRecords(records,filters)),[records,filters]);
  useEffect(()=>setPage(0),[filters]);
  const lastPage=Math.max(0,Math.ceil(filtered.length/pageSize)-1),currentPage=Math.min(page,lastPage);
  return <section className="museum-admin-panel" aria-label={title}>
    <div className="section-heading"><h2>{title}</h2><span className="muted">{records.length}</span></div>
    <LocationFilters value={filters} onChange={value=>{setFilters(value);setPage(0);}} vitrines={vitrines}/>
    <p className="muted" role="status">{filtered.length} {filtered.length===1?"record":"records"} · {records.filter(record=>!record.preliminaryNote?.trim()).length} need a note · {records.filter(record=>record.preliminaryNote?.trim()).length} with notes (queue totals)</p>
    {filtered.slice(currentPage*pageSize,(currentPage+1)*pageSize).map(renderRow)}
    {!filtered.length?<p>{records.length?"No records match these filters.":title==="Flagged records"?"No open flags.":"No unaddressed records."}</p>:null}
    {lastPage>0?<nav className="review-actions" aria-label={`${title} pages`}><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={!currentPage} onClick={()=>setPage(currentPage-1)}>Previous</button><span>Page {currentPage+1} of {lastPage+1}</span><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={currentPage===lastPage} onClick={()=>setPage(currentPage+1)}>Next</button></nav>:null}
  </section>;
}

export function MuseumFinalReview({emptyVitrines=[],mode,records,vitrines,selected,onSelect,tones,canEdit,savingSources,pendingSources,errors,onRetry,onAction,renderWork}:Props){
  const [query,setQuery]=useState("");
  const [queue,setQueue]=useState<"flagged"|"unaddressed">("flagged");
  const [flaggedFilters,setFlaggedFilters]=useState(emptyReviewFilters);
  const [remainingFilters,setRemainingFilters]=useState(emptyReviewFilters);
  const [dialog,setDialog]=useState<{record:FinalReviewRecord;kind:"flag"|"destination"|"undo"|"note"}|null>(null);
  const [flagType,setFlagType]=useState<ReviewFlag["type"]>("missing"),[note,setNote]=useState("");
  const [target,setTarget]=useState(""),[shelf,setShelf]=useState(""),[moved,setMoved]=useState(false),[notOnDisplay,setNotOnDisplay]=useState(false);
  const [dialogError,setDialogError]=useState("");
  const groups=useMemo(()=>partitionReviewRecords(records),[records]);
  const reviewProgress=useMemo(()=>finalReviewProgress(records),[records]);
  const counts=useMemo(()=>{const result:Record<string,number>={};for(const record of records)if(record.destination)result[record.destination]=(result[record.destination]??0)+1;return result;},[records]);
  const selectedRecords=useMemo(()=>sortReviewRecords(records.filter(record=>record.destination===selected)),[records,selected]);
  const shown=useMemo(()=>filterReviewRecords(selectedRecords,{...emptyReviewFilters,query}),[selectedRecords,query]);
  useEffect(()=>setQuery(""),[selected]);
  function open(record:FinalReviewRecord,kind:"flag"|"destination"|"undo"|"note"){
    setDialog({record,kind});setDialogError("");setFlagType(record.flag?.type??"missing");setNote(kind==="note"?record.preliminaryNote??"":kind==="flag"?record.flag?.note??"":"");setTarget(record.destination);setShelf(record.destinationShelf??"");setMoved(false);setNotOnDisplay(false);
  }
  async function submit(){
    if(!dialog)return;
    const action:FinalReviewAction=dialog.kind==="note"?{action:"note",note}:dialog.kind==="flag"?{action:"flag",type:flagType,note}:dialog.kind==="undo"?{action:"undo"}:{action:"destination",vitrine:target,shelf,moved,note,notOnDisplay};
    setDialogError("");
    try{if(pendingSources.has(dialog.record.sourceId))await onRetry(dialog.record.sourceId);else await onAction(dialog.record,action);setDialog(null);}catch(error){setDialogError(error instanceof Error?error.message:"Could not save. Your details are still here.");}
  }
  function row(record:FinalReviewRecord){
    const saving=savingSources.has(record.sourceId),pending=pendingSources.has(record.sourceId);
    return <article className={`museum-guide-check museum-final-review__record${record.preliminaryNote?.trim()?" museum-final-review__record--noted":""}`} key={record.sourceId} aria-label={record.name}>
      <input type="checkbox" aria-label={record.destination?`Finally review ${record.name} in Vitrine ${record.destination}`:`No destination for ${record.name}`} checked={record.finallyReviewed===true} disabled={!canEdit||saving||pending||!record.destination||record.decision==="not_on_display"||record.row.identityChanged} onChange={()=>void onAction(record,{action:record.finallyReviewed?"unreview":"review"}).catch(()=>undefined)}/>
      <div className="museum-guide-check__body">
        <details><summary>{record.name}<span className="museum-guide-tier">{record.tier}</span></summary>{record.description?<p>{record.description}</p>:null}{record.section?<p className="muted">{record.region?record.region+" · ":""}{record.section}</p>:null}</details>
        <dl className="museum-review-locations"><div><dt>Starting</dt><dd>{currentLocationLabel(record.row.original)}</dd></div><div><dt>Proposed</dt><dd>{record.destination?`Vitrine ${record.destination}${record.destinationShelf?` · Shelf ${record.destinationShelf}`:""}`:"Not assigned"}</dd></div><div><dt>Current</dt><dd>{companionLocationLabel(record.row)}</dd></div></dl>
        {record.decision==="not_on_display"?<small className="muted">Not on display</small>:null}
        {record.flag?<div className="museum-review-flag"><strong>{record.flag.type==="missing"?"Missing":"Flagged · Other"}</strong>{record.flag.note?<p>{record.flag.note}</p>:null}<button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={!canEdit||saving||pending} onClick={()=>void onAction(record,{action:"resolve"}).catch(()=>undefined)}>Resolve flag</button></div>:null}
        {saving?<small role="status">Saving…</small>:null}{errors[record.sourceId]?<p role="alert">{errors[record.sourceId]}{pending?<button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={saving} onClick={()=>void onRetry(record.sourceId).catch(()=>undefined)}>Retry same save</button>:null}</p>:null}
        {record.row.identityChanged?<small>Identity changed. Refresh and review this record before saving.</small>:null}
        {record.preliminaryNote?<div className="museum-review-preliminary-note"><strong>Preliminary note · To discuss</strong><p>{record.preliminaryNote}</p></div>:null}
        {mode==="unaddressed"||record.preliminaryNote?<button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={!canEdit||saving||pending} onClick={()=>open(record,"note")}>{record.preliminaryNote?"Edit preliminary note":"Add preliminary note"}</button>:null}
        {renderWork(record)}
      </div>
      <div className="review-actions"><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={!canEdit||saving||pending} onClick={()=>open(record,"destination")}>Decline / change</button><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={!canEdit||saving||pending} onClick={()=>open(record,"flag")}>{record.flag?"Edit flag":"Flag"}</button></div>
    </article>;
  }
  const dialogBusy=!!dialog&&savingSources.has(dialog.record.sourceId);
  const dialogLocked=dialogBusy||!!dialog&&pendingSources.has(dialog.record.sourceId);
  return <>
    {mode==="unaddressed"?<div className="museum-companion__layout"><div className="museum-companion__main">
      <section className="museum-admin-panel museum-companion__task"><div className="section-heading"><h2>Room layout</h2><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={!flaggedFilters.proposed&&!remainingFilters.proposed} onClick={()=>{setFlaggedFilters({...flaggedFilters,proposed:""});setRemainingFilters({...remainingFilters,proposed:""});}}>All vitrines</button></div><MuseumRoomPlan layout={spnMuseumLayout} mode="browse" selected={[...new Set([flaggedFilters.proposed,remainingFilters.proposed].filter(Boolean))]} counts={counts} tones={tones} progress={reviewProgress.vitrines} emptyVitrines={emptyVitrines} onSelect={code=>{onSelect(code);setFlaggedFilters({...flaggedFilters,proposed:code});setRemainingFilters({...remainingFilters,proposed:code});}}/></section>
      <div className="museum-companion__guide museum-review-panels"><AdminViewTabs label="Review queues" value={queue} onChange={setQueue} options={[{value:"flagged",label:`Flagged (${groups.flagged.length})`},{value:"unaddressed",label:`Unaddressed (${groups.unaddressed.length})`}]}/><ReviewPanel key={queue} title={queue==="flagged"?"Flagged records":"Unaddressed records"} records={groups[queue]} vitrines={vitrines} renderRow={row} filters={queue==="flagged"?flaggedFilters:remainingFilters} setFilters={queue==="flagged"?setFlaggedFilters:setRemainingFilters}/></div>
    </div></div>:<div className="museum-companion__layout"><div className="museum-companion__main">
      <section className="museum-admin-panel museum-companion__task"><h2>Room layout</h2><MuseumRoomPlan layout={spnMuseumLayout} mode="browse" selected={[selected]} counts={counts} tones={tones} progress={reviewProgress.vitrines} emptyVitrines={emptyVitrines} onSelect={onSelect}/></section>
      <div className="museum-companion__guide"><section className="museum-admin-panel"><div className="section-heading"><h2>Final review</h2><label className="admin-field"><span>Vitrine</span><select value={selected} onChange={event=>onSelect(event.target.value)}>{vitrines.map(code=><option key={code} value={code}>{code}</option>)}</select></label></div><h3>Complete vitrine checklist · {selectedRecords.length}</h3><label className="admin-field"><span>Find in this vitrine</span><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Saint or city"/></label>{shown.map(row)}{!shown.length?<p>{selectedRecords.length?"No matching saints.":"No records assigned to this vitrine."}</p>:null}</section></div>
    </div></div>}
    {dialog?<MuseumDetailDialog titleId="final-review-dialog-title" kicker="Final review" closeLabel="Close review" onClose={()=>{if(!dialogBusy)setDialog(null);}}><h2 id="final-review-dialog-title">{dialog.kind==="note"?"Preliminary resolution note":dialog.kind==="flag"?"Flag record":dialog.kind==="undo"?"Undo placement check?":"Change destination"}</h2><p>{dialog.record.name}</p><form onSubmit={event=>{event.preventDefault();void submit();}}>
      {dialog.kind==="note"?<p className="muted">A hypothesis to discuss with Swami Keshava. Saving does not resolve the flag or confirm a placement.</p>:dialog.kind==="flag"?<label className="admin-field"><span>Flag type</span><select value={flagType} disabled={dialogLocked} onChange={event=>setFlagType(event.target.value as ReviewFlag["type"])}><option value="missing">Missing</option><option value="other">Other</option></select></label>:dialog.kind==="undo"?<p>This corrects a mistaken check; it does not record a physical return.</p>:<><label className="room-move__check"><input type="checkbox" checked={notOnDisplay} disabled={dialogLocked} onChange={event=>setNotOnDisplay(event.target.checked)}/>Not on display</label>{!notOnDisplay?<><label className="admin-field"><span>New vitrine</span><select required value={target} disabled={dialogLocked} onChange={event=>setTarget(event.target.value)}><option value="">Choose a vitrine</option>{vitrines.map(code=><option key={code} value={code}>{code}</option>)}</select></label><label className="admin-field"><span>Shelf (optional)</span><input maxLength={100} value={shelf} disabled={dialogLocked} onChange={event=>setShelf(event.target.value)}/></label><fieldset disabled={dialogLocked}><legend>Placement</legend><label className="room-move__check"><input type="radio" name="review-placement" checked={!moved} onChange={()=>setMoved(false)}/>Proposed</label><label className="room-move__check"><input type="radio" name="review-placement" checked={moved} onChange={()=>setMoved(true)}/>Already moved</label></fieldset></>:null}</>}
      {dialog.kind==="note"||dialog.kind==="flag"||notOnDisplay?<label className="admin-field"><span>{dialog.kind==="note"?"Preliminary note (clear to remove)":"Note (optional)"}</span><textarea maxLength={2000} value={note} disabled={dialogLocked} onChange={event=>setNote(event.target.value)}/></label>:null}
      {dialogError?<p role="alert">{dialogError}</p>:null}<div className="review-actions"><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={dialogBusy} onClick={()=>setDialog(null)}>Cancel</button><button type="submit" className="museum-admin-button" disabled={dialogBusy}>{dialogBusy?"Saving…":dialog.kind==="note"?"Save note":dialog.kind==="flag"?"Save flag":dialog.kind==="undo"?"Undo check":notOnDisplay?"Save decision":moved?"Save and confirm moved":"Save proposal"}</button></div>
    </form></MuseumDetailDialog>:null}
  </>;
}
