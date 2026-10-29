"use client";
import {allowsPreparedFixedHousingTransfer,preparatoryTransfersComplete} from "@/lib/museum-preparatory-transfers";
import {useEffect,useRef,useState} from "react";
import {SPN_REGION_GROUPS} from "@/lib/spn-region-navigation";
import {MuseumDisplayWork} from "./museum-display-work";
import {useMuseumDisplayWork,type DisplayTask} from "./use-museum-display-work";
import {MuseumDetailDialog} from "./museum-detail-dialog";
import {MuseumGuideFamilyTree} from "./museum-guide-family-tree";
import {AdminViewTabs} from "./admin-view-tabs";
import {MuseumRoomPlan} from "./museum-room-plan";
import {spnMuseumLayout} from "@/lib/spn-museum-layout";
import {currentLocationLabel,isPlaced,reportedPlacementsRecorded,type StarterMoveGuide,type PhysicalState,type GuideDecision,type CompanionRow,type PhysicalLocation} from "@/lib/spn-move-guide";

type Phase="starter"|"datta"|"ram-bhakti"|"gosaiji-sai"|"vraj";
type SessionView="active"|"staging"|"tasks";
type RequestBody=Record<string,unknown>;
export function SpnRoomMoveCompanion({guide:initialGuide,initialPhysical,canManage,workflow="guided",allowClear:initialAllowClear=true,phaseLabel:initialPhaseLabel="Starter row",phase:initialPhase="starter",phaseGuides,roomTones={}}:{roomTones?:Record<string,string>;guide:StarterMoveGuide;initialPhysical:PhysicalState|null;canManage:boolean;workflow?:"guided"|"room";allowClear?:boolean;phaseLabel?:string;phase?:Phase;phaseGuides?:Record<Phase,StarterMoveGuide>}){
 const [phase,setPhase]=useState<Phase>(initialPhase);
 const guide=phaseGuides?.[phase]??initialGuide;
 const allowClear=guide.allowClear??(phaseGuides?phase==="starter":initialAllowClear);
 const phaseLabel=guide.phaseLabel??initialPhaseLabel;
 const [physical,setPhysical]=useState(initialPhysical),[sessionView,setSessionView]=useState<SessionView>("active"),[selected,setSelected]=useState(guide.vitrines[0]?.code??"2");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
 const [saintSearch,setSaintSearch]=useState(""),[startFilter,setStartFilter]=useState(""),[endFilter,setEndFilter]=useState("");
 const [alternativeOptions,setAlternativeOptions]=useState<string[]>([]);
 const [declineSource,setDeclineSource]=useState<string|null>(null);
 const [alternativeVitrine,setAlternativeVitrine]=useState(""),[alternativeShelf,setAlternativeShelf]=useState("");
 const [clearCorrectionId,setClearCorrectionId]=useState<string|null>(null),[correctionAcknowledged,setCorrectionAcknowledged]=useState(false);
 const clearCorrection=physical?.clearCorrections?.find(item=>item.receiptId===clearCorrectionId);
 const [undoSource,setUndoSource]=useState<string|null>(null);
 const undoRow=rowsForUndo();
 function rowsForUndo(){return physical?.rows.find(row=>row.sourceId===undoSource);}
 const [vitrineSearch,setVitrineSearch]=useState("");
 const [savingSources,setSavingSources]=useState<string[]>([]);
 useEffect(()=>{setVitrineSearch("");setClearConfirmed(false);},[selected]);
 const displayWork=useMuseumDisplayWork();
 const allGuides=phaseGuides?Object.values(phaseGuides):[guide];
 const allEntries=new Map(allGuides.flatMap(item=>item.entries).map(entry=>[entry.sourceId,entry]));
 for(const item of allGuides)for(const vitrine of item.vitrines)for(const group of [...vitrine.families,...vitrine.cityGroups])for(const id of group.sourceIds){const entry=item.entries.find(row=>row.sourceId===id);if(entry)allEntries.set(id,entry);}
 const [taskBusy,setTaskBusy]=useState<string|null>(null);
 const [taskError,setTaskError]=useState("");
 const [clearConfirmed,setClearConfirmed]=useState(false);
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
 const preparation=physical?.preparations?.find(item=>item.vitrine===selected);
 const selectedPlaced=selectedIds.filter(id=>{const row=rows.find(r=>r.sourceId===id);return row&&isPlaced(row,selected);}).length;
 const requiredClear=guide.requiredClearVitrines?.find(code=>!physical?.phaseClearances?.some(receipt=>(receipt.guideVersion===guide.version||guide.previousClearanceVersions?.includes(receipt.guideVersion))&&receipt.vitrine===code));
 const needsPhaseClear=!!guide.requiredClearVitrines?.length&&(!guide.clearanceRequiredDestinations||guide.clearanceRequiredDestinations.includes(selected));
 const needsAvailability=guide.preparationVitrines?.includes(selected)===true;
 const transferReady=(transfer:NonNullable<StarterMoveGuide["preparatoryTransfers"]>[number])=>preparatoryTransfersComplete([transfer],rows);
 const transfersReady=(guide.preparatoryTransfers??[]).filter(t=>t.requiredBefore.includes(selected)).every(transferReady);
 const preparationReady=transfersReady&&(needsAvailability?preparation?.prepared===true:needsPhaseClear?!requiredClear:!allowClear||preparation?.prepared===true||selectedPlaced>0);
 const guideById=allEntries;
 function switchPhase(next:Phase){
  if(next===phase||!phaseGuides||busy||displayWork.busy||!!retry.current||taskBusy!==null)return;
  setPhase(next);setSelected(phaseGuides[next].vitrines[0]?.code??"");setSessionView("active");
  setDecisions([]);setDecisionsLoaded(false);setSaintSearch("");setStartFilter("");setEndFilter("");setVitrineSearch("");
  setClearConfirmed(false);setUndoSource(null);setDeclineSource(null);setError("");setMessage("");
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
   if(!result.decision&&!Array.isArray(result.rows)&&!Array.isArray(result.preparations))throw new Error("The save could not be confirmed. Refresh progress before trying again.");
   if(body.action==="preparation.update"){setPhysical(previous=>previous?{...previous,preparations:result.preparations}:previous);retry.current=null;setMessage("Preparation saved.");return;}
   if(body.action==="undo"||body.action==="clear.correct"){
    retry.current=null;
    setPhysical(previous=>previous?{...previous,confirmationHistory:[],reportedPlacementReceipts:undefined,rows:previous.rows.map(row=>result.rows.find((next:CompanionRow)=>next.sourceId===row.sourceId)??row)}:result);
    const refreshed=await fetch("/api/admin/museum-physical-locations?museumId=museum-spn",{cache:"no-store"});
    const snapshot=await refreshed.json();
    if(!refreshed.ok||!Array.isArray(snapshot.rows))throw new Error("The correction was saved. Refresh progress to load the updated history.");
    setPhysical(snapshot);if(body.action==="clear.correct")await displayWork.reload();setClearCorrectionId(null);setCorrectionAcknowledged(false);setMessage(body.action==="clear.correct"?"Mistaken clearing corrected.":"Check undone.");return;
   }
   if(result.decision){setDecisions(previous=>[...previous.filter(d=>d.suggestionId!==result.decision.suggestionId),result.decision]);if(body.decision==="declined")setDeclineSource(null);}
   else setPhysical(previous=>previous?{...previous,...(Array.isArray(result.preparations)?{preparations:result.preparations}:{}),...(Array.isArray(result.phaseClearances)?{phaseClearances:result.phaseClearances}:{}),confirmationHistory:result.receipt?[result.receipt,...(previous.confirmationHistory??[])]:previous.confirmationHistory,rows:previous.rows.map(row=>result.rows.find((next:CompanionRow)=>next.sourceId===row.sourceId)??row)}:result);retry.current=null;setMessage("Saved.");setClearConfirmed(false);
  }catch(e){setError(e instanceof Error?e.message:"Could not save. Retry the same action or reload to check its status.");}
  finally{pending.current=false;setBusy(false);setSavingSources([]);}
 }
 async function reload(){
  if(pending.current)return;pending.current=true;setBusy(true);setError("");
  try{const response=await fetch("/api/admin/museum-physical-locations?museumId=museum-spn",{cache:"no-store"});const data=await response.json();if(!response.ok)throw new Error(data.error||"Could not load current locations.");setPhysical(data);await Promise.all([loadDecisions(),displayWork.reload()]);retry.current=null;setMessage("Current progress loaded.");}
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
   records:items.map(r=>({sourceId:r.sourceId,saintId:r.saintId,expectedLocationVersion:r.currentVersion,expectedCurrentRevision:r.currentRevision,expectedSourceRevision:r.sourceRevision,to})),...(clearedVitrines?{clearedVitrines,...(guide.requiredClearVitrines?.length?{initialCaseClearAcknowledged:true}:{})}:{})});
 }
 function togglePlacement(row:CompanionRow,target:string){
  if(isPlaced(row,target)){setUndoSource(row.sourceId);return;}
  if(!preparationReady)return;
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
   <input type="checkbox" aria-label={`Mark ${entry?.name??row.name} placed in Vitrine ${target}`} checked={placed} disabled={!editable||(!placed&&!preparationReady)||blocked(row)||!target||!allowMove||!!reviewBlock} onChange={()=>togglePlacement(row,target)}/>
   <div className="museum-guide-check__body"><details><summary>{entry?.name??row.name}{compact&&entry?<span className="museum-guide-tier">{entry.tier}</span>:null}</summary><p>{entry?.relicDescription}</p><p>Original: {currentLocationLabel(row.original)}</p><p>{entry?.rationale}</p></details>
    {savingSources.includes(sourceId)?<small role="status">Saving…</small>:null}<small>{placed?"Placed · saved":row.currentBasis==="confirmed"?"Current":"Last recorded"}: {currentLocationLabel(row.current)}{target!==selected?` → Vitrine ${target}`:""}</small>
    {entry?.reportedOrigin&&row.currentBasis!=="confirmed"?<small>{entry.reportedOrigin}</small>:null}{entry?.city?<small>{entry.city}</small>:null}{entry?.lifeStatus?.tag?<small>{entry.lifeStatus.tag}</small>:null}{row.identityChanged?<small>Identity changed. Reload and review before recording a move.</small>:!reviewBlock&&blocked(row)?<small>Fixed housing or a verified inventory item needs its existing item-move workflow.</small>:null}{reviewBlock?<p role="note">{reviewBlock}</p>:null}{entry?.reviewNotes?.map(note=><small key={note}>{note}</small>)}{showWork&&allowMove?<MuseumDisplayWork name={entry?.name??row.name} shelf={displayWork.shelf(row)} canEditShelf={placed} canManage={editable&&displayWork.loaded} onShelfSave={value=>displayWork.saveShelf(row,value)} onTaskAdd={title=>displayWork.addTask(row,title)}/>:null}
   </div>{!placed&&canManage&&allowMove&&pilotIds.has(sourceId)?decisionControls("row:"+sourceId):null}
  </div>;
  return <article className="room-move__display" key={sourceId} id={`move-${sourceId}`}>
   <div><p className="eyebrow">{entry?.tier??"Display"}{entry?.city?` · ${entry.city}`:""}</p><h3>{entry?.name??row.name}</h3><p>{entry?.relicDescription}</p></div>
   <div><small>{row.currentBasis==="confirmed"?"Current location":"Last recorded location"}</small><strong>{currentLocationLabel(row.current)}</strong><p>{target?`To Vitrine ${target}`:"No destination in this guide"}</p>{reviewBlock?<p role="note">{reviewBlock}</p>:null}{entry?.reviewNotes?.map(note=><p key={note} className="muted">{note}</p>)}
    <label className="room-move__check"><input type="checkbox" checked={placed} disabled={!editable||(!placed&&!preparationReady)||blocked(row)||!target||!allowMove||!!reviewBlock} onChange={()=>togglePlacement(row,target)}/>{placed?"Placed · saved":"Placed in this vitrine"}</label>

   {!placed&&canManage&&allowMove&&pilotIds.has(sourceId)?decisionControls("row:"+sourceId):null}</div>
   <details><summary>Details & original location</summary><p>Original: {currentLocationLabel(row.original)}</p><p>{entry?.rationale}</p>{row.identityChanged?<p>This source identity has changed. Reload and review it before recording a move.</p>:reviewBlock?<p>{reviewBlock}</p>:blocked(row)?<p>Fixed housing or a verified inventory item needs its existing item-move workflow.</p>:null}<small>Source record: {sourceId}</small></details>
  </article>;
 }
 async function completeTask(task:DisplayTask,completed:boolean){
  if(taskBusy)return;setTaskBusy(task.id);setTaskError("");
  try{await displayWork.completeTask(task,completed);}catch(error){setTaskError(error instanceof Error?error.message:"Could not update this to-do.");}finally{setTaskBusy(null);}
 }
 function openDestination(sourceId:string,target:string){
  if(busy||displayWork.busy||retry.current)return;
  const owner=phaseGuides&&(Object.keys(phaseGuides) as Phase[]).find(key=>phaseGuides[key].vitrines.some(v=>v.code===target&&[...v.families,...v.cityGroups].some(g=>g.sourceIds.includes(sourceId))));
  if(owner&&owner!==phase)switchPhase(owner);
  setSelected(target);setSessionView("active");setClearConfirmed(false);
 }
 function taskList(){
  const groups=new Map<string,DisplayTask[]>();
  for(const task of displayWork.tasks){const row=rows.find(r=>r.sourceId===task.sourceId),entry=guideById.get(task.sourceId);const code=row?.currentBasis==="confirmed"&&row.current?.kind==="vitrine"?row.current.code:entry?.destination??"";groups.set(code,[...(groups.get(code)??[]),task]);}
  return <>{displayWork.error?<p role="alert">{displayWork.error} <button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>void displayWork.reload().catch(error=>setTaskError(error.message))}>Retry</button></p>:null}{taskError?<p role="alert">{taskError}</p>:null}{!displayWork.loaded?<p>Loading to-dos…</p>:!displayWork.tasks.length?<p>No to-dos yet. Add one from a saint’s final checklist entry.</p>:[...groups].sort(([a],[b])=>(Number(a)||Infinity)-(Number(b)||Infinity)).map(([code,tasks])=><section className="museum-companion__task-group" key={code}><h3>{code?'Vitrine '+code:'Vitrine not assigned'}</h3>{tasks.sort((a,b)=>Number(a.status==="completed")-Number(b.status==="completed")).map(task=>{const entry=guideById.get(task.sourceId),row=rows.find(r=>r.sourceId===task.sourceId);return <label className="museum-guide-check" key={task.id}><input type="checkbox" checked={task.status==="completed"} disabled={!canManage||taskBusy!==null} onChange={event=>void completeTask(task,event.target.checked)}/><span className="museum-guide-check__body"><strong>{task.title}</strong><small>{entry?.name??row?.name??task.sourceId}</small>{taskBusy===task.id?<small role="status">Saving…</small>:null}</span></label>;})}</section>)}</>;
 }
 function preparatoryTransfersCard(){
  if(!guide.preparatoryTransfers?.length)return null;
  const available=physical?.preparations?.find(p=>p.vitrine==="70");
  return <section className="museum-admin-panel" aria-label="Transfer the two large objects"><h2>First: Vitrine 23 → 70</h2><p>Check that both objects fit in 70, then tick each after moving it.</p>{!available?.prepared?<button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={!editable} onClick={()=>send("POST",{action:"preparation.update",museumId:"museum-spn",clientRequestId:crypto.randomUUID(),vitrine:"70",prepared:true,expectedVersion:available?.version??0})}>Confirm 70 is ready</button>:null}{guide.preparatoryTransfers.map(transfer=>{const row=rows.find(r=>r.sourceId===transfer.sourceId);const completed=transferReady(transfer);return <div className="museum-companion__checklist-row" key={transfer.sourceId}><label className="room-move__check"><input type="checkbox" checked={completed} disabled={!editable||!row||row.identityChanged||row.verifiedItemIds.length>0||!!row.movementBlockedReason||(row.fixedHousing&&!completed&&!allowsPreparedFixedHousingTransfer(row.sourceId,row.current,{kind:"vitrine",code:transfer.toVitrine},guide.preparatoryTransfers))||!available?.prepared||(completed&&(!row?.undo?.available||!isPlaced(row,transfer.toVitrine)))} onChange={()=>{if(completed&&row){setUndoSource(row.sourceId);return;}if(row)move([row],{kind:"vitrine",code:transfer.toVitrine,label:`Vitrine ${transfer.toVitrine}`});}}/>{transfer.name}</label><small>{row?currentLocationLabel(row.current):"Refresh to load the current location"}{transfer.finalDestination!==transfer.toVitrine?` · Temporary holding; planned destination ${transfer.finalDestination}`:""}</small></div>;})}</section>;
 }
 function markPrepared(){if(!editable)return;void send("POST",{action:"preparation.update",museumId:"museum-spn",clientRequestId:crypto.randomUUID(),vitrine:selected,prepared:true,expectedVersion:preparation?.version??0});}
 function availabilityCard(){
  return <section className="museum-admin-panel" aria-label="Vitrine availability"><h2>Prepare Vitrine {selected}</h2>{preparation?.prepared?<p className="museum-companion__prepared">✓ Available for placement</p>:<><label className="room-move__check"><input type="checkbox" checked={clearConfirmed} disabled={!editable} onChange={event=>setClearConfirmed(event.target.checked)}/>I have checked Vitrine {selected}; it is available for this display.</label><button type="button" className="museum-admin-button" disabled={!editable||!clearConfirmed} onClick={markPrepared}>Confirm available</button></>}</section>;
 }
 function phaseClearanceCard(){
  if(!requiredClear)return <p className="museum-companion__prepared">✓ Vitrine 37 clearing recorded</p>;
  const contents=rows.filter(row=>row.current?.kind==="vitrine"&&row.current.code===requiredClear);
  const missing=physical?.unmappedCurrentLocations.filter(row=>row.location.kind==="vitrine"&&row.location.code===requiredClear)??[];
  return <section className="museum-admin-panel" aria-label="Required phase clearing"><h2>Clear Vitrine {requiredClear}</h2><details open><summary>{contents.length+missing.length} recorded occupants</summary>{contents.map(row=><p key={row.sourceId}>{row.name} · {currentLocationLabel(row.current)}{row.currentBasis!=="confirmed"?" · source-reported":""}</p>)}{missing.map(row=><p key={row.sourceId}>{row.sourceId} · Unlinked record: review before clearing.</p>)}</details><label className="room-move__check"><input type="checkbox" checked={clearConfirmed} disabled={!editable} onChange={event=>setClearConfirmed(event.target.checked)}/>I have cleared Vitrine {requiredClear}; all listed contents are in the staging area.</label><button type="button" className="museum-admin-button" disabled={!editable||!clearConfirmed||missing.length>0||contents.some(blocked)} onClick={()=>move(contents,{kind:"table",code:"staging-area",label:"Staging area"},[requiredClear])}>Confirm cleared</button><small>Confirm this clearing before recording placements in either vitrine.</small></section>;
 }
 function clearanceCard(){
  if(preparation?.prepared)return <p className="museum-companion__prepared" role="status">✓ Vitrine {selected} · preparation complete</p>;
  const started=occupants.some(row=>row.currentBasis==="confirmed");
  return <section className="museum-admin-panel" aria-label="Vitrine preparation"><h2>Prepare Vitrine {selected}</h2>{preparation?.prepared?<p className="museum-companion__prepared">✓ Preparation complete</p>:started||initiallyEmpty||!occupants.length?<><p>{started?'Placement has started. The saved locations will stay unchanged.':initiallyEmpty?'New vitrine · no contents to clear.':'No contents are recorded here.'}</p><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={!editable||unmapped.length>0} onClick={markPrepared}>Mark preparation complete</button>{unmapped.length?<p>Review the unlinked location records before continuing.</p>:null}</>:<><details><summary>Review {occupants.length} recorded occupants</summary>{occupants.map(row=><p key={row.sourceId}>{row.name} · {currentLocationLabel(row.current)}</p>)}{unmapped.map(row=><p key={row.sourceId}>{row.sourceId} · Review this unlinked record before clearing.</p>)}</details><label className="room-move__check"><input type="checkbox" checked={clearConfirmed} onChange={event=>setClearConfirmed(event.target.checked)}/>The listed contents are now in the staging area.</label><button type="button" className="museum-admin-button" disabled={!editable||!clearConfirmed||!reportsSaved||unmapped.length>0||occupants.some(blocked)} onClick={()=>move(occupants,{kind:"table",code:"staging-area",label:"Staging area"},[selected])}>Confirm cleared</button>{!reportsSaved?<p>Review the reported placements above before clearing.</p>:null}</>}{!preparationReady?<small>Complete preparation before marking new placements.</small>:null}</section>;
 }
  function correctClearing(){
  if(!clearCorrection||!correctionAcknowledged||!editable)return;
  void send("POST",{action:"clear.correct",museumId:"museum-spn",clientRequestId:crypto.randomUUID(),receiptId:clearCorrection.receiptId,mistakenClearAcknowledged:true,records:clearCorrection.records.map(({sourceId,saintId,expectedCurrentRevision,expectedSourceRevision,expectedLocationVersion})=>({sourceId,saintId,expectedCurrentRevision,expectedSourceRevision,expectedLocationVersion}))});
 }
 function clearingCorrections(){return canManage&&physical?.clearCorrections?.length?<details className="museum-guide-help"><summary>Correct a mistaken clearing</summary>{physical.clearCorrections.map(item=><div className="review-actions" key={item.receiptId}><span>Vitrine {item.vitrine} · {item.records.length} previously placed entries</span><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={!editable} onClick={()=>{setClearCorrectionId(item.receiptId);setCorrectionAcknowledged(false);}}>Review correction</button></div>)}</details>:null;}
 function stagingList(){return <>{clearingCorrections()}{staged.length?staged.map(row=>{const entry=guideById.get(row.sourceId);const inGuide=entry&&allGuides.some(item=>item.vitrines.some(v=>v.code===entry.destination&&[...v.families,...v.cityGroups].some(g=>g.sourceIds.includes(row.sourceId))));return <article className="museum-guide-check" key={row.sourceId}><div className="museum-guide-check__body"><strong>{entry?.name??row.name}</strong><small>Source start: {currentLocationLabel(row.original)}</small><small>{entry?.destination?'Proposed: Vitrine '+entry.destination:'Destination not assigned'}</small></div>{inGuide?<button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>openDestination(row.sourceId,entry.destination)}>Vitrine {entry.destination}</button>:null}</article>;}):<p>No displays recorded in the staging area.</p>}{physical?.unmappedCurrentLocations.filter(row=>row.location.kind==="table").map(row=><p key={row.sourceId}>{row.sourceId} · Staged record awaiting an inventory match</p>)}</>;}
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
  return <section className="museum-companion__search" aria-label="Saint search"><div className="museum-guide-search"><label className="admin-field"><span>Find a saint</span><input type="search" value={saintSearch} onChange={e=>setSaintSearch(e.target.value)}/></label><label className="admin-field"><span>Starting vitrine</span><select aria-label="Starting vitrine" value={startFilter} onChange={e=>setStartFilter(e.target.value)}><option value="">All</option>{codes(entries.map(e=>rows.find(r=>r.sourceId===e.sourceId)?.original?.code)).map(code=><option key={code} value={code}>{code}</option>)}<option value="unknown">Not recorded</option></select></label><label className="admin-field"><span>Destination vitrine</span><select aria-label="Destination vitrine" value={endFilter} onChange={e=>setEndFilter(e.target.value)}><option value="">All</option>{codes(entries.map(e=>e.destination)).map(code=><option key={code} value={code}>{code}</option>)}</select></label></div>
  {saintSearch.trim()||startFilter||endFilter?<div className="museum-companion__search-results"><p className="muted" role="status">{found.length} entries</p><div className="museum-guide-search__results">{found.map(e=>{const row=rows.find(r=>r.sourceId===e.sourceId);const region=SPN_REGION_GROUPS.find(g=>(g.sections as readonly string[]).includes(e.section))?.title??"Region not assigned";return <article className="museum-guide-check" key={e.sourceId}><div className="museum-guide-check__body"><strong>{e.name}</strong><small>{region} · {e.section||"Section not assigned"}</small><small>Source start: {currentLocationLabel(row?.original??null)} → Proposed: Vitrine {e.destination}</small>{row?.currentBasis==="confirmed"?<small>Current: {currentLocationLabel(row.current)}</small>:null}</div><button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>openDestination(e.sourceId,e.destination)}>Vitrine {e.destination}</button></article>;})}{!found.length?<p>No matching saints. Try another name or clear a filter.</p>:null}</div></div>:null}</section>;
 }
 function placementControl(id:string){
  const row=rows.find(r=>r.sourceId===id),entry=guideById.get(id);
  if(!row||!selectedIds.includes(id))return null;
  const placed=isPlaced(row,selected);
  return <span className="museum-guide-tree__check"><input type="checkbox" aria-label={`Mark ${entry?.name??row.name} placed in Vitrine ${selected}`} checked={placed} disabled={!editable||(!placed&&!preparationReady)||blocked(row)||!!entry?.movementBlockedReason} onChange={()=>togglePlacement(row,selected)}/>{savingSources.includes(id)?<small role="status">Saving…</small>:null}</span>;
 }
 function sorted(ids:string[]){const rank=(id:string)=>{const n=["Primary","Secondary","Tertiary"].indexOf(guideById.get(id)?.tier??"");return n<0?3:n;};return [...new Set(ids)].sort((a,b)=>rank(a)-rank(b));}
 function matchesVitrine(id:string){const entry=guideById.get(id);return !vitrineSearch.trim()||`${entry?.name??""} ${entry?.city??""}`.toLocaleLowerCase().includes(vitrineSearch.trim().toLocaleLowerCase());}
 function guidedPlacement(){
  if(!view)return null;
  return <><h3 className="museum-guide-stage">Families & named saints</h3>{view.families.filter(g=>g.sourceIds.some(matchesVitrine)).map(g=>{
   const treeIds=new Set((g.edges??[]).flatMap(e=>[e.fromSourceId,e.toSourceId]));
   return <section key={g.id} className="museum-guide-narrative"><h3>{g.title}</h3><p>{g.rationale}</p><MuseumGuideFamilyTree group={g} entries={guideById} physicalRows={rows} renderControl={placementControl} renderActions={id=>{const row=rows.find(r=>r.sourceId===id);return row&&!isPlaced(row,selected)&&canManage&&pilotIds.has(id)?decisionControls("row:"+id):null;}}/>{sorted(g.sourceIds.filter(id=>!treeIds.has(id))).map(id=>display(id,selected,true,true))}</section>;
  })}
  {view.cityGroups.length?<><h3 className="museum-guide-stage">City groups</h3>{view.cityGroups.filter(g=>g.sourceIds.some(matchesVitrine)).map(g=><section key={g.id} className="museum-guide-narrative"><h3>{g.title}</h3><p>{g.rationale}</p>{g.spaceEstimate?<small>{g.spaceEstimate.label}</small>:null}{sorted(g.sourceIds.filter(matchesVitrine)).map(id=>display(id,selected,true,true))}</section>)}</>:null}
  <section aria-label="Complete vitrine checklist"><h2 className="museum-guide-stage">Complete vitrine checklist</h2>{displayWork.error?<p role="alert">Shelf and to-do controls could not load. Open the To-do tab to retry.</p>:null}{tiered([...new Set(selectedIds)].filter(matchesVitrine))}{!selectedIds.some(matchesVitrine)?<p>No matching saints in this vitrine.</p>:null}</section>
  </>;
 }
 return <div className={`room-move museum-companion${workflow==="guided"?" museum-companion--guide":""}`} data-museum-companion-theme="parchment"><div className="museum-companion__canvas"><header className="museum-companion__header"><div><p className="eyebrow">SPN · Move companion</p><h1>{workflow==="guided"?"SPN · placement guide":"The starter row"}</h1>{workflow==="room"?<p className="muted">Clear the space, place the key families, then fill around them.</p>:null}</div>
  <div className="review-actions"><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={busy} onClick={()=>void reload()}>Refresh progress</button>{busy?<span role="status">Saving…</span>:message?<span role="status">{message}</span>:null}</div></header><div className="museum-companion__session"><span>{guide.proposalLabel}</span><span>{guide.vitrines.length} vitrines · Progress saved to the museum</span></div>

  {searchPanel()}
  {error?<div role="alert" className="admin-notice"><p>{error}</p>{retry.current?<button type="button" disabled={busy} onClick={()=>{const r=retry.current;if(r)void send(r.method,r.body,r.url);}}>Retry same save</button>:null}{retry.current?<p>Keep this page open. Retry the same save, or refresh to check whether it was recorded.</p>:null}</div>:null}


  {canManage&&!reportsSaved?<details className="museum-admin-panel"><summary>Review 23 reported placements · 27 October</summary><p>These were reported as placed. Record them together after reviewing the current locations below. Shelves were not specified.</p>{reported.map(({placement,row})=><p key={placement.sourceId}>{row?.name??placement.sourceId} · {currentLocationLabel(row?.current??null)} → Vitrine {placement.destination}</p>)}{reportsBlocked?<p role="alert">A record is unavailable, restricted, or has a different confirmed location. Review it before saving this batch.</p>:null}<button type="button" className="museum-admin-button" disabled={!editable||reportsBlocked} onClick={recordReported}>Record reported placements</button></details>:null}
  <AdminViewTabs<SessionView> label="Move workspace" value={sessionView} onChange={setSessionView} disabled={busy||displayWork.busy||!!retry.current||taskBusy!==null} options={[{value:"active",label:"Active move"},{value:"staging",label:'Staging area ('+(staged.length+(physical?.unmappedCurrentLocations.filter(row=>row.location.kind==="table").length??0))+')'},{value:"tasks",label:'To-do ('+displayWork.tasks.filter(task=>task.status==="open").length+')'}]}/>
  {sessionView==="active"?<div className="museum-companion__layout"><div className="museum-companion__main"><section className="museum-admin-panel museum-companion__task"><details open><summary>Room layout</summary><MuseumRoomPlan layout={spnMuseumLayout} mode="browse" selected={[selected]} availableVitrines={[...new Set(allGuides.flatMap(g=>g.vitrines.map(v=>v.code)))]} tones={roomTones} disabled={busy||displayWork.busy||!!retry.current||taskBusy!==null} onSelect={code=>{if(busy||displayWork.busy||retry.current||taskBusy!==null)return;const owner=phaseGuides?(Object.keys(phaseGuides) as Phase[]).find(key=>phaseGuides[key].vitrines.some(v=>v.code===code)):phase;if(!owner)return;if(owner!==phase)switchPhase(owner);setSelected(code);setClearConfirmed(false);}}/></details></section>
   <div className="museum-companion__guide">
    <AdminViewTabs<Phase> label="Guide phase" value={phase} onChange={switchPhase} disabled={busy||displayWork.busy||!!retry.current||taskBusy!==null||!phaseGuides} options={[...(phaseGuides?.vraj?[{value:"vraj" as const,label:"Vraj · 79 & 77"}]:[]),{value:"starter",label:"Starter row"},{value:"datta",label:"Datta · 3, 81 & 82"},{value:"ram-bhakti",label:"Ram bhakti · 80"},...(phaseGuides?.["gosaiji-sai"]?[{value:"gosaiji-sai" as const,label:"Ramakrishna, Bengal, Gosaiji & Sai"}]:[])]}/>
    <div className="room-move__phase" aria-label={phaseLabel}>{guide.vitrines.map(v=><button type="button" className="museum-admin-button museum-admin-button--secondary" aria-pressed={selected===v.code} key={v.code} onClick={()=>{setSelected(v.code);setClearConfirmed(false);}}>Vitrine {v.code}</button>)}</div>
    {selected==="23"?preparatoryTransfersCard():null}{needsAvailability?availabilityCard():needsPhaseClear?phaseClearanceCard():allowClear?clearanceCard():null}
    <section className="museum-admin-panel"><p className="eyebrow">{phaseLabel}</p><h2>Vitrine {selected}</h2><label className="admin-field museum-guide-vitrine-search"><span>Find in this vitrine</span><input type="search" value={vitrineSearch} onChange={event=>setVitrineSearch(event.target.value)} placeholder="Saint or city"/></label><p>{view?.summary}</p><p className="muted">{selectedPlaced} of {selectedIds.length} display records confirmed here</p>
     {guide.outgoingDependencies?.some(d=>d.previousProposedVitrine===selected)?<details className="museum-guide-help"><summary>Outgoing displays need separate destinations</summary><p>This guide does not mark the vitrine empty. Check space before placing the incoming groups.</p>{guide.outgoingDependencies.filter(d=>d.previousProposedVitrine===selected).map(d=><p key={d.sourceId}>{d.name} · Destination pending</p>)}</details>:null}
     {guide.requiredClearVitrines?.length&&selected==="4"?<details className="museum-guide-help"><summary>Check remaining occupants · {occupants.filter(row=>!selectedIds.includes(row.sourceId)).length} outside this group</summary>{occupants.filter(row=>!selectedIds.includes(row.sourceId)).map(row=><p key={row.sourceId}>{row.name} · {currentLocationLabel(row.current)}</p>)}<p>Check their destinations separately before filling the remaining space.</p></details>:null}
     {guidedPlacement()}
     {outgoing.length?<section><h3>Moving beyond the starter row</h3>{outgoing.map(id=>display(id,guideById.get(id)?.destination??""))}</section>:null}
    </section>
   </div>
  </div></div>:<section className="museum-admin-panel"><h2>{sessionView==="tasks"?'Display to-dos':'Staging area'}</h2>{sessionView==="tasks"?taskList():stagingList()}</section>}
 </div>{clearCorrection?<MuseumDetailDialog titleId="clear-correction-title" kicker="Correct a record" closeLabel="Cancel correction" onClose={()=>{if(!busy)setClearCorrectionId(null);}}><h2 id="clear-correction-title">Restore Vitrine {clearCorrection.vitrine} placements?</h2><p>These {clearCorrection.records.length} entries were confirmed here before the clearing was recorded.</p><ul>{clearCorrection.records.map(row=><li key={row.sourceId}>{row.name} · {currentLocationLabel(row.previous)}</li>)}</ul><p>The other {clearCorrection.excludedCount} entries are unchanged. The original clearing remains in the audit history.</p><label className="room-move__check"><input type="checkbox" checked={correctionAcknowledged} disabled={busy} onChange={event=>setCorrectionAcknowledged(event.target.checked)}/>These entries stayed in the vitrine; the clearing was recorded by mistake.</label>{error?<p role="alert">{error}</p>:null}{retry.current?<button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={busy} onClick={()=>retry.current&&void send(retry.current.method,retry.current.body,retry.current.url)}>Retry correction</button>:null}<div className="review-actions"><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={busy} onClick={()=>setClearCorrectionId(null)}>Cancel</button><button type="button" className="museum-admin-button" disabled={!editable||!correctionAcknowledged} onClick={correctClearing}>Restore {clearCorrection.records.length} placements</button></div></MuseumDetailDialog>:null}{declineSource?<MuseumDetailDialog titleId="decline-suggestion-title" kicker="Suggestion" closeLabel="Cancel decision" onClose={()=>{if(!busy)setDeclineSource(null);}}><h2 id="decline-suggestion-title">Decline suggestion</h2>{declineSource.startsWith("row:")?<p>{guideById.get(declineSource.slice(4))?.name}</p>:null}<form onSubmit={event=>{event.preventDefault();decide(declineSource,"declined");}}><label className="admin-field"><span>Alternative vitrine (optional)</span><select aria-label="Alternative vitrine (optional)" value={alternativeVitrine} onChange={event=>{setAlternativeVitrine(event.target.value);if(!event.target.value)setAlternativeShelf("");}} disabled={busy}><option value="">No alternative yet</option>{[...alternativeOptions].sort((a,b)=>Number(a)-Number(b)).map(code=><option key={code} value={code}>Vitrine {code}</option>)}</select></label><label className="admin-field"><span>Shelf (optional)</span><input value={alternativeShelf} onChange={event=>setAlternativeShelf(event.target.value)} disabled={busy||!alternativeVitrine} maxLength={100}/></label><p className="muted">Records your preference; nothing is marked moved.</p>{error?<p role="alert">{error}</p>:null}{retry.current?<button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={busy} onClick={()=>retry.current&&void send(retry.current.method,retry.current.body,retry.current.url)}>Retry save</button>:null}<div className="review-actions"><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={busy} onClick={()=>setDeclineSource(null)}>Cancel</button><button type="submit" className="museum-admin-button" disabled={!editable||!decisionsLoaded}>{busy?"Saving…":"Save decision"}</button></div></form></MuseumDetailDialog>:null}{undoRow?<MuseumDetailDialog titleId="undo-placement-title" kicker="Correct a check" closeLabel="Cancel undo" onClose={()=>setUndoSource(null)}><h2 id="undo-placement-title">Undo placement check?</h2><p>{undoRow.name}</p>{undoRow.undo?.available?<><p>This corrects a mistaken check. It does not record a physical move back.</p><p>Previous record: {currentLocationLabel(undoRow.undo.previous)}{undoRow.undo.previousBasis!=="confirmed"?" · not physically confirmed":""}</p><div className="review-actions"><button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>setUndoSource(null)}>Keep checked</button><button type="button" className="museum-admin-button" disabled={!editable} onClick={undoPlacement}>Undo check</button></div></>:<p>{undoRow.undo?.reason??"The previous state cannot be safely restored for this older confirmation. Its saved location has not changed."}</p>}</MuseumDetailDialog>:null}</div>;
}
