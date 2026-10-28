"use client";
import {useEffect,useRef,useState} from "react";
import {SPN_REGION_GROUPS} from "@/lib/spn-region-navigation";
import {MuseumDisplayWork} from "./museum-display-work";
import {useMuseumDisplayWork,type DisplayTask} from "./use-museum-display-work";
import {MuseumDetailDialog} from "./museum-detail-dialog";
import {MuseumGuideFamilyTree} from "./museum-guide-family-tree";
import {AdminViewTabs} from "./admin-view-tabs";
import {MuseumRoomPlan} from "./museum-room-plan";
import {spnMuseumLayout} from "@/lib/spn-museum-layout";
import {currentLocationLabel,isPlaced,reportedPlacementsRecorded,cityFitsStarterCase,type StarterMoveGuide,type GuideGroup,type PhysicalState,type GuideDecision,type CompanionRow,type PhysicalLocation} from "@/lib/spn-move-guide";

type Phase="starter"|"datta"|"ram-bhakti";
type Step="clear"|"families"|"cities"|"staging"|"tasks";
type RequestBody=Record<string,unknown>;
export function SpnRoomMoveCompanion({guide:initialGuide,initialPhysical,canManage,workflow="guided",allowClear:initialAllowClear=true,phaseLabel:initialPhaseLabel="Starter row",phase:initialPhase="starter",phaseGuides}:{guide:StarterMoveGuide;initialPhysical:PhysicalState|null;canManage:boolean;workflow?:"guided"|"room";allowClear?:boolean;phaseLabel?:string;phase?:Phase;phaseGuides?:Record<Phase,StarterMoveGuide>}){
 const [phase,setPhase]=useState<Phase>(initialPhase);
 const guide=phaseGuides?.[phase]??initialGuide;
 const allowClear=phaseGuides?phase==="starter":initialAllowClear;
 const phaseLabel=guide.phaseLabel??initialPhaseLabel;
 const [physical,setPhysical]=useState(initialPhysical),[step,setStep]=useState<Step>("families"),[selected,setSelected]=useState(guide.vitrines[0]?.code??"2");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState(""),[query,setQuery]=useState(""),[showAlternatives,setShowAlternatives]=useState(false);
 const [saintSearch,setSaintSearch]=useState(""),[startFilter,setStartFilter]=useState(""),[endFilter,setEndFilter]=useState("");
 const [alternativeOptions,setAlternativeOptions]=useState<string[]>([]);
 const [declineSource,setDeclineSource]=useState<string|null>(null);
 const [alternativeVitrine,setAlternativeVitrine]=useState(""),[alternativeShelf,setAlternativeShelf]=useState("");
 const [undoSource,setUndoSource]=useState<string|null>(null);
 const undoRow=rowsForUndo();
 function rowsForUndo(){return physical?.rows.find(row=>row.sourceId===undoSource);}
 const [vitrineSearch,setVitrineSearch]=useState("");
 const [savingSources,setSavingSources]=useState<string[]>([]);
 useEffect(()=>setVitrineSearch(""),[selected]);
 const displayWork=useMuseumDisplayWork(guide.vitrines.flatMap(vitrine=>[...vitrine.families,...vitrine.cityGroups].flatMap(group=>group.sourceIds)));
 const [taskBusy,setTaskBusy]=useState<string|null>(null);
 const [taskError,setTaskError]=useState("");
 const [allCities,setAllCities]=useState(false);
 const [acknowledged,setAcknowledged]=useState(false),[clearConfirmed,setClearConfirmed]=useState(false);
 const [decisions,setDecisions]=useState<GuideDecision[]>([]),[decisionsLoaded,setDecisionsLoaded]=useState(false);
 const guideVersion=useRef(guide.version);guideVersion.current=guide.version;
 const pending=useRef(false),retry=useRef<{method:string;body:RequestBody;url:string}|null>(null);
 const view=guide.vitrines.find(v=>v.code===selected);
 const editable=canManage&&!!physical&&!busy&&!displayWork.busy&&!retry.current;
 const rows=(physical?.rows??[]).map(row=>row.currentBasis==="confirmed"&&row.current?{...row,current:{...row.current,shelf:displayWork.shelf(row)}}:row);
 const occupants=rows.filter(r=>r.current?.kind==="vitrine"&&r.current.code===selected);
 const unmapped=physical?.unmappedCurrentLocations.filter(r=>r.location.kind==="vitrine"&&r.location.code===selected)??[];
 const staged=rows.filter(r=>r.current?.kind==="table");
 const initiallyEmpty=["76","78"].includes(selected)&&!occupants.length;
 const reported=guide.reportedPlacements.map(p=>({placement:p,row:rows.find(r=>r.sourceId===p.sourceId)}));
 const receiptProof=physical?.reportedPlacementReceipts;
 const durableReported=receiptProof?.complete&&receiptProof.guideContext.guideVersion===guide.version&&receiptProof.guideContext.contentDigest===guide.contentDigest&&receiptProof.guideContext.assignmentDigest===guide.assignmentDigest;
 const reportsSaved=durableReported||(!!physical&&reportedPlacementsRecorded(physical,guide.reportedPlacements))||reported.every(({placement,row})=>row&&isPlaced(row,placement.destination));
 const reportsBlocked=reported.some(({placement,row})=>!row||blocked(row)||(row.currentBasis==="confirmed"&&!isPlaced(row,placement.destination)));
 function recordReported(){
  if(!editable||reportsBlocked)return;
  void send("POST",{museumId:"museum-spn",clientRequestId:crypto.randomUUID(),confirmedDate:"2026-10-27",datePrecision:"date",evidence:"User confirmed these 23 placements in the 27 October starter-row screenshots; destination vitrine confirmed, shelf unspecified.",physicalConfirmation:true,inventoryAcknowledged:true,guideContext:{guideVersion:guide.version,contentDigest:guide.contentDigest,assignmentDigest:guide.assignmentDigest},
   records:reported.map(({placement,row})=>({sourceId:row!.sourceId,saintId:row!.saintId,expectedLocationVersion:row!.currentVersion,expectedCurrentRevision:row!.currentRevision,expectedSourceRevision:row!.sourceRevision,to:{kind:"vitrine",code:placement.destination,label:"Vitrine "+placement.destination}}))});
 }
 const pilotIds=new Set([...guide.vitrines.flatMap(v=>[...v.families,...v.cityGroups].flatMap(g=>g.sourceIds)),...(guide.transitionSourceIds??[])]);
 const outgoing=(guide.transitionSourceIds??[]).filter(id=>guide.reportedPlacements.some(p=>p.sourceId===id&&p.destination===selected));
 const selectedIds=[...(view?.families??[]),...(view?.cityGroups??[])].flatMap(g=>g.sourceIds);
 const selectedPlaced=selectedIds.filter(id=>{const row=rows.find(r=>r.sourceId===id);return row&&isPlaced(row,selected);}).length;
 const guideById=new Map(guide.entries.map(e=>[e.sourceId,e]));
 function switchPhase(next:Phase){
  if(next===phase||!phaseGuides||busy||displayWork.busy||!!retry.current||taskBusy!==null)return;
  setPhase(next);setSelected(phaseGuides[next].vitrines[0]?.code??"");setStep("families");
  setDecisions([]);setDecisionsLoaded(false);setSaintSearch("");setStartFilter("");setEndFilter("");setVitrineSearch("");
  setClearConfirmed(false);setAcknowledged(false);setUndoSource(null);setDeclineSource(null);setError("");setMessage("");
  if(window.location.protocol!=="file:"){const url=new URL(window.location.href);if(next==="starter")url.searchParams.delete("phase");else url.searchParams.set("phase",next);window.history.replaceState(null,"",url);}
 }
 async function send(method:string,body:RequestBody,url="/api/admin/museum-physical-locations"){
  if(pending.current)return;
  pending.current=true;setBusy(true);setError("");setMessage("");
  setSavingSources(Array.isArray(body.records)?body.records.map((record:{sourceId:string})=>record.sourceId):typeof body.sourceId==="string"?[body.sourceId]:[]);
  retry.current={method,body,url};
  try{
   const response=await fetch(url,{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
   const result=await response.json();
   if(!response.ok){if(response.status<500)retry.current=null;throw new Error(result.error||"Could not save this change.");}
   if(!result.decision&&!Array.isArray(result.rows))throw new Error("The save could not be confirmed. Refresh progress before trying again.");
   if(body.action==="undo"){
    retry.current=null;
    setPhysical(previous=>previous?{...previous,confirmationHistory:[],reportedPlacementReceipts:undefined,rows:previous.rows.map(row=>result.rows.find((next:CompanionRow)=>next.sourceId===row.sourceId)??row)}:result);
    const refreshed=await fetch("/api/admin/museum-physical-locations?museumId=museum-spn",{cache:"no-store"});
    const snapshot=await refreshed.json();
    if(!refreshed.ok||!Array.isArray(snapshot.rows))throw new Error("The check was undone. Refresh progress to load the updated history.");
    setPhysical(snapshot);setMessage("Check undone.");return;
   }
   if(result.decision){setDecisions(previous=>[...previous.filter(d=>d.suggestionId!==result.decision.suggestionId),result.decision]);if(body.decision==="declined")setDeclineSource(null);}
   else setPhysical(previous=>previous?{...previous,confirmationHistory:result.receipt?[result.receipt,...(previous.confirmationHistory??[])]:previous.confirmationHistory,rows:previous.rows.map(row=>result.rows.find((next:CompanionRow)=>next.sourceId===row.sourceId)??row)}:result);retry.current=null;setMessage("Saved.");setAcknowledged(false);setClearConfirmed(false);
  }catch(e){setError(e instanceof Error?e.message:"Could not save. Retry the same action or reload to check its status.");}
  finally{pending.current=false;setBusy(false);setSavingSources([]);}
 }
 async function reload(){
  if(pending.current)return;pending.current=true;setBusy(true);setError("");
  try{const response=await fetch("/api/admin/museum-physical-locations?museumId=museum-spn",{cache:"no-store"});const data=await response.json();if(!response.ok)throw new Error(data.error||"Could not load current locations.");setPhysical(data);await loadDecisions();retry.current=null;setMessage("Current progress loaded.");}
  catch(e){setError(e instanceof Error?e.message:"Could not load current progress.");}finally{pending.current=false;setBusy(false);setSavingSources([]);}
 }
 async function loadDecisions(){
  const response=await fetch("/api/admin/museum-guide-decisions?museumId=museum-spn&guideVersion="+encodeURIComponent(guide.version),{cache:"no-store"});
  const data=await response.json();if(!response.ok)throw new Error(data.error||"Could not load suggestion decisions.");
  if(guideVersion.current===guide.version){setDecisions(data.decisions);setAlternativeOptions(Array.isArray(data.alternativeVitrines)?data.alternativeVitrines:[]);setDecisionsLoaded(true);}
 }
 useEffect(()=>{void loadDecisions().catch(()=>setError("Suggestion decisions could not load. Refresh progress to try again."));},[guide.version]);
 function decide(suggestionId:string,value:GuideDecision["decision"]){
  if(!editable||!decisionsLoaded)return;
  void send("POST",{museumId:"museum-spn",guideVersion:guide.version,contentDigest:guide.contentDigest,assignmentDigest:guide.assignmentDigest,suggestionId,expectedVersion:decisions.find(d=>d.suggestionId===suggestionId)?.version??0,clientRequestId:crypto.randomUUID(),decision:value,note:decisions.find(d=>d.suggestionId===suggestionId)?.note??undefined,...(value==="declined"?{alternativeVitrine:alternativeVitrine||null,alternativeShelf:alternativeVitrine?alternativeShelf.trim()||null:null}:{})},"/api/admin/museum-guide-decisions");
 }
 function openDecline(id:string){setError("");const saved=decisions.find(d=>d.suggestionId===id);setAlternativeVitrine(saved?.alternativeVitrine??"");setAlternativeShelf(saved?.alternativeShelf??"");setDeclineSource(id);}
 function decisionControls(id:string){
  const saved=decisions.find(d=>d.suggestionId===id);const status=saved?.decision??"pending";
  return <div className="review-actions museum-guide-decision" data-status={status}>{status==="pending"?<><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={!editable||!decisionsLoaded} onClick={()=>decide(id,"deferred")}>Defer</button><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={!editable||!decisionsLoaded} onClick={()=>openDecline(id)}>Decline</button></>:<><span className="museum-guide-decision__status">{status==="deferred"?"◷ Deferred":"− Declined"}</span>{status==="declined"?<>{saved?.alternativeVitrine?<small>Alternative: Vitrine {saved.alternativeVitrine}{saved.alternativeShelf?` · Shelf ${saved.alternativeShelf}`:""}</small>:null}<button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={!editable||!decisionsLoaded} onClick={()=>openDecline(id)}>Edit alternative</button></>:null}<button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={!editable||!decisionsLoaded} onClick={()=>decide(id,"pending")} aria-label="Restore suggestion">Restore</button></>}</div>;
 }
 function move(items:CompanionRow[],to:PhysicalLocation,clearedVitrines?:string[]){
  if(!editable)return;
  const now=new Date();const confirmedDate=[now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
  void send("POST",{museumId:"museum-spn",clientRequestId:crypto.randomUUID(),confirmedDate,datePrecision:"date",evidence:"Curator confirmed this physical move in the starter-row companion.",physicalConfirmation:true,inventoryAcknowledged:true,guideContext:{guideVersion:guide.version,contentDigest:guide.contentDigest,assignmentDigest:guide.assignmentDigest},
   records:items.map(r=>({sourceId:r.sourceId,saintId:r.saintId,expectedLocationVersion:r.currentVersion,expectedCurrentRevision:r.currentRevision,expectedSourceRevision:r.sourceRevision,to})),...(clearedVitrines?{clearedVitrines}:{})});
 }
 function togglePlacement(row:CompanionRow,target:string){
  if(isPlaced(row,target)){setUndoSource(row.sourceId);return;}
  move([row],{kind:"vitrine",code:target,label:`Vitrine ${target}`});
 }
 function undoPlacement(){
  if(!undoRow?.undo?.available||!undoRow.undo.receiptId||!editable)return;
  void send("POST",{action:"undo",museumId:"museum-spn",clientRequestId:crypto.randomUUID(),receiptId:undoRow.undo.receiptId,sourceId:undoRow.sourceId,saintId:undoRow.saintId,expectedCurrentRevision:undoRow.currentRevision,expectedSourceRevision:undoRow.sourceRevision,expectedLocationVersion:undoRow.currentVersion,mistakenCheckAcknowledged:true});
  setUndoSource(null);
 }
 function blocked(row:CompanionRow){return row.verifiedItemIds.length>0||row.fixedHousing||row.identityChanged||!!row.movementBlockedReason;}
 function display(sourceId:string,target=selected,allowMove=true,compact=false,showWork=false){
  const row=rows.find(r=>r.sourceId===sourceId),entry=guideById.get(sourceId);
  if(!row)return <p key={sourceId} role="note">{entry?.name??sourceId}: current record unavailable. Reload before recording a move.</p>;
  const placed=isPlaced(row,target);
  const reviewBlock=row.movementBlockedReason||entry?.movementBlockedReason;
  if(workflow==="guided")return <div className="museum-guide-check" key={sourceId} id={compact?undefined:`move-${sourceId}`}>
   <input type="checkbox" aria-label={`Mark ${entry?.name??row.name} placed in Vitrine ${target}`} checked={placed} disabled={!editable||blocked(row)||!target||!allowMove||!!reviewBlock} onChange={()=>togglePlacement(row,target)}/>
   <div className="museum-guide-check__body"><details><summary>{entry?.name??row.name}{compact&&entry?<span className="museum-guide-tier">{entry.tier}</span>:null}</summary><p>{entry?.relicDescription}</p><p>Original: {currentLocationLabel(row.original)}</p><p>{entry?.rationale}</p></details>
    {savingSources.includes(sourceId)?<small role="status">Saving…</small>:null}<small>{placed?"Placed · saved":row.currentBasis==="confirmed"?"Current":"Last recorded"}: {currentLocationLabel(row.current)}{target!==selected?` → Vitrine ${target}`:""}</small>
    {entry?.city?<small>{entry.city}</small>:null}{entry?.lifeStatus?.tag?<small>{entry.lifeStatus.tag}</small>:null}{row.identityChanged?<small>Identity changed. Reload and review before recording a move.</small>:!reviewBlock&&blocked(row)?<small>Fixed housing or a verified inventory item needs its existing item-move workflow.</small>:null}{reviewBlock?<p role="note">{reviewBlock}</p>:null}{entry?.reviewNotes?.map(note=><small key={note}>{note}</small>)}{showWork&&allowMove?<MuseumDisplayWork name={entry?.name??row.name} shelf={displayWork.shelf(row)} canEditShelf={placed} canManage={editable&&displayWork.loaded} onShelfSave={value=>displayWork.saveShelf(row,value)} onTaskAdd={title=>displayWork.addTask(row,title)}/>:null}
   </div>{!placed&&canManage&&allowMove&&pilotIds.has(sourceId)?decisionControls("row:"+sourceId):null}
  </div>;
  return <article className="room-move__display" key={sourceId} id={`move-${sourceId}`}>
   <div><p className="eyebrow">{entry?.tier??"Display"}{entry?.city?` · ${entry.city}`:""}</p><h3>{entry?.name??row.name}</h3><p>{entry?.relicDescription}</p></div>
   <div><small>{row.currentBasis==="confirmed"?"Current location":"Last recorded location"}</small><strong>{currentLocationLabel(row.current)}</strong><p>{target?`To Vitrine ${target}`:"No destination in this guide"}</p>{reviewBlock?<p role="note">{reviewBlock}</p>:null}{entry?.reviewNotes?.map(note=><p key={note} className="muted">{note}</p>)}
    <label className="room-move__check"><input type="checkbox" checked={placed} disabled={!editable||blocked(row)||!target||!allowMove||!!reviewBlock} onChange={()=>togglePlacement(row,target)}/>{placed?"Placed · saved":"Placed in this vitrine"}</label>

   {!placed&&canManage&&allowMove&&pilotIds.has(sourceId)?decisionControls("row:"+sourceId):null}</div>
   <details><summary>Details & original location</summary><p>Original: {currentLocationLabel(row.original)}</p><p>{entry?.rationale}</p>{row.identityChanged?<p>This source identity has changed. Reload and review it before recording a move.</p>:reviewBlock?<p>{reviewBlock}</p>:blocked(row)?<p>Fixed housing or a verified inventory item needs its existing item-move workflow.</p>:null}<small>Source record: {sourceId}</small></details>
  </article>;
 }
 async function completeTask(task:DisplayTask,completed:boolean){
  if(taskBusy)return;setTaskBusy(task.id);setTaskError("");
  try{await displayWork.completeTask(task,completed);}catch(error){setTaskError(error instanceof Error?error.message:"Could not update this to-do.");}finally{setTaskBusy(null);}
 }
 function taskList(){return <>{displayWork.error?<p role="alert">{displayWork.error} <button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>void displayWork.reload().catch(error=>setTaskError(error.message))}>Retry</button></p>:null}{taskError?<p role="alert">{taskError}</p>:null}{!displayWork.loaded?<p>Loading to-dos…</p>:!displayWork.tasks.length?<p>No to-dos yet. Add one from a saint’s final checklist entry.</p>:[...displayWork.tasks].sort((a,b)=>Number(a.status==="completed")-Number(b.status==="completed")).map(task=>{const entry=guideById.get(task.sourceId);return <label className="museum-guide-check" key={task.id}><input type="checkbox" checked={task.status==="completed"} disabled={!canManage||taskBusy!==null} onChange={event=>void completeTask(task,event.target.checked)}/><span className="museum-guide-check__body"><strong>{task.title}</strong><small>{entry?.name??task.sourceId} · {entry?.destination?`Vitrine ${entry.destination}`:"Destination not assigned"}</small>{taskBusy===task.id?<small role="status">Saving…</small>:null}</span></label>;})}</>;}
 function tiered(ids:string[]){
  return ["Primary","Secondary","Tertiary","Other"].map(tier=>{
   const matches=ids.filter(id=>{const value=guideById.get(id)?.tier;return tier==="Other"?!["Primary","Secondary","Tertiary"].includes(value??""):value===tier;});
   return matches.length?<section key={tier}><h3 className="museum-guide-stage">{tier} · {matches.length}</h3>{matches.map(id=>display(id,selected,true,false,true))}</section>:null;
  });
 }
 function searchPanel(){
  const members=new Set(guide.vitrines.flatMap(v=>[...v.families,...v.cityGroups].flatMap(g=>g.sourceIds)));
  const entries=guide.entries.filter(e=>members.has(e.sourceId));
  const codes=(values:(string|undefined)[])=>[...new Set(values.filter((v):v is string=>!!v))].sort((a,b)=>Number(a)-Number(b));
  const found=entries.filter(e=>{const row=rows.find(r=>r.sourceId===e.sourceId);return e.name.toLocaleLowerCase().includes(saintSearch.trim().toLocaleLowerCase())&&(!startFilter||(startFilter==="unknown"?!row?.original:row?.original?.kind==="vitrine"&&row.original.code===startFilter))&&(!endFilter||e.destination===endFilter);});
  return <details className="museum-admin-panel"><summary>Find a saint in this phase</summary><div className="museum-guide-search"><label className="admin-field"><span>Saint name</span><input type="search" value={saintSearch} onChange={e=>setSaintSearch(e.target.value)}/></label><label className="admin-field"><span>Starting vitrine</span><select aria-label="Starting vitrine" value={startFilter} onChange={e=>setStartFilter(e.target.value)}><option value="">All</option>{codes(entries.map(e=>rows.find(r=>r.sourceId===e.sourceId)?.original?.code)).map(code=><option key={code} value={code}>{code}</option>)}<option value="unknown">Not recorded</option></select></label><label className="admin-field"><span>Destination vitrine</span><select aria-label="Destination vitrine" value={endFilter} onChange={e=>setEndFilter(e.target.value)}><option value="">All</option>{codes(entries.map(e=>e.destination)).map(code=><option key={code} value={code}>{code}</option>)}</select></label></div>
  <p className="muted">{found.length} entries · Starting locations are source-reported.</p><div className="museum-guide-search__results">{found.map(e=>{const row=rows.find(r=>r.sourceId===e.sourceId);const region=SPN_REGION_GROUPS.find(g=>(g.sections as readonly string[]).includes(e.section))?.title??"Region not assigned";return <article className="museum-guide-check" key={e.sourceId}><div className="museum-guide-check__body"><strong>{e.name}</strong><small>{region} · {e.section||"Section not assigned"}</small><small>Start: {currentLocationLabel(row?.original??null)} → Proposed: Vitrine {e.destination}</small>{row?.currentBasis==="confirmed"?<small>Current: {currentLocationLabel(row.current)}</small>:null}</div><button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>{setSelected(e.destination);setStep("families");setClearConfirmed(false);setAcknowledged(false);}}>Vitrine {e.destination}</button></article>;})}{!found.length?<p>No matching saints. Try another name or clear a filter.</p>:null}</div></details>;
 }
 function placementControl(id:string){
  const row=rows.find(r=>r.sourceId===id),entry=guideById.get(id);
  if(!row||!selectedIds.includes(id))return null;
  const placed=isPlaced(row,selected);
  return <span className="museum-guide-tree__check"><input type="checkbox" aria-label={`Mark ${entry?.name??row.name} placed in Vitrine ${selected}`} checked={placed} disabled={!editable||blocked(row)||!!entry?.movementBlockedReason} onChange={()=>togglePlacement(row,selected)}/>{savingSources.includes(id)?<small role="status">Saving…</small>:null}</span>;
 }
 function sorted(ids:string[]){const rank=(id:string)=>{const n=["Primary","Secondary","Tertiary"].indexOf(guideById.get(id)?.tier??"");return n<0?3:n;};return [...new Set(ids)].sort((a,b)=>rank(a)-rank(b));}
 function matchesVitrine(id:string){const entry=guideById.get(id);return !vitrineSearch.trim()||`${entry?.name??""} ${entry?.city??""}`.toLocaleLowerCase().includes(vitrineSearch.trim().toLocaleLowerCase());}
 function guidedPlacement(){
  if(!view)return null;
  return <><h3 className="museum-guide-stage">Families & named saints</h3>{view.families.filter(g=>g.sourceIds.some(matchesVitrine)).map(g=>{
   const treeIds=new Set((g.edges??[]).flatMap(e=>[e.fromSourceId,e.toSourceId]));
   return <section key={g.id} className="museum-guide-narrative"><h3>{g.title}</h3><p>{g.rationale}</p><MuseumGuideFamilyTree group={g} entries={guideById} physicalRows={rows} renderControl={placementControl}/>{sorted(g.sourceIds.filter(id=>!treeIds.has(id))).map(id=>display(id,selected,true,true))}</section>;
  })}
  {view.cityGroups.length?<><h3 className="museum-guide-stage">City groups</h3>{view.cityGroups.filter(g=>g.sourceIds.some(matchesVitrine)).map(g=><section key={g.id} className="museum-guide-narrative"><h3>{g.title}</h3><p>{g.rationale}</p>{g.spaceEstimate?<small>{g.spaceEstimate.label}</small>:null}{sorted(g.sourceIds.filter(matchesVitrine)).map(id=>display(id,selected,true,true))}</section>)}</>:null}
  <section aria-label="Complete vitrine checklist"><h2 className="museum-guide-stage">Complete vitrine checklist</h2>{displayWork.error?<p role="alert">Shelf and to-do controls could not load. Open the To-do tab to retry.</p>:null}{tiered([...new Set(selectedIds)].filter(matchesVitrine))}{!selectedIds.some(matchesVitrine)?<p>No matching saints in this vitrine.</p>:null}</section>
  </>;
 }
 function group(group:GuideGroup,alternative=false){
  const rank=(id:string)=>["Primary","Secondary","Tertiary"].indexOf(guideById.get(id)?.tier??"Tertiary");
  const eligible=group.sourceIds.filter(id=>rows.some(r=>r.sourceId===id)).sort((a,b)=>rank(a)-rank(b));
  const remaining=eligible.filter(id=>{const r=rows.find(r=>r.sourceId===id)!;return !isPlaced(r,selected);});
  const saintCount=group.saintCount??new Set(eligible.map(id=>rows.find(r=>r.sourceId===id)?.saintId).filter(Boolean)).size;
  const unmatched=group.unmatchedEntryCount??eligible.filter(id=>!rows.find(r=>r.sourceId===id)?.saintId).length;
  return <details key={group.id} className="room-move__group" open={!alternative}><summary><strong>{group.title}</strong><span>{saintCount} {saintCount===1?"saint":"saints"}{unmatched?` + ${unmatched} unmatched records`:""} · {remaining.length} not confirmed here</span></summary>
   <p>{group.rationale}</p>{group.relationshipReviewRequired?<p>Review the family connections before separating this group.</p>:null}{group.spaceEstimate?<p><strong>{group.spaceEstimate.label}</strong> · {group.spaceEstimate.confidence}<small className="muted">{group.spaceEstimate.basis}</small></p>:null}
   {alternative?<p>Suggested: {group.suggestedVitrines.map(v=>`Vitrine ${v}`).join(" · ")}</p>:null}
   <MuseumGuideFamilyTree group={group} entries={guideById} physicalRows={rows}/>

   {canManage&&(!alternative||cityFitsStarterCase(group,selected))?decisionControls(group.suggestionIdsByTarget?.[selected]??group.id):null}
   {alternative&&!cityFitsStarterCase(group,selected)?<p>Explore this existing allocation here; review its family connections and placement before proposing a transfer.</p>:null}
   {eligible.map(id=>display(id,selected,!alternative||cityFitsStarterCase(group,selected)))}
  </details>;
 }
 return <div className={`room-move museum-companion${workflow==="guided"?" museum-companion--guide":""}`} data-museum-companion-theme="parchment"><div className="museum-companion__canvas"><header className="museum-companion__header"><div><p className="eyebrow">SPN · Move companion</p><h1>{workflow==="guided"?"SPN · placement guide":"The starter row"}</h1>{workflow==="room"?<p className="muted">Clear the space, place the key families, then fill around them.</p>:null}</div>
  <div className="review-actions"><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={busy} onClick={()=>void reload()}>Refresh progress</button>{busy?<span role="status">Saving…</span>:message?<span role="status">{message}</span>:null}</div></header><div className="museum-companion__session"><span>{guide.proposalLabel}</span><span>{guide.vitrines.length} vitrines · Progress saved to the museum</span></div>

  {searchPanel()}
  {error?<div role="alert" className="admin-notice"><p>{error}</p>{retry.current?<button type="button" disabled={busy} onClick={()=>{const r=retry.current;if(r)void send(r.method,r.body,r.url);}}>Retry same save</button>:null}{retry.current?<p>Keep this page open. Retry the same save, or refresh to check whether it was recorded.</p>:null}</div>:null}


  {canManage&&!reportsSaved?<details className="museum-admin-panel"><summary>Review 23 reported placements · 27 October</summary><p>These were reported as placed. Record them together after reviewing the current locations below. Shelves were not specified.</p>{reported.map(({placement,row})=><p key={placement.sourceId}>{row?.name??placement.sourceId} · {currentLocationLabel(row?.current??null)} → Vitrine {placement.destination}</p>)}{reportsBlocked?<p role="alert">A record is unavailable, restricted, or has a different confirmed location. Review it before saving this batch.</p>:null}<button type="button" className="museum-admin-button" disabled={!editable||reportsBlocked} onClick={recordReported}>Record reported placements</button></details>:null}
  <div className="museum-companion__layout"><div className="museum-companion__main"><section className="museum-admin-panel museum-companion__task">{workflow==="room"?<><p className="eyebrow">Your working area</p><h2>Choose a vitrine</h2></>:null}<div className="room-move__phase" aria-label={phaseLabel}>{guide.vitrines.map(v=><button type="button" className="museum-admin-button museum-admin-button--secondary" aria-pressed={selected===v.code} key={v.code} onClick={()=>{setSelected(v.code);setClearConfirmed(false);setAcknowledged(false);}}>Vitrine {v.code}</button>)}</div><details open><summary>Room layout</summary><MuseumRoomPlan layout={spnMuseumLayout} mode="browse" selected={[selected]} onSelect={code=>{if(guide.vitrines.some(v=>v.code===code)){setSelected(code);setClearConfirmed(false);setAcknowledged(false);}}}/></details></section>
  <AdminViewTabs<Phase> label="Guide phase" value={phase} onChange={switchPhase} disabled={busy||displayWork.busy||!!retry.current||taskBusy!==null||!phaseGuides} options={[{value:"starter",label:"Starter row"},{value:"datta",label:"Datta · 3, 81 & 82"},{value:"ram-bhakti",label:"Ram bhakti · 80"}]}/>
  <AdminViewTabs<Step> label="Move steps" value={step} onChange={setStep} options={[...(allowClear?[{value:"clear" as const,label:"1 · Clear"}]:[]),{value:"families",label:workflow==="guided"?(allowClear?"2 · Placement guide":"Placement guide"):"2 · Saints & families"},...(workflow==="room"?[{value:"cities" as const,label:"3 · City groups"}]:[]),...(allowClear?[{value:"staging" as const,label:`Staging area (${staged.length})`}]:[]),{value:"tasks",label:`To-do (${displayWork.tasks.filter(task=>task.status==="open").length})`}]}/>
  <section className="museum-admin-panel"><p className="eyebrow">{step==="staging"?"Temporary locations":workflow==="guided"?phaseLabel:`Vitrine ${selected}`}</p><h2>{step==="clear"?"Confirm the space is clear":step==="families"?(workflow==="guided"?`Vitrine ${selected}`:"Place the key saints & families"):step==="cities"?"Fill the remaining space":step==="tasks"?"Display to-dos":"In the staging area"}</h2>{step==="families"||step==="cities"?<><label className="admin-field museum-guide-vitrine-search"><span>Find in this vitrine</span><input type="search" value={vitrineSearch} onChange={event=>setVitrineSearch(event.target.value)} placeholder="Saint or city"/></label>{vitrineSearch?<small>Matching saints; family connections stay visible for context.</small>:null}<p>{view?.summary}</p></>:null}{step!=="staging"&&step!=="tasks"?<p className="muted">{selectedPlaced} of {selectedIds.length} display records confirmed here</p>:null}
  {step==="clear"&&allowClear?<>{!reportsSaved?<p>Record the 23 reported placements above before confirming more vitrines cleared.</p>:null}<p>{initiallyEmpty?"Confirmed empty when added. Ready to fill.":`${occupants.length} display records currently associated with this vitrine.`}</p><details><summary>Review the listed contents</summary>{occupants.map(r=><p key={r.sourceId}>{r.name} · {currentLocationLabel(r.current)}</p>)}{unmapped.map(r=><p key={r.sourceId}>{r.sourceId} · Outside this guide; resolve before confirming clearance.</p>)}</details>{!initiallyEmpty?<><label className="room-move__check"><input type="checkbox" checked={clearConfirmed} onChange={e=>setClearConfirmed(e.target.checked)}/>I have cleared this vitrine into the staging area.</label><label className="room-move__check"><input type="checkbox" checked={acknowledged} onChange={e=>setAcknowledged(e.target.checked)}/>I checked the listed contents, including displays that will return here.</label><button type="button" className="museum-admin-button" disabled={!editable||!reportsSaved||!clearConfirmed||!acknowledged||unmapped.length>0||occupants.some(blocked)} onClick={()=>move(occupants,{kind:"table",code:"staging-area",label:"Staging area"},[selected])}>Confirm cleared</button><p className="muted">This records the listed contents in the staging area. It does not assume every object in the vitrine is catalogued.</p></>:null}</>:null}
  {guide.outgoingDependencies?.some(d=>d.previousProposedVitrine===selected)?<details className="museum-guide-help"><summary>Outgoing displays need separate destinations</summary><p>This guide does not mark the vitrine empty. Check space before placing the incoming groups.</p>{guide.outgoingDependencies.filter(d=>d.previousProposedVitrine===selected).map(d=><p key={d.sourceId}>{d.name} · Destination pending</p>)}</details>:null}
  {step==="families"&&workflow==="guided"?<><p className="museum-guide-help">Place named groups first, then city groups. Tick after placing; defer or decline keeps the current location.</p>{guidedPlacement()}</>:null}
  {step==="families"&&workflow==="room"?<>{view?.families.length?view.families.map(g=>group(g)):<p>No key-family suggestions for this vitrine.</p>}</>:null}
  {step==="cities"?<><p className="muted">Shelf estimates are planning comparisons, not a measured fit guarantee.</p><button type="button" className="museum-admin-button museum-admin-button--secondary" aria-pressed={showAlternatives} onClick={()=>setShowAlternatives(!showAlternatives)}>{showAlternatives?"Show suggested groups":"Explore other city groups"}</button>{showAlternatives?<><label className="admin-field"><span>Find a city or saint</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)}/></label><label className="room-move__check"><input type="checkbox" checked={allCities} onChange={e=>setAllCities(e.target.checked)}/>Show all cities for reference</label>{!guide.alternatives.some(g=>cityFitsStarterCase(g,selected))&&!allCities?<p>No alternative city groups are suggested for this vitrine.</p>:null}{guide.alternatives.filter(g=>(allCities||cityFitsStarterCase(g,selected))).filter(g=>(g.title+g.sourceIds.map(id=>guideById.get(id)?.name??"").join(" ")).toLowerCase().includes(query.toLowerCase())).map(g=>group(g,true))}</>:view?.cityGroups.length?view.cityGroups.map(g=>group(g)):<p>No remaining city groups suggested here.</p>}</>:null}
  {(step==="families"||step==="cities")&&outgoing.length?<section><h3>Moving beyond the starter row</h3><p>These displays have revised destinations elsewhere in the museum. Their saved locations remain unchanged until you confirm a move.</p>{outgoing.map(id=>display(id,guideById.get(id)?.destination??""))}</section>:null}
  {step==="tasks"?taskList():null}
  {step==="staging"?(staged.length?staged.map(r=>display(r.sourceId,guideById.get(r.sourceId)?.destination??"")):<p>No displays recorded in the staging area.</p>):null}
  </section></div>{workflow==="room"?<aside className="museum-companion__aside" aria-label="Move overview"><section className="museum-admin-panel"><p className="eyebrow">Temporary locations</p><h2>Staging area</h2><p className="muted">{staged.length} displays</p>{staged.length?<><div>{staged.slice(0,4).map(row=><div className="museum-companion__staged" key={row.sourceId}><strong>{row.name}</strong><small>{guideById.get(row.sourceId)?.destination?`Next: Vitrine ${guideById.get(row.sourceId)?.destination}`:"Destination not in this guide"}</small></div>)}</div><div className="review-actions"><button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>setStep("staging")}>See staged displays</button></div></>:<p className="muted">No displays recorded here.</p>}</section><section className="museum-admin-panel"><p className="eyebrow">Your selected vitrine</p><h2>Vitrine {selected}</h2><p>{view?.summary}</p><p className="muted">{selectedPlaced} of {selectedIds.length} displays confirmed here</p><details><summary>Working with this guide</summary><p>Bring displays directly from their current locations or from the staging area. Check “Placed” after the physical move. Defer or decline leaves the recorded location unchanged.</p></details></section></aside>:null}</div></div>{declineSource?<MuseumDetailDialog titleId="decline-suggestion-title" kicker="Suggestion" closeLabel="Cancel decision" onClose={()=>{if(!busy)setDeclineSource(null);}}><h2 id="decline-suggestion-title">Decline suggestion</h2>{declineSource.startsWith("row:")?<p>{guideById.get(declineSource.slice(4))?.name}</p>:null}<form onSubmit={event=>{event.preventDefault();decide(declineSource,"declined");}}><label className="admin-field"><span>Alternative vitrine (optional)</span><select aria-label="Alternative vitrine (optional)" value={alternativeVitrine} onChange={event=>{setAlternativeVitrine(event.target.value);if(!event.target.value)setAlternativeShelf("");}} disabled={busy}><option value="">No alternative yet</option>{[...alternativeOptions].sort((a,b)=>Number(a)-Number(b)).map(code=><option key={code} value={code}>Vitrine {code}</option>)}</select></label><label className="admin-field"><span>Shelf (optional)</span><input value={alternativeShelf} onChange={event=>setAlternativeShelf(event.target.value)} disabled={busy||!alternativeVitrine} maxLength={100}/></label><p className="muted">Records your preference; nothing is marked moved.</p>{error?<p role="alert">{error}</p>:null}{retry.current?<button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={busy} onClick={()=>retry.current&&void send(retry.current.method,retry.current.body,retry.current.url)}>Retry save</button>:null}<div className="review-actions"><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={busy} onClick={()=>setDeclineSource(null)}>Cancel</button><button type="submit" className="museum-admin-button" disabled={!editable||!decisionsLoaded}>{busy?"Saving…":"Save decision"}</button></div></form></MuseumDetailDialog>:null}{undoRow?<MuseumDetailDialog titleId="undo-placement-title" kicker="Correct a check" closeLabel="Cancel undo" onClose={()=>setUndoSource(null)}><h2 id="undo-placement-title">Undo placement check?</h2><p>{undoRow.name}</p>{undoRow.undo?.available?<><p>This corrects a mistaken check. It does not record a physical move back.</p><p>Previous record: {currentLocationLabel(undoRow.undo.previous)}{undoRow.undo.previousBasis!=="confirmed"?" · not physically confirmed":""}</p><div className="review-actions"><button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>setUndoSource(null)}>Keep checked</button><button type="button" className="museum-admin-button" disabled={!editable} onClick={undoPlacement}>Undo check</button></div></>:<p>{undoRow.undo?.reason??"The previous state cannot be safely restored for this older confirmation. Its saved location has not changed."}</p>}</MuseumDetailDialog>:null}</div>;
}
