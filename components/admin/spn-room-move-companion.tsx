"use client";
import {MuseumStagingContents} from "./museum-staging-contents";
import {MuseumClearContents} from "./museum-clear-contents";
import {spnCaseExecutionHold} from "@/lib/museum-case-execution-holds";
import {componentClearanceScope} from "@/lib/museum-component-clearance-domain";
import {companionRows,companionRowForPhase,type CompanionPhase,type CompanionRowKey} from "@/lib/museum-companion-navigation";
import {vitrineProgress} from "@/lib/museum-vitrine-progress";
import {MuseumShelfPlans} from "./museum-shelf-plans";
import {MuseumActiveShelfGuide} from "./museum-active-shelf-guide";
import {mergeMuseumPhysicalProgress} from "@/lib/museum-physical-progress-client";
import {MuseumCompanionSearch,type CompanionSearchEntry} from "./museum-companion-search";
import type {CompanionAddition} from "@/lib/museum-companion-additions-state";
import {projectCompanionAdditions,companionVitrineOwner} from "@/lib/museum-companion-addition-projection";
import { spnStarterCleanup, starterCleanupPartial } from "@/lib/spn-starter-cleanup";
import {projectGuideAlternatives} from "@/lib/museum-guide-alternative-projection";
import type {AlternativeDestination} from "@/lib/museum-guide-alternatives";
import {allowsPreparedFixedHousingTransfer,preparatoryTransfersComplete} from "@/lib/museum-preparatory-transfers";
import {useEffect,useMemo,useRef,useState} from "react";
import {SPN_REGION_GROUPS} from "@/lib/spn-region-navigation";
import {MuseumHistoricalStagingReview} from "./museum-historical-staging-review";
import {MuseumDisplayWork} from "./museum-display-work";
import {useMuseumDisplayWork,type DisplayTask} from "./use-museum-display-work";
import {MuseumDetailDialog} from "./museum-detail-dialog";
import {MuseumGuideFamilyTree} from "./museum-guide-family-tree";
import {MuseumPlanTabs} from "./museum-plan-tabs";
import {AdminViewTabs} from "./admin-view-tabs";
import {MuseumRoomPlan} from "./museum-room-plan";
import {spnMuseumLayout} from "@/lib/spn-museum-layout";
import {companionLocationLabel,currentLocationLabel,isPlaced,reportedPlacementsRecorded,type StarterMoveGuide,type PhysicalState,type GuideDecision,type CompanionRow,type PhysicalLocation} from "@/lib/spn-move-guide";

type Phase=CompanionPhase;
type SessionView="active"|"staging"|"tasks"|"shelves";
type RequestBody=Record<string,unknown>;
export function SpnRoomMoveCompanion({guide:initialGuide,initialPhysical,canManage,workflow="guided",allowClear:initialAllowClear=true,phaseLabel:initialPhaseLabel="Starter row",phase:initialPhase="starter",phaseGuides:capturedPhaseGuides,initialAlternatives=[],roomTones={}}:{initialAlternatives?:AlternativeDestination[];roomTones?:Record<string,string>;guide:StarterMoveGuide;initialPhysical:PhysicalState|null;canManage:boolean;workflow?:"guided"|"room";allowClear?:boolean;phaseLabel?:string;phase?:Phase;phaseGuides?:Record<Phase,StarterMoveGuide>}){
 const [alternatives,setAlternatives]=useState(initialAlternatives);
 const [additions,setAdditions]=useState<CompanionAddition[]>([]),[additionEntries,setAdditionEntries]=useState<import("@/lib/spn-move-guide").GuideEntry[]>([]);
 const basePhaseGuides=useMemo(()=>capturedPhaseGuides?Object.fromEntries(Object.entries(capturedPhaseGuides).map(([key,value])=>[key,projectGuideAlternatives(value,alternatives)])) as Record<Phase,StarterMoveGuide>:undefined,[capturedPhaseGuides,alternatives]);
 const phaseGuides=useMemo(()=>basePhaseGuides?projectCompanionAdditions(basePhaseGuides,additions,additionEntries):undefined,[basePhaseGuides,additions,additionEntries]);
 const [phase,setPhase]=useState<Phase>(initialPhase);
 const fallbackGuide=useMemo(()=>projectGuideAlternatives(initialGuide,alternatives),[initialGuide,alternatives]);
 const guide=phaseGuides?.[phase]??fallbackGuide;
 const allowClear=guide.allowClear??(phaseGuides?phase==="starter":initialAllowClear);
 const navigationRow=companionRowForPhase(phase);
 const phaseLabel=navigationRow.label;
 const rowVitrines=phaseGuides?navigationRow.phases.flatMap(owner=>(phaseGuides[owner]?.vitrines??[]).filter(v=>companionVitrineOwner(phaseGuides,v.code)===owner).map(v=>({v,owner}))):guide.vitrines.map(v=>({v,owner:phase}));
 const [physical,setPhysical]=useState(initialPhysical),[sessionView,setSessionView]=useState<SessionView>("active"),[selected,setSelected]=useState(guide.vitrines[0]?.code??"2");
 const [viewRestored,setViewRestored]=useState(false);
 useEffect(()=>{
  const url=new URL(window.location.href);
  const requestedPhase=url.searchParams.get("phase");
  const restoredPhase=requestedPhase&&capturedPhaseGuides&&requestedPhase in capturedPhaseGuides?requestedPhase as Phase:initialPhase;
  const restoredGuide=basePhaseGuides?.[restoredPhase]??fallbackGuide;
  const requestedVitrine=url.searchParams.get("vitrine");
  setPhase(restoredPhase);
  if(requestedVitrine&&restoredGuide.vitrines.some(item=>item.code===requestedVitrine))setSelected(requestedVitrine);
  const requestedView=url.searchParams.get("moveView");
  if(requestedView==="staging"||requestedView==="tasks"||requestedView==="shelves")setSessionView(requestedView);
  setViewRestored(true);
 },[]);
 useEffect(()=>{
  if(!viewRestored)return;
  const url=new URL(window.location.href);
  url.searchParams.set("phase",phase);url.searchParams.set("vitrine",selected);
  if(sessionView==="active")url.searchParams.delete("moveView");else url.searchParams.set("moveView",sessionView);
  window.history.replaceState(window.history.state,"",url);
 },[viewRestored,phase,selected,sessionView]);
 const [readinessAttempts,setReadinessAttempts]=useState(0);
 const readinessNotice=useRef<HTMLParagraphElement>(null);
 useEffect(()=>setReadinessAttempts(0),[selected,phase]);
 useEffect(()=>{if(readinessAttempts){readinessNotice.current?.focus();readinessNotice.current?.scrollIntoView({block:"center"});}},[readinessAttempts]);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
 const [saintSearch,setSaintSearch]=useState(""),[startFilter,setStartFilter]=useState(""),[endFilter,setEndFilter]=useState("");
 const [alternativeOptions,setAlternativeOptions]=useState<string[]>([]);
 const [declineSource,setDeclineSource]=useState<string|null>(null);
 const [notOnDisplay,setNotOnDisplay]=useState(false),[declineNote,setDeclineNote]=useState("");
 const [alternativeIntent,setAlternativeIntent]=useState<"proposed"|"moved">("proposed");
 const [alternativeVitrine,setAlternativeVitrine]=useState(""),[alternativeShelf,setAlternativeShelf]=useState("");
 const [clearCorrectionId,setClearCorrectionId]=useState<string|null>(null),[correctionAcknowledged,setCorrectionAcknowledged]=useState(false);
 const clearCorrection=physical?.clearCorrections?.find(item=>item.receiptId===clearCorrectionId);
 const [undoSource,setUndoSource]=useState<string|null>(null);
 const undoRow=rowsForUndo();
 function rowsForUndo(){return physical?.rows.find(row=>row.sourceId===undoSource);}
 const [vitrineSearch,setVitrineSearch]=useState("");
 const [savingSources,setSavingSources]=useState<string[]>([]);
 const [savingTargets,setSavingTargets]=useState<Record<string,string>>({});
 useEffect(()=>{setVitrineSearch("");setClearConfirmed(false);setComponentClearConfirmed(false);},[selected]);
 const displayWork=useMuseumDisplayWork();
 const allGuides=useMemo(()=>phaseGuides?Object.values(phaseGuides):[guide],[phaseGuides,guide]);
 const allEntries=useMemo(()=>{
  const entries=new Map(allGuides.flatMap(item=>item.entries).map(entry=>[entry.sourceId,entry]));
  for(const item of allGuides){const byId=new Map(item.entries.map(entry=>[entry.sourceId,entry]));for(const vitrine of item.vitrines)for(const group of [...vitrine.families,...vitrine.cityGroups])for(const id of group.sourceIds){const entry=byId.get(id);if(entry)entries.set(id,entry);}}
  return entries;
 },[allGuides]);
 const [taskBusy,setTaskBusy]=useState<string|null>(null);
 const [taskError,setTaskError]=useState("");
 const [clearConfirmed,setClearConfirmed]=useState(false);
 const [componentClearConfirmed,setComponentClearConfirmed]=useState(false);
 const [rowDecisions,setRowDecisions]=useState<Record<string,GuideDecision[]>>({});
 const [decisions,setDecisions]=useState<GuideDecision[]>([]),[decisionsLoaded,setDecisionsLoaded]=useState(false);
 const guideVersion=useRef(guide.version);guideVersion.current=guide.version;
 const pending=useRef(false),retry=useRef<{method:string;body:RequestBody;url:string}|null>(null);
 const mutationEpoch=useRef(0);
 const physicalRef=useRef(physical);physicalRef.current=physical;
 const [syncError,setSyncError]=useState("");
 useEffect(()=>{
  let stopped=false,inFlight=false,lastFull=Date.now(),etag="";
  let controller:AbortController|null=null;
  const refresh=async()=>{
   if(stopped||inFlight||pending.current||retry.current||document.visibilityState!=="visible")return;
   inFlight=true;const epoch=mutationEpoch.current;controller=new AbortController();
   const timeout=window.setTimeout(()=>controller?.abort(),20000);
   try{
    const full=Date.now()-lastFull>=60000;
    if(full)lastFull=Date.now();
    const response=await fetch("/api/admin/museum-physical-locations?museumId=museum-spn"+(full?"":"&view=progress"),{cache:"no-store",signal:controller.signal,headers:!full&&etag?{"If-None-Match":etag}:{}});
    if(response.status===304){if(!stopped)setSyncError("");return;}
    const data=await response.json();
    if(!response.ok||!(full?Array.isArray(data.rows):Array.isArray(data.positions)))throw new Error("Live updates paused. Refresh progress to reconnect.");
    if(stopped||pending.current||epoch!==mutationEpoch.current)return;
    if(full){setPhysical(data);}else if(physicalRef.current){
     const merged=mergeMuseumPhysicalProgress(physicalRef.current.rows,data.positions);
     if(merged.needsFullRefresh)lastFull=0;
     setPhysical(previous=>previous?{...previous,rows:merged.rows,preparations:data.preparations,phaseClearances:data.phaseClearances}:previous);
     etag=response.headers.get("ETag")??"";
    }
    setSyncError("");
   }catch{if(!stopped)setSyncError("Live updates paused. Refresh progress to reconnect.");}
   finally{window.clearTimeout(timeout);inFlight=false;}
  };
  const timer=window.setInterval(()=>void refresh(),10000);
  const resume=()=>void refresh();window.addEventListener("focus",resume);document.addEventListener("visibilitychange",resume);
  return()=>{stopped=true;window.clearInterval(timer);controller?.abort();window.removeEventListener("focus",resume);document.removeEventListener("visibilitychange",resume);};
 },[]);
 const view=guide.vitrines.find(v=>v.code===selected);
 useEffect(()=>{
  if(!viewRestored||!phaseGuides||view||busy||displayWork.busy||retry.current)return;
  const owner=companionVitrineOwner(phaseGuides,selected);
  if(owner&&owner!==phase){switchPhase(owner);setSelected(selected);}
 },[viewRestored,phaseGuides,view,busy,displayWork.busy,phase,selected]);
 const editable=canManage&&!!physical&&!busy&&!displayWork.busy&&!retry.current;
 const rows=(physical?.rows??[]).map(row=>row.currentBasis==="confirmed"&&row.current?{...row,current:{...row.current,shelf:displayWork.shelf(row)}}:row);
 const occupants=rows.filter(r=>r.current?.kind==="vitrine"&&r.current.code===selected);
 const unmapped=physical?.unmappedCurrentLocations.filter(r=>r.location.kind==="vitrine"&&r.location.code===selected)??[];
 const staged=rows.filter(r=>r.current?.kind==="table"||r.componentPlacement?.location.kind==="table");
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
 const executionHold=spnCaseExecutionHold(selected);
 const preparation=physical?.preparations?.find(item=>item.vitrine===selected);
 const selectedPlaced=selectedIds.filter(id=>{const row=rows.find(r=>r.sourceId===id);return row&&isPlaced(row,selected);}).length;
 const requiredClear=guide.requiredClearVitrines?.find(code=>(!guide.clearancePerDestination||code===selected)&&!physical?.phaseClearances?.some(receipt=>(receipt.guideVersion===guide.version||guide.previousClearanceVersions?.includes(receipt.guideVersion))&&receipt.vitrine===code));
 const needsPhaseClear=!!guide.requiredClearVitrines?.length&&(!guide.clearanceRequiredDestinations||guide.clearanceRequiredDestinations.includes(selected));
 const hasAddedRecords=additions.some(a=>a.vitrine===selected);
 const needsAvailability=guide.preparationVitrines?.includes(selected)===true||(hasAddedRecords&&!needsPhaseClear&&!allowClear);
 const transferReady=(transfer:NonNullable<StarterMoveGuide["preparatoryTransfers"]>[number])=>preparatoryTransfersComplete([transfer],rows);
 const transfersReady=(guide.preparatoryTransfers??[]).filter(t=>t.requiredBefore.includes(selected)).every(transferReady);
 const preparationReady=transfersReady&&(!needsPhaseClear||!requiredClear)&&(!hasAddedRecords||preparation?.prepared===true)&&(needsAvailability?preparation?.prepared===true:needsPhaseClear?!requiredClear:!allowClear||preparation?.prepared===true||selectedPlaced>0);
 const guideById=allEntries;
 function switchPhase(next:Phase){
  if(next===phase||!phaseGuides||busy||displayWork.busy||!!retry.current||taskBusy!==null)return;
  setPhase(next);setSelected(phaseGuides[next].vitrines[0]?.code??"");setSessionView("active");
  setDecisions([]);setDecisionsLoaded(false);setSaintSearch("");setStartFilter("");setEndFilter("");setVitrineSearch("");
  setClearConfirmed(false);setComponentClearConfirmed(false);setUndoSource(null);setDeclineSource(null);setError("");setMessage("");
  if(window.location.protocol!=="file:"){const url=new URL(window.location.href);if(next==="starter")url.searchParams.delete("phase");else url.searchParams.set("phase",next);window.history.replaceState(null,"",url);}
 }
 async function send(method:string,body:RequestBody,url="/api/admin/museum-physical-locations",propagateError=false){
  if(pending.current){if(propagateError)throw new Error("Another save is in progress. Try again when it finishes.");return;}
  pending.current=true;mutationEpoch.current+=1;setBusy(true);setError("");setMessage("");
  setSavingSources(Array.isArray(body.records)?body.records.map((record:{sourceId:string})=>record.sourceId):typeof body.sourceId==="string"?[body.sourceId]:[]);
  setSavingTargets(Object.fromEntries((Array.isArray(body.records)?body.records:[]).filter(record=>record.to?.kind==="vitrine").map(record=>[record.sourceId,record.to.code])));
  retry.current={method,body,url};
  try{
   const response=await fetch(url,{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
   const result=await response.json();
   if(!response.ok){
    if(response.status<500)retry.current=null;
    if(response.status===409){
     const refreshed=await fetch("/api/admin/museum-physical-locations?museumId=museum-spn",{cache:"no-store"});
     const snapshot=await refreshed.json();
     if(refreshed.ok&&Array.isArray(snapshot.rows)){setPhysical(snapshot);throw new Error((result.error||"Another curator updated this record.")+" Current progress is now loaded; review it before trying again.");}
    }
    throw new Error(result.error||"Could not save this change.");
   }
   if(!result.decision&&!Array.isArray(result.rows)&&!Array.isArray(result.preparations))throw new Error("The save could not be confirmed. Refresh progress before trying again.");
   if(body.action==="preparation.update"){setPhysical(previous=>previous?{...previous,preparations:result.preparations}:previous);retry.current=null;setMessage("Preparation saved.");return result;}
   if(body.action==="undo"||body.action==="clear.correct"){
    retry.current=null;
    setPhysical(previous=>previous?{...previous,confirmationHistory:[],reportedPlacementReceipts:undefined,rows:previous.rows.map(row=>result.rows.find((next:CompanionRow)=>next.sourceId===row.sourceId)??row)}:result);
    const refreshed=await fetch("/api/admin/museum-physical-locations?museumId=museum-spn",{cache:"no-store"});
    const snapshot=await refreshed.json();
    if(!refreshed.ok||!Array.isArray(snapshot.rows))throw new Error("The correction was saved. Refresh progress to load the updated history.");
    setPhysical(snapshot);if(body.action==="clear.correct")await displayWork.reload();setClearCorrectionId(null);setCorrectionAcknowledged(false);setMessage(body.action==="clear.correct"?"Mistaken clearing corrected.":"Check undone.");return;
   }
   if(Array.isArray(result.alternativeDestinations))setAlternatives(result.alternativeDestinations);
   if(result.decision){setRowDecisions(previous=>({...previous,[guide.version]:[...(previous[guide.version]??[]).filter(d=>d.suggestionId!==result.decision.suggestionId),result.decision]}));setDecisions(previous=>[...previous.filter(d=>d.suggestionId!==result.decision.suggestionId),result.decision]);if(body.decision==="declined"||body.decision==="not_on_display")setDeclineSource(null);}
   else setPhysical(previous=>previous?{...previous,...(Array.isArray(result.preparations)?{preparations:result.preparations}:{}),...(Array.isArray(result.phaseClearances)?{phaseClearances:result.phaseClearances}:{}),confirmationHistory:result.receipt?[result.receipt,...(previous.confirmationHistory??[])]:previous.confirmationHistory,rows:previous.rows.map(row=>result.rows.find((next:CompanionRow)=>next.sourceId===row.sourceId)??row)}:result);retry.current=null;setMessage(result.alreadyRecorded?.length?"Already recorded by another curator. Progress updated.":"Saved.");setClearConfirmed(false);setComponentClearConfirmed(false);return result;
  }catch(e){const message=e instanceof Error?e.message:"Could not save. Retry the same action or reload to check its status.";setError(message);if(propagateError)throw new Error(message);}
  finally{pending.current=false;setBusy(false);setSavingSources([]);setSavingTargets({});}
 }
 async function reload(){
  if(pending.current)return;pending.current=true;mutationEpoch.current+=1;setBusy(true);setError("");
  try{const response=await fetch("/api/admin/museum-physical-locations?museumId=museum-spn",{cache:"no-store"});const data=await response.json();if(!response.ok)throw new Error(data.error||"Could not load current locations.");setPhysical(data);await Promise.all([loadDecisions(),displayWork.reload()]);retry.current=null;setMessage("Current progress loaded.");setSyncError("");}
  catch(e){setError(e instanceof Error?e.message:"Could not load current progress.");}finally{pending.current=false;setBusy(false);setSavingSources([]);setSavingTargets({});}
 }
 async function loadDecisions(){
  const response=await fetch("/api/admin/museum-guide-decisions?museumId=museum-spn&guideVersion="+encodeURIComponent(guide.version),{cache:"no-store"});
  const data=await response.json();if(!response.ok)throw new Error(data.error||"Could not load suggestion decisions.");
  setRowDecisions(previous=>({...previous,[guide.version]:data.decisions}));
  if(guideVersion.current===guide.version){setDecisions(data.decisions);if(Array.isArray(data.alternativeDestinations))setAlternatives(data.alternativeDestinations);setAlternativeOptions(Array.isArray(data.alternativeVitrines)?data.alternativeVitrines:[]);setDecisionsLoaded(true);}
 }
 useEffect(()=>{void loadDecisions().catch(()=>setError("Suggestion decisions could not load. Refresh progress to try again."));},[guide.version]);
 useEffect(()=>{
  if(!phaseGuides)return;
  let cancelled=false;
  void Promise.all(navigationRow.phases.filter(owner=>owner!==phase&&phaseGuides[owner]).map(async owner=>{
   const version=phaseGuides[owner].version;
   const response=await fetch("/api/admin/museum-guide-decisions?museumId=museum-spn&guideVersion="+encodeURIComponent(version),{cache:"no-store"});
   if(!response.ok)throw new Error("Could not load row progress.");
   const data=await response.json();
   if(!cancelled)setRowDecisions(previous=>({...previous,[version]:data.decisions}));
  })).catch(()=>{if(!cancelled)setError("Some row progress could not load. Refresh progress to try again.");});
  return()=>{cancelled=true;};
 },[phase,guide.version]);
 function decide(suggestionId:string,value:GuideDecision["decision"],note?:string){
  if(!editable||!decisionsLoaded)return;
  return send("POST",{museumId:"museum-spn",guideVersion:guide.version,contentDigest:guide.contentDigest,assignmentDigest:guide.assignmentDigest,suggestionId,expectedVersion:decisions.find(d=>d.suggestionId===suggestionId)?.version??0,clientRequestId:crypto.randomUUID(),decision:value,note:note??decisions.find(d=>d.suggestionId===suggestionId)?.note??undefined,...(value==="declined"?{alternativeVitrine:alternativeVitrine||null,alternativeShelf:alternativeVitrine?alternativeShelf.trim()||null:null}:{})},"/api/admin/museum-guide-decisions");
 }
 async function saveAlternative(){
  if(!declineSource)return;
  if(notOnDisplay){await decide(declineSource,"not_on_display",declineNote);return;}
  const sourceId=declineSource.startsWith("row:")?declineSource.slice(4):null;
  const row=sourceId?rows.find(r=>r.sourceId===sourceId):null;
  const hold=spnCaseExecutionHold(alternativeVitrine)||(row?.current?.kind==="vitrine"?spnCaseExecutionHold(row.current.code):null);
  if(alternativeIntent==="moved"&&hold){setError(hold);return;}
  if(alternativeIntent==="moved"&&(!row||!alternativeVitrine||blocked(row)))return;
  const result=await decide(declineSource,"declined",declineNote);
  if(!result?.decision||alternativeIntent!=="moved"||!row)return;
  if(isPlaced(row,alternativeVitrine)&&(row.current?.shelf??"")===alternativeShelf.trim()){setMessage("Alternative saved. This location is already confirmed.");return;}
  const now=new Date();
  const confirmedDate=[now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
  const saved=await send("POST",{museumId:"museum-spn",clientRequestId:crypto.randomUUID(),confirmedDate,datePrecision:"date",evidence:"Curator explicitly confirmed the alternative destination as already moved.",physicalConfirmation:true,inventoryAcknowledged:true,
   guideContext:{guideVersion:guide.version,contentDigest:guide.contentDigest,assignmentDigest:guide.assignmentDigest},
   alternativeDecision:{guideVersion:guide.version,suggestionId:declineSource,version:result.decision.version},
   records:[{sourceId:row.sourceId,saintId:row.saintId,expectedLocationVersion:row.currentVersion,expectedCurrentRevision:row.currentRevision,expectedSourceRevision:row.sourceRevision,to:{kind:"vitrine",code:alternativeVitrine,label:"Vitrine "+alternativeVitrine,...(alternativeShelf.trim()?{shelf:alternativeShelf.trim()}:{})}}]});
  if(!saved)setMessage("Alternative saved as proposed. The physical move was not confirmed.");
 }
 function openDecline(id:string){setAlternativeIntent("proposed");setError("");const saved=decisions.find(d=>d.suggestionId===id);setNotOnDisplay(saved?.decision==="not_on_display");setDeclineNote(saved?.note??"");setAlternativeVitrine(saved?.alternativeVitrine??"");setAlternativeShelf(saved?.alternativeShelf??"");setDeclineSource(id);}
 function decisionControls(id:string){
  if(id.startsWith("curator-additions:")||(id.startsWith("row:")&&additions.some(a=>a.sourceId===id.slice(4))))return null;
  const saved=decisions.find(d=>d.suggestionId===id);const status=saved?.decision??"pending";
  return <div className="review-actions museum-guide-decision" data-status={status}>{status==="pending"?<><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={!editable||!decisionsLoaded} onClick={()=>decide(id,"deferred")}>Defer</button><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={!editable||!decisionsLoaded} onClick={()=>openDecline(id)}>Decline</button></>:<><span className="museum-guide-decision__status">{status==="not_on_display"?"Not on display":status==="deferred"?"◷ Deferred":saved?.alternativeVitrine?"Alternative proposed":"− Declined"}</span>{status==="not_on_display"&&saved?.note?<small>{saved.note}</small>:null}{status==="declined"?<>{saved?.alternativeVitrine?<small>Alternative: Vitrine {saved.alternativeVitrine}{saved.alternativeShelf?` · Shelf ${saved.alternativeShelf}`:""}</small>:null}<button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={!editable||!decisionsLoaded} onClick={()=>openDecline(id)}>Edit alternative</button></>:null}<button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={!editable||!decisionsLoaded} onClick={()=>decide(id,"pending")} aria-label="Restore suggestion">Restore</button></>}</div>;
 }
 function move(items:CompanionRow[],to:PhysicalLocation,clearedVitrines?:string[],componentSources:string[]=[]){
  if(!editable)return;
  const hold=(to.kind==="vitrine"?spnCaseExecutionHold(to.code):null)||items.map(row=>row.current?.kind==="vitrine"?spnCaseExecutionHold(row.current.code):null).find(Boolean)||(clearedVitrines??[]).map(spnCaseExecutionHold).find(Boolean);
  if(hold){setError(hold);return;}
  const alternative=items.length===1&&!clearedVitrines?alternatives.find(a=>a.sourceId===items[0].sourceId&&to.kind==="vitrine"&&a.vitrine===to.code):undefined;
  const addition=items.length===1&&!clearedVitrines&&to.kind==="vitrine"?additions.find(a=>a.sourceId===items[0].sourceId&&a.vitrine===to.code):undefined;
  if(addition)to={...to,shelf:addition.shelf};
  else if(alternative)to={...to,...(alternative.shelf?{shelf:alternative.shelf}:{})};
  const authorizationGuide=addition?(capturedPhaseGuides?Object.values(capturedPhaseGuides):[initialGuide]).find(g=>g.vitrines.some(v=>v.code===to.code)):guide;
  const now=new Date();const confirmedDate=[now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
  void send("POST",{museumId:"museum-spn",clientRequestId:crypto.randomUUID(),confirmedDate,datePrecision:"date",evidence:"Curator confirmed this physical move in the starter-row companion.",physicalConfirmation:true,inventoryAcknowledged:true,...(authorizationGuide?{guideContext:{guideVersion:authorizationGuide.version,contentDigest:authorizationGuide.contentDigest,assignmentDigest:authorizationGuide.assignmentDigest}}:{}),
   ...(additions.find(a=>items.length===1&&a.sourceId===items[0].sourceId&&a.vitrine===to.code)?{curatorAddition:{sourceId:items[0].sourceId,version:additions.find(a=>a.sourceId===items[0].sourceId)!.version}}:{}),
   ...(alternative&&!additions.some(a=>items.length===1&&a.sourceId===items[0].sourceId&&a.vitrine===to.code)?{alternativeDecision:{guideVersion:alternative.guideVersion,suggestionId:alternative.suggestionId,version:alternative.version}}:{}),
   ...(componentSources.length?{componentStagingAcknowledgements:componentSources.map(sourceId=>({sourceId,scope:componentClearanceScope(items.find(row=>row.sourceId===sourceId)!),allOriginPiecesStaged:true,walkingSticksNotInVitrine:true}))}:{}),
   records:items.map(r=>({sourceId:r.sourceId,saintId:r.saintId,expectedLocationVersion:r.currentVersion,expectedCurrentRevision:r.currentRevision,expectedSourceRevision:r.sourceRevision,to})),...(clearedVitrines?{clearedVitrines,...((guide.requiredClearVitrines?.length||componentSources.length)?{initialCaseClearAcknowledged:true}:{})}:{})});
 }
 function togglePlacement(row:CompanionRow,target:string){
  const hold=spnCaseExecutionHold(target)||(row.current?.kind==="vitrine"?spnCaseExecutionHold(row.current.code):null);
  if(hold){setError(hold);return;}
  if(isPlaced(row,target)){setUndoSource(row.sourceId);return;}
  if(!preparationReady){setReadinessAttempts(value=>value+1);return;}
  move([row],{kind:"vitrine",code:target,label:`Vitrine ${target}`});
 }
 function undoPlacement(){
  if(!undoRow?.undo?.available||!undoRow.undo.receiptId||!editable)return;
  void send("POST",{action:"undo",museumId:"museum-spn",clientRequestId:crypto.randomUUID(),receiptId:undoRow.undo.receiptId,sourceId:undoRow.sourceId,saintId:undoRow.saintId,expectedCurrentRevision:undoRow.currentRevision,expectedSourceRevision:undoRow.sourceRevision,expectedLocationVersion:undoRow.currentVersion,mistakenCheckAcknowledged:true});
  setUndoSource(null);
 }
 function blocked(row:CompanionRow){return !!(row.current?.kind==="vitrine"&&spnCaseExecutionHold(row.current.code))||!!row.componentPlacement||row.verifiedItemIds.length>0||row.fixedHousing||row.identityChanged||!!row.movementBlockedReason;}
 function isNotOnDisplay(id:string){return decisions.some(d=>d.suggestionId==="row:"+id&&d.decision==="not_on_display");}
 function display(sourceId:string,target=selected,allowMove=true,compact=false,showWork=false){
  const row=rows.find(r=>r.sourceId===sourceId),entry=guideById.get(sourceId);
  if(!row)return <p key={sourceId} role="note">{entry?.name??sourceId}: current record unavailable. Reload before recording a move.</p>;
  if(isNotOnDisplay(sourceId))return <div className="museum-guide-narrative" key={sourceId}><strong>{entry?.name??row.name}</strong>{decisionControls("row:"+sourceId)}</div>;
  const placed=isPlaced(row,target);
  const reviewBlock=spnCaseExecutionHold(target)||(row.current?.kind==="vitrine"?spnCaseExecutionHold(row.current.code):null)||row.movementBlockedReason||(row.reviewedHousing?undefined:entry?.movementBlockedReason);
  if(workflow==="guided")return <div className="museum-guide-check" key={sourceId} id={compact?undefined:`move-${sourceId}`}>
   <input type="checkbox" aria-label={`Mark ${entry?.name??row.name} placed in Vitrine ${target}`} checked={placed||savingTargets[sourceId]===target} disabled={!editable||blocked(row)||!target||!allowMove||!!reviewBlock} onChange={()=>togglePlacement(row,target)}/>
   <div className="museum-guide-check__body"><details><summary>{entry?.name??row.name}{compact&&entry?<span className="museum-guide-tier">{entry.tier}</span>:null}</summary><p>{entry?.relicDescription}</p><p>Original: {currentLocationLabel(row.original)}</p><p>{entry?.rationale}</p></details>
    {starterCleanupPartial(sourceId)?<small className="museum-guide-tier">Partially moved · remaining pieces to bring</small>:null}{savingSources.includes(sourceId)?<small role="status">Saving…</small>:null}<small>{placed?"Placed · saved":row.componentPlacement?"Partly staged":row.currentBasis==="confirmed"?"Current":"Last recorded"}: {companionLocationLabel(row)}{target!==selected?` → Vitrine ${target}`:""}</small>
    {entry?.reportedOrigin&&row.currentBasis!=="confirmed"?<small>{entry.reportedOrigin}</small>:null}{entry?.city?<small>{entry.city}</small>:null}{entry?.lifeStatus?.tag?<small className="museum-guide-tier">{entry.lifeStatus.tag}</small>:null}{row.identityChanged?<small>Identity changed. Reload and review before recording a move.</small>:!reviewBlock&&blocked(row)?<small>Fixed housing or a verified inventory item needs its existing item-move workflow.</small>:null}{reviewBlock?<p role="note">{reviewBlock}</p>:null}{entry?.reviewNotes?.map(note=><small key={note}>{note}</small>)}{showWork&&allowMove?<MuseumDisplayWork tasks={displayWork.tasks.filter(task=>task.sourceId===sourceId)} name={entry?.name??row.name} shelf={displayWork.shelf(row)} canEditShelf={placed} canManage={editable&&displayWork.loaded} onShelfSave={value=>displayWork.saveShelf(row,value)} onTaskAdd={title=>displayWork.addTask(row,title)}/>:null}
   </div>{!placed&&canManage&&allowMove&&pilotIds.has(sourceId)?decisionControls("row:"+sourceId):null}
  </div>;
  return <article className="room-move__display" key={sourceId} id={`move-${sourceId}`}>
   <div><p className="eyebrow">{entry?.tier??"Display"}{entry?.city?` · ${entry.city}`:""}</p><h3>{entry?.name??row.name}</h3><p>{entry?.relicDescription}</p>{entry?.lifeStatus?.tag?<small className="museum-guide-tier">{entry.lifeStatus.tag}</small>:null}</div>
   <div><small>{row.componentPlacement?"Recorded pieces":row.currentBasis==="confirmed"?"Current location":"Last recorded location"}</small><strong>{companionLocationLabel(row)}</strong><p>{target?`To Vitrine ${target}`:"No destination in this guide"}</p>{reviewBlock?<p role="note">{reviewBlock}</p>:null}{entry?.reviewNotes?.map(note=><p key={note} className="muted">{note}</p>)}
    <label className="room-move__check"><input type="checkbox" checked={placed||savingTargets[sourceId]===target} disabled={!editable||blocked(row)||!target||!allowMove||!!reviewBlock} onChange={()=>togglePlacement(row,target)}/>{placed?"Placed · saved":"Placed in this vitrine"}</label>

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
  const owner=phaseGuides&&companionVitrineOwner(phaseGuides,target);
  if(!owner){setMessage(`Vitrine ${target} has no phase guide yet. Its proposed destination is shown in search and the proposal reviewer.`);return;}
  if(owner!==phase)switchPhase(owner);
  setSelected(target);setSessionView("active");setClearConfirmed(false);setComponentClearConfirmed(false);
 }
 function taskList(){
  const groups=new Map<string,DisplayTask[]>();
  for(const task of displayWork.tasks){const row=rows.find(r=>r.sourceId===task.sourceId),entry=guideById.get(task.sourceId);const code=row?.currentBasis==="confirmed"&&row.current?.kind==="vitrine"?row.current.code:entry?.destination??"";groups.set(code,[...(groups.get(code)??[]),task]);}
  return <>{displayWork.error?<p role="alert">{displayWork.error} <button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>void displayWork.reload().catch(error=>setTaskError(error.message))}>Retry</button></p>:null}{taskError?<p role="alert">{taskError}</p>:null}{!displayWork.loaded?<p>Loading to-dos…</p>:!displayWork.tasks.length?<p>No to-dos yet. Add one from a saint’s final checklist entry.</p>:[...groups].sort(([a],[b])=>(Number(a)||Infinity)-(Number(b)||Infinity)).map(([code,tasks])=><section className="museum-companion__task-group" key={code}><h3>{code?'Vitrine '+code:'Vitrine not assigned'}</h3>{tasks.sort((a,b)=>Number(a.status==="completed")-Number(b.status==="completed")).map(task=>{const entry=guideById.get(task.sourceId),row=rows.find(r=>r.sourceId===task.sourceId);return <label className="museum-guide-check" key={task.id}><input type="checkbox" checked={task.status==="completed"} disabled={!canManage||taskBusy!==null} onChange={event=>void completeTask(task,event.target.checked)}/><span className="museum-guide-check__body"><strong>{task.title}</strong><small>{entry?.name??row?.name??task.sourceId}</small>{taskBusy===task.id?<small role="status">Saving…</small>:null}</span></label>;})}</section>)}</>;
 }
 function preparatoryTransfersCard(){
  if(!guide.preparatoryTransfers?.length)return null;
  const available=physical?.preparations?.find(p=>p.vitrine==="70");
  return <section className="museum-admin-panel" aria-label="Transfer the two large objects"><h2>First: Vitrine 23 → 70</h2><p>Check that both objects fit in 70, then tick each after moving it.</p>{!available?.prepared?<button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={!editable} onClick={()=>send("POST",{action:"preparation.update",museumId:"museum-spn",clientRequestId:crypto.randomUUID(),vitrine:"70",prepared:true,expectedVersion:available?.version??0})}>Confirm 70 is ready</button>:null}{guide.preparatoryTransfers.map(transfer=>{const row=rows.find(r=>r.sourceId===transfer.sourceId);const completed=transferReady(transfer);return <div className="museum-companion__checklist-row" key={transfer.sourceId}><label className="room-move__check"><input type="checkbox" checked={completed} disabled={!editable||!row||row.identityChanged||row.verifiedItemIds.length>0||!!row.movementBlockedReason||(row.fixedHousing&&!completed&&!allowsPreparedFixedHousingTransfer(row.sourceId,row.current,{kind:"vitrine",code:transfer.toVitrine},guide.preparatoryTransfers))||!available?.prepared||(completed&&(!row?.undo?.available||!isPlaced(row,transfer.toVitrine)))} onChange={()=>{if(completed&&row){setUndoSource(row.sourceId);return;}if(row)move([row],{kind:"vitrine",code:transfer.toVitrine,label:`Vitrine ${transfer.toVitrine}`});}}/>{transfer.name}</label><small>{row?companionLocationLabel(row):"Refresh to load the current location"}{transfer.finalDestination!==transfer.toVitrine?` · Temporary holding; planned destination ${transfer.finalDestination}`:""}</small></div>;})}</section>;
 }
 function markPrepared(){if(!editable)return;if(executionHold){setError(executionHold);return;}void send("POST",{action:"preparation.update",museumId:"museum-spn",clientRequestId:crypto.randomUUID(),vitrine:selected,prepared:true,expectedVersion:preparation?.version??0});}
 function availabilityCard(){
  return <section className="museum-admin-panel" aria-label="Vitrine availability"><h2>Prepare Vitrine {selected}</h2>{preparation?.prepared?<p className="museum-companion__prepared">✓ Available for placement</p>:<><label className="room-move__check"><input type="checkbox" checked={clearConfirmed} disabled={!editable} onChange={event=>setClearConfirmed(event.target.checked)}/>I have checked Vitrine {selected}; it is available for this display.</label><button type="button" className="museum-admin-button" disabled={!editable||!clearConfirmed} onClick={markPrepared}>Confirm available</button></>}</section>;
 }
 function componentAcknowledgement(partial:CompanionRow[],code:string){
  return partial.length?<label className="room-move__check"><input type="checkbox" checked={componentClearConfirmed} disabled={!editable} onChange={event=>setComponentClearConfirmed(event.target.checked)}/>For {partial.map(row=>row.name).join(" and ")}, all pieces from Vitrine {code} are staged. Their walking sticks were not in this vitrine and have not been moved.</label>:null;
 }
 function phaseClearanceCard(){
  if(!requiredClear)return <p className="museum-companion__prepared">✓ Required clearing recorded</p>;
  const contents=rows.filter(row=>row.current?.kind==="vitrine"&&row.current.code===requiredClear);
  const missing=physical?.unmappedCurrentLocations.filter(row=>row.location.kind==="vitrine"&&row.location.code===requiredClear)??[];
  const partial=contents.filter(row=>!!componentClearanceScope(row)&&!row.componentPlacement);
  const held=contents.filter(row=>blocked(row)&&!partial.includes(row));
  return <section className="museum-admin-panel" aria-label="Required phase clearing"><h2>Clear Vitrine {requiredClear}</h2>
   <MuseumClearContents rows={contents} missing={missing} entries={clearingDestinations()} sourceVitrine={requiredClear} partialIds={partial.map(row=>row.sourceId)}/>
   <label className="room-move__check"><input type="checkbox" checked={clearConfirmed} disabled={!editable} onChange={event=>setClearConfirmed(event.target.checked)}/>I have cleared Vitrine {requiredClear}; its contents are in the staging area.</label>
   {componentAcknowledgement(partial,requiredClear)}
   <button type="button" className="museum-admin-button" disabled={!editable||!clearConfirmed||(partial.length>0&&!componentClearConfirmed)||missing.length>0||held.length>0} onClick={()=>move(contents,{kind:"table",code:"staging-area",label:"Staging area"},[requiredClear],partial.map(row=>row.sourceId))}>Confirm cleared</button>
   {missing.length>0||held.length>0?<div role="alert"><p>Clearing is blocked by records that need review:</p><ul>{missing.map(row=><li key={row.sourceId}>{row.sourceId}: unlinked location record.</li>)}{held.map(row=><li key={row.sourceId}>{row.name}: {row.movementBlockedReason||(row.identityChanged?"Identity needs review.":row.fixedHousing?"Fixed display needs review.":"Use the individual item workflow.")}</li>)}</ul></div>:<small>{partial.length?`Confirm both statements. Only the Vitrine ${requiredClear} pieces will be recorded as staged; separately housed sticks stay unchanged.`:"Confirm clearing before recording new placements."}</small>}
  </section>;
 }
 function clearingDestinations(){
  const entries=new Map([...allEntries.values(),...additionEntries].map(entry=>[entry.sourceId,entry]));
  for(const alternative of alternatives){const entry=entries.get(alternative.sourceId);if(entry)entries.set(entry.sourceId,{...entry,destination:alternative.vitrine});}
  for(const addition of additions){const entry=entries.get(addition.sourceId);if(entry)entries.set(entry.sourceId,{...entry,destination:addition.vitrine});}
  return [...entries.values()];
 }
 function clearanceCard(){
  const partial=occupants.filter(row=>!!componentClearanceScope(row)&&!row.componentPlacement);
  const held=occupants.filter(row=>blocked(row)&&!partial.includes(row));
  if(preparation?.prepared)return <p className="museum-companion__prepared" role="status">✓ Vitrine {selected} · preparation complete</p>;
  const started=occupants.some(row=>row.currentBasis==="confirmed");
  return <section className="museum-admin-panel" aria-label="Vitrine preparation"><h2>Prepare Vitrine {selected}</h2>{preparation?.prepared?<p className="museum-companion__prepared">✓ Preparation complete</p>:started||initiallyEmpty||!occupants.length?<><p>{started?'Placement has started. The saved locations will stay unchanged.':initiallyEmpty?'New vitrine · no contents to clear.':'No contents are recorded here.'}</p><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={!editable||unmapped.length>0} onClick={markPrepared}>Mark preparation complete</button>{unmapped.length?<p>Review the unlinked location records before continuing.</p>:null}</>:<><MuseumClearContents rows={occupants} missing={unmapped} entries={clearingDestinations()} sourceVitrine={selected} partialIds={partial.map(row=>row.sourceId)}/><label className="room-move__check"><input type="checkbox" checked={clearConfirmed} onChange={event=>setClearConfirmed(event.target.checked)}/>The listed contents are now in the staging area.</label>{componentAcknowledgement(partial,selected)}<button type="button" className="museum-admin-button" disabled={!editable||!clearConfirmed||!reportsSaved||unmapped.length>0||held.length>0||(partial.length>0&&!componentClearConfirmed)} onClick={()=>move(occupants,{kind:"table",code:"staging-area",label:"Staging area"},[selected],partial.map(row=>row.sourceId))}>Confirm cleared</button>{!reportsSaved?<p>Review the reported placements above before clearing.</p>:null}</>}{!preparationReady?<small>Complete preparation before marking new placements.</small>:null}</section>;
 }
  function correctClearing(){
  if(!clearCorrection||!correctionAcknowledged||!editable)return;
  void send("POST",{action:"clear.correct",museumId:"museum-spn",clientRequestId:crypto.randomUUID(),receiptId:clearCorrection.receiptId,mistakenClearAcknowledged:true,records:clearCorrection.records.map(({sourceId,saintId,expectedCurrentRevision,expectedSourceRevision,expectedLocationVersion})=>({sourceId,saintId,expectedCurrentRevision,expectedSourceRevision,expectedLocationVersion}))});
 }
 function clearingCorrections(){return canManage&&physical?.clearCorrections?.length?<details className="museum-guide-help"><summary>Correct a mistaken clearing</summary>{physical.clearCorrections.map(item=><div className="review-actions" key={item.receiptId}><span>Vitrine {item.vitrine} · {item.records.length} previously placed entries</span><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={!editable} onClick={()=>{setClearCorrectionId(item.receiptId);setCorrectionAcknowledged(false);}}>Review correction</button></div>)}</details>:null;}
 function stagingList(){
  const destinations=clearingDestinations();
  const bySource=new Map(destinations.map(entry=>[entry.sourceId,entry]));
  return <>{clearingCorrections()}<MuseumStagingContents rows={staged} entries={destinations} missing={physical?.unmappedCurrentLocations.filter(row=>row.location.kind==="table")??[]} renderRow={row=>{
   const entry=bySource.get(row.sourceId);
   const inGuide=entry&&allGuides.some(item=>item.vitrines.some(v=>v.code===entry.destination&&[...v.families,...v.cityGroups].some(g=>g.sourceIds.includes(row.sourceId))));
   return <article className="museum-guide-check" key={row.sourceId}><div className="museum-guide-check__body"><strong>{entry?.name??row.name}</strong>{row.componentPlacement?<><small>Vitrine {row.componentPlacement.origin.code} pieces only · staged</small><small>Walking sticks elsewhere · location unverified</small></>:<small>Source start: {currentLocationLabel(row.original)}</small>}{entry?.proposalTransfer?<small>{entry.proposalTransfer.label}</small>:null}</div>{row.componentPlacement&&row.undo?.available?<button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={!editable} onClick={()=>setUndoSource(row.sourceId)}>Correct staging record</button>:null}{inGuide?<button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>openDestination(row.sourceId,entry.destination)}>Vitrine {entry.destination}</button>:null}</article>;
  }}/></>;
 }
 function tiered(ids:string[]){
  return ["Primary","Secondary","Tertiary","Other"].map(tier=>{
   const matches=ids.filter(id=>{const value=guideById.get(id)?.tier;return tier==="Other"?!["Primary","Secondary","Tertiary"].includes(value??""):value===tier;});
   return matches.length?<section key={tier}><h3 className="museum-guide-stage">{tier} · {matches.length}</h3>{matches.map(id=>display(id,selected,true,false,true))}</section>:null;
  });
 }
 function catalogEntry(entry:CompanionSearchEntry){return {sourceId:entry.sourceId,saintId:entry.saintId,name:entry.name,tier:entry.tier,city:entry.city,relicDescription:allEntries.get(entry.sourceId)?.relicDescription??"",destination:entry.destination,proposalTransfer:entry.proposalTransfer,section:entry.section,family:"",lifeStatus:entry.lifeStatus??allEntries.get(entry.sourceId)?.lifeStatus,rationale:"Curator-added destination"};}
 function retryAddition(){
  const value=retry.current?.body.curatorAddition;
  return value&&typeof value==="object"&&"sourceId" in value&&typeof value.sourceId==="string"&&"version" in value&&typeof value.version==="number"?{sourceId:value.sourceId,version:value.version}:null;
 }
 async function addDestination(addition:CompanionAddition,entry:CompanionSearchEntry,moved:boolean){
  setAdditions(previous=>[...previous.filter(a=>a.sourceId!==addition.sourceId),addition]);
  setAdditionEntries(previous=>[...previous.filter(e=>e.sourceId!==entry.sourceId),catalogEntry(entry)]);
  if(!moved){setMessage("Proposed destination saved.");return true;}
  const owner=capturedPhaseGuides?companionVitrineOwner(capturedPhaseGuides,addition.vitrine):undefined;
  const receiver=owner&&capturedPhaseGuides?capturedPhaseGuides[owner]:initialGuide.vitrines.some(v=>v.code===addition.vitrine)?initialGuide:undefined;
  const previous=retry.current;
  if(previous&&retryAddition()?.sourceId===addition.sourceId&&retryAddition()?.version===addition.version)return !!await send(previous.method,previous.body,previous.url,true);
  if(previous)throw new Error("Resolve the pending save before confirming this move.");
  const row=physicalRef.current?.rows.find(r=>r.sourceId===entry.sourceId)??entry;
  const hold=spnCaseExecutionHold(addition.vitrine)||(row.current?.kind==="vitrine"?spnCaseExecutionHold(row.current.code):null);
  if(hold)throw new Error(hold);
  const now=new Date();const confirmedDate=[now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
  const result=await send("POST",{museumId:"museum-spn",clientRequestId:crypto.randomUUID(),confirmedDate,datePrecision:"date",physicalConfirmation:true,inventoryAcknowledged:true,evidence:"Curator confirmed a museum-search addition as already moved.",curatorAddition:{sourceId:addition.sourceId,version:addition.version},...(receiver?{guideContext:{guideVersion:receiver.version,contentDigest:receiver.contentDigest,assignmentDigest:receiver.assignmentDigest}}:{}),records:[{sourceId:row.sourceId,saintId:row.saintId,expectedLocationVersion:row.currentVersion,expectedCurrentRevision:row.currentRevision,expectedSourceRevision:row.sourceRevision,to:{kind:"vitrine",code:addition.vitrine,label:"Vitrine "+addition.vitrine,shelf:addition.shelf}}]},"/api/admin/museum-physical-locations",true);
  return !!result;
 }
 function placementControl(id:string){
  const row=rows.find(r=>r.sourceId===id),entry=guideById.get(id);
  if(!row||!selectedIds.includes(id))return null;
  if(isNotOnDisplay(id))return <small>Not on display</small>;
  const placed=isPlaced(row,selected);
  return <span className="museum-guide-tree__check"><input type="checkbox" aria-label={`Mark ${entry?.name??row.name} placed in Vitrine ${selected}`} checked={placed||savingTargets[id]===selected} disabled={!editable||!!executionHold||blocked(row)||(!row.reviewedHousing&&!!entry?.movementBlockedReason)} onChange={()=>togglePlacement(row,selected)}/>{savingSources.includes(id)?<small role="status">Saving…</small>:null}</span>;
 }
 function sorted(ids:string[]){const rank=(id:string)=>{const n=["Primary","Secondary","Tertiary"].indexOf(guideById.get(id)?.tier??"");return n<0?3:n;};return [...new Set(ids)].sort((a,b)=>rank(a)-rank(b));}
 function matchesVitrine(id:string){const entry=guideById.get(id);return !vitrineSearch.trim()||`${entry?.name??""} ${entry?.city??""}`.toLocaleLowerCase().includes(vitrineSearch.trim().toLocaleLowerCase());}
 function guidedPlacement(){
  if(!view||executionHold)return null;
  return <><MuseumActiveShelfGuide vitrine={selected} entries={guideById} rows={rows} sourceIds={selectedIds.filter(id=>!isNotOnDisplay(id))} renderControl={placementControl} renderActions={id=>{const row=rows.find(r=>r.sourceId===id);return row&&!isPlaced(row,selected)&&canManage&&pilotIds.has(id)?decisionControls("row:"+id):null;}}/><details><summary>Families & named saints</summary>{view.families.filter(g=>g.sourceIds.some(matchesVitrine)).map(g=>{
   const treeIds=new Set((g.edges??[]).flatMap(e=>[e.fromSourceId,e.toSourceId]));
   return <section key={g.id} className="museum-guide-narrative"><h3>{g.title}</h3><p>{g.rationale}</p><MuseumGuideFamilyTree group={g} entries={guideById} physicalRows={rows} renderControl={placementControl} renderActions={id=>{const row=rows.find(r=>r.sourceId===id);return row&&!isPlaced(row,selected)&&canManage&&pilotIds.has(id)?decisionControls("row:"+id):null;}}/>{sorted(g.sourceIds.filter(id=>!treeIds.has(id))).map(id=>display(id,selected,true,true))}</section>;
  })}
  </details>{view.cityGroups.length?<details><summary>City groups</summary>{view.cityGroups.filter(g=>g.sourceIds.some(matchesVitrine)).map(g=><section key={g.id} className="museum-guide-narrative"><h3>{g.title}</h3><p>{g.rationale}</p>{g.spaceEstimate?<small>{g.spaceEstimate.label}</small>:null}{sorted(g.sourceIds.filter(matchesVitrine)).map(id=>display(id,selected,true,true))}</section>)}</details>:null}
  <section aria-label="Complete vitrine checklist"><h2 className="museum-guide-stage">Complete vitrine checklist</h2>{displayWork.error?<p role="alert">Shelf and to-do controls could not load. Open the To-do tab to retry.</p>:null}{tiered([...new Set(selectedIds)].filter(id=>matchesVitrine(id)&&!isNotOnDisplay(id)))}{!selectedIds.some(matchesVitrine)?<p>No matching saints in this vitrine.</p>:null}</section>{selectedIds.some(isNotOnDisplay)?<details><summary>Not on display ({selectedIds.filter(isNotOnDisplay).length})</summary>{selectedIds.filter(isNotOnDisplay).map(id=>display(id))}</details>:null}
  </>;
 }
 return <div className={`room-move museum-companion${workflow==="guided"?" museum-companion--guide":""}`} data-museum-companion-theme="parchment"><div className="museum-companion__canvas"><MuseumPlanTabs active="companion" disabled={busy||displayWork.busy||!!retry.current||taskBusy!==null}/><header className="museum-companion__header"><div><p className="eyebrow">SPN · Move companion</p><h1>{workflow==="guided"?"SPN · placement guide":"The starter row"}</h1>{workflow==="room"?<p className="muted">Clear the space, place the key families, then fill around them.</p>:null}</div>
  <div className="review-actions"><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={busy} onClick={()=>void reload()}>Refresh progress</button>{busy?<span role="status">Saving…</span>:message?<span role="status">{message}</span>:null}</div></header><div className="museum-companion__session"><span>{guide.proposalLabel}</span><span>{guide.vitrines.length} vitrines · Progress saved to the museum</span></div>

  {syncError?<p role="status" className="admin-notice">{syncError}</p>:null}
  <MuseumCompanionSearch onStage={async(row,clientRequestId,confirmedDate)=>{await send("POST",{museumId:"museum-spn",clientRequestId,confirmedDate,datePrecision:"date",evidence:"Curator confirmed the complete reviewed object is in staging and checked its inventory record.",physicalConfirmation:true,inventoryAcknowledged:true,records:[{sourceId:row.sourceId,saintId:row.saintId,expectedLocationVersion:row.currentVersion,expectedCurrentRevision:row.currentRevision,expectedSourceRevision:row.sourceRevision,to:{kind:"table",code:"staging-area",label:"Staging area"}}]},"/api/admin/museum-physical-locations",true);}} retrySourceId={retryAddition()?.sourceId} rows={rows} canManage={canManage} disabled={!editable} isPrepared={code=>physical?.preparations?.some(p=>p.vitrine===code&&p.prepared)??false} onPrepare={async code=>!!await send("POST",{action:"preparation.update",museumId:"museum-spn",clientRequestId:crypto.randomUUID(),vitrine:code,prepared:true,expectedVersion:physical?.preparations?.find(p=>p.vitrine===code)?.version??0},"/api/admin/museum-physical-locations",true)} onOpen={openDestination} onAdd={addDestination} onCatalog={catalog=>{setAdditions(catalog.additions);setAdditionEntries(catalog.entries.map(catalogEntry));}}/>
  {error?<div role="alert" className="admin-notice"><p>{error}</p>{retry.current?<button type="button" disabled={busy} onClick={()=>{const r=retry.current;if(r)void send(r.method,r.body,r.url);}}>Retry same save</button>:null}{retry.current?<p>Keep this page open. Retry the same save, or refresh to check whether it was recorded.</p>:null}</div>:null}


  {canManage&&!reportsSaved?<details className="museum-admin-panel"><summary>Review 23 reported placements · 27 October</summary><p>These were reported as placed. Record them together after reviewing the current locations below. Shelves were not specified.</p>{reported.map(({placement,row})=><p key={placement.sourceId}>{row?.name??placement.sourceId} · {currentLocationLabel(row?.current??null)} → Vitrine {placement.destination}</p>)}{reportsBlocked?<p role="alert">A record is unavailable, restricted, or has a different confirmed location. Review it before saving this batch.</p>:null}<button type="button" className="museum-admin-button" disabled={!editable||reportsBlocked} onClick={recordReported}>Record reported placements</button></details>:null}
  <AdminViewTabs<SessionView> label="Move workspace" value={sessionView} onChange={setSessionView} disabled={busy||displayWork.busy||!!retry.current||taskBusy!==null} options={[{value:"active",label:"Active move"},{value:"shelves",label:"Shelf plans"},{value:"staging",label:'Staging area ('+(staged.length+(physical?.unmappedCurrentLocations.filter(row=>row.location.kind==="table").length??0))+')'},{value:"tasks",label:'To-do ('+displayWork.tasks.filter(task=>task.status==="open").length+')'}]}/>
  {sessionView==="active"?<div className="museum-companion__layout"><div className="museum-companion__main"><section className="museum-admin-panel museum-companion__task"><h2>Room layout</h2><MuseumRoomPlan layout={spnMuseumLayout} mode="browse" selected={[selected]} availableVitrines={[...new Set(allGuides.flatMap(g=>g.vitrines.map(v=>v.code)))]} tones={roomTones} disabled={busy||displayWork.busy||!!retry.current||taskBusy!==null} onSelect={code=>{if(busy||displayWork.busy||retry.current||taskBusy!==null)return;const owner=phaseGuides?companionVitrineOwner(phaseGuides,code):phase;if(!owner)return;if(owner!==phase)switchPhase(owner);setSelected(code);setClearConfirmed(false);setComponentClearConfirmed(false);}}/></section>
   <div className="museum-companion__guide">
    <AdminViewTabs<CompanionRowKey> scrollable label="Museum row" value={navigationRow.value} onChange={key=>{const row=companionRows.find(item=>item.value===key);const owner=row?.phases.find(item=>phaseGuides?.[item]);if(owner)switchPhase(owner);}} disabled={busy||displayWork.busy||!!retry.current||taskBusy!==null||!phaseGuides} options={companionRows.filter(row=>row.phases.some(owner=>phaseGuides?.[owner])).map(({value,label})=>({value,label}))}/>
    <div className="room-move__phase" aria-label={phaseLabel}>{rowVitrines.map(({v,owner})=>{const progress=vitrineProgress(v.code,[...v.families,...v.cityGroups],rows,owner===phase?decisions:rowDecisions[phaseGuides?.[owner]?.version??""]??[]);const done=progress.total?100*progress.addressed/progress.total:0;const deferred=progress.total?100*progress.deferred/progress.total:0;const label=`${progress.addressed} of ${progress.total} addressed · ${progress.deferred} deferred`;return <button type="button" className="museum-admin-button museum-admin-button--secondary museum-vitrine-progress" aria-pressed={selected===v.code} aria-label={`Vitrine ${v.code}, ${label}`} title={label} key={v.code} onClick={()=>{if(busy||displayWork.busy||retry.current||taskBusy!==null)return;if(owner!==phase)switchPhase(owner);setSelected(v.code);setClearConfirmed(false);setComponentClearConfirmed(false);}}><svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none"><rect className="museum-vitrine-progress__done" width={done} height="100"/><rect className="museum-vitrine-progress__deferred" x={done} width={deferred} height="100"/></svg><span>Vitrine {v.code}</span></button>;})}</div><div className="museum-vitrine-progress-legend"><span><i className="museum-vitrine-progress-legend__done" aria-hidden="true"/>Placed or declined</span><span><i className="museum-vitrine-progress-legend__deferred" aria-hidden="true"/>Deferred</span></div>
    {phase==="starter"?<section className="museum-admin-panel" aria-label="Starter row photo follow-ups"><details open><summary>Starter row photo follow-ups · 7 items</summary>{spnStarterCleanup.map(item=>{const row=rows.find(r=>r.sourceId===item.sourceId);const override=additions.find(a=>a.sourceId===item.sourceId)?.vitrine??alternatives.find(a=>a.sourceId===item.sourceId)?.vitrine;const resolved=guide.bilashFollowup?.sourceId===item.sourceId?guide.bilashFollowup:null;const target=override??(resolved?resolved.destination:item.destination);const hasGuide=target&&allGuides.some(g=>g.vitrines.some(v=>v.code===target));return <article className="museum-guide-narrative" key={item.sourceId}><div className="museum-guide-check__body"><strong>{item.name}</strong>{item.partial?<span className="museum-guide-tier">Partially moved · remaining pieces to check</span>:null}<small>{item.relic} · {target?`Vitrine ${target}`:"Destination to review"}</small><small>{resolved?.reason??item.note}</small>{override&&override!==item.destination?<small>Curator destination: Vitrine {override} · photo guidance suggested {item.destination??"review"}.</small>:null}{row?<small>{row.componentPlacement?"Recorded pieces":row.currentBasis==="confirmed"?"Confirmed display":"Last recorded"}: {companionLocationLabel(row)}</small>:null}{item.partial?<small>Existing move confirmation retained.</small>:null}</div>{hasGuide?<button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={busy||displayWork.busy||!!retry.current} onClick={()=>openDestination(item.sourceId,target!)}>View Vitrine {target}</button>:target?<small>Guide not available yet</small>:null}</article>;})}</details></section>:null}
    {!executionHold&&readinessAttempts>0&&!preparationReady?<p ref={readinessNotice} tabIndex={-1} role="alert" className="museum-guide-help">{!transfersReady?"Complete the transfers from Vitrine 23 to 70 before recording placements here.":needsPhaseClear&&requiredClear?`Confirm Vitrine ${requiredClear} is cleared before recording placements here.`:needsAvailability?`Before recording placements, check Vitrine ${selected} is ready and choose “Confirm available” below.`:needsPhaseClear?`Confirm Vitrine ${requiredClear} is cleared before recording placements here.`:`Complete the preparation for Vitrine ${selected} below before recording placements.`}</p>:null}
    {executionHold?<section className="museum-admin-panel" aria-label="Temporary display hold"><h2>Vitrine {selected} · On hold</h2><p role="status">{executionHold}</p></section>:<>{selected==="23"?preparatoryTransfersCard():null}{needsPhaseClear&&requiredClear?phaseClearanceCard():needsAvailability?availabilityCard():needsPhaseClear?phaseClearanceCard():allowClear?clearanceCard():null}{hasAddedRecords&&needsPhaseClear&&!needsAvailability&&!preparation?.prepared?availabilityCard():null}</>}
    {!executionHold?<section className="museum-admin-panel"><p className="eyebrow">{phaseLabel}</p><h2>Vitrine {selected}</h2><label className="admin-field museum-guide-vitrine-search"><span>Find in this vitrine</span><input type="search" value={vitrineSearch} onChange={event=>setVitrineSearch(event.target.value)} placeholder="Saint or city"/></label><p>{view?.summary}</p><p className="muted">{selectedPlaced} of {selectedIds.length} display records confirmed here</p>
     {guide.outgoingDependencies?.some(d=>d.previousProposedVitrine===selected)?<details className="museum-guide-help"><summary>Outgoing displays need separate destinations</summary><p>This guide does not mark the vitrine empty. Check space before placing the incoming groups.</p>{guide.outgoingDependencies.filter(d=>d.previousProposedVitrine===selected).map(d=><p key={d.sourceId}>{d.name} · {d.proposedDestination?`Proposed: Vitrine ${d.proposedDestination}`:"Destination pending"}</p>)}</details>:null}
     {guide.requiredClearVitrines?.length&&selected==="4"?<details className="museum-guide-help"><summary>Check remaining occupants · {occupants.filter(row=>!selectedIds.includes(row.sourceId)).length} outside this group</summary>{occupants.filter(row=>!selectedIds.includes(row.sourceId)).map(row=><p key={row.sourceId}>{row.name} · {companionLocationLabel(row)}</p>)}<p>Check their destinations separately before filling the remaining space.</p></details>:null}
     {guidedPlacement()}
     {outgoing.length?<section><h3>Moving beyond the starter row</h3>{outgoing.map(id=>display(id,guideById.get(id)?.destination??""))}</section>:null}
    </section>:null}
   </div>
  </div></div>:sessionView==="shelves"?<MuseumShelfPlans rows={rows} availableGuides={allGuides.flatMap(g=>g.vitrines.map(v=>v.code))} onOpenGuide={code=>{const owner=phaseGuides?companionVitrineOwner(phaseGuides,code):phase;if(!owner)return;if(owner!==phase)switchPhase(owner);setSelected(code);setSessionView("active");}}/>:<section className="museum-admin-panel"><h2>{sessionView==="tasks"?'Display to-dos':'Staging area'}</h2>{sessionView==="tasks"?taskList():<>{canManage?<MuseumHistoricalStagingReview onSaved={reload}/>:null}{stagingList()}</>}</section>}
 </div>{clearCorrection?<MuseumDetailDialog titleId="clear-correction-title" kicker="Correct a record" closeLabel="Cancel correction" onClose={()=>{if(!busy)setClearCorrectionId(null);}}><h2 id="clear-correction-title">Restore Vitrine {clearCorrection.vitrine} placements?</h2><p>These {clearCorrection.records.length} entries were confirmed here before the clearing was recorded.</p><ul>{clearCorrection.records.map(row=><li key={row.sourceId}>{row.name} · {currentLocationLabel(row.previous)}</li>)}</ul><p>The other {clearCorrection.excludedCount} entries are unchanged. The original clearing remains in the audit history.</p><label className="room-move__check"><input type="checkbox" checked={correctionAcknowledged} disabled={busy} onChange={event=>setCorrectionAcknowledged(event.target.checked)}/>These entries stayed in the vitrine; the clearing was recorded by mistake.</label>{error?<p role="alert">{error}</p>:null}{retry.current?<button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={busy} onClick={()=>retry.current&&void send(retry.current.method,retry.current.body,retry.current.url)}>Retry correction</button>:null}<div className="review-actions"><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={busy} onClick={()=>setClearCorrectionId(null)}>Cancel</button><button type="button" className="museum-admin-button" disabled={!editable||!correctionAcknowledged} onClick={correctClearing}>Restore {clearCorrection.records.length} placements</button></div></MuseumDetailDialog>:null}{declineSource?<MuseumDetailDialog titleId="decline-suggestion-title" kicker="Suggestion" closeLabel="Cancel decision" onClose={()=>{if(!busy)setDeclineSource(null);}}><h2 id="decline-suggestion-title">Decline suggestion</h2>{declineSource.startsWith("row:")?<p>{guideById.get(declineSource.slice(4))?.name}</p>:null}<form onSubmit={event=>{event.preventDefault();void saveAlternative();}}>{declineSource.startsWith("row:")?<label className="room-move__check"><input type="checkbox" checked={notOnDisplay} disabled={busy} onChange={e=>setNotOnDisplay(e.target.checked)}/>Not on display</label>:null}{!notOnDisplay?<><label className="admin-field"><span>Alternative vitrine (optional)</span><select aria-label="Alternative vitrine (optional)" value={alternativeVitrine} onChange={event=>{setAlternativeVitrine(event.target.value);if(!event.target.value)setAlternativeShelf("");}} disabled={busy}><option value="">No alternative yet</option>{[...alternativeOptions].sort((a,b)=>Number(a)-Number(b)).map(code=><option key={code} value={code}>Vitrine {code}</option>)}</select></label><label className="admin-field"><span>Shelf (optional)</span><input value={alternativeShelf} onChange={event=>setAlternativeShelf(event.target.value)} disabled={busy||!alternativeVitrine} maxLength={100}/></label>{alternativeVitrine?<fieldset disabled={busy}><legend>Destination status</legend><label className="room-move__check"><input type="radio" name="alternative-intent" checked={alternativeIntent==="proposed"} onChange={()=>setAlternativeIntent("proposed")}/>Proposed</label><label className="room-move__check"><input type="radio" name="alternative-intent" checked={alternativeIntent==="moved"} disabled={!declineSource.startsWith("row:")||!!rows.find(r=>r.sourceId===declineSource.slice(4)&&blocked(r))} onChange={()=>setAlternativeIntent("moved")}/>Already moved</label></fieldset>:null}</>:null}<label className="admin-field"><span>Note (optional)</span><textarea value={declineNote} onChange={e=>setDeclineNote(e.target.value)} disabled={busy} maxLength={2000}/></label>{error?<p role="alert">{error}</p>:null}{retry.current?<button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={busy} onClick={()=>retry.current&&void send(retry.current.method,retry.current.body,retry.current.url)}>Retry save</button>:null}<div className="review-actions"><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={busy} onClick={()=>setDeclineSource(null)}>Cancel</button><button type="submit" className="museum-admin-button" disabled={!editable||!decisionsLoaded}>{busy?"Saving…":"Save decision"}</button></div></form></MuseumDetailDialog>:null}{undoRow?<MuseumDetailDialog titleId="undo-placement-title" kicker="Correct a record" closeLabel="Cancel undo" onClose={()=>setUndoSource(null)}><h2 id="undo-placement-title">{undoRow.componentPlacement?"Correct partial staging?":"Undo placement check?"}</h2><p>{undoRow.name}</p>{undoRow.undo?.available?<><p>{undoRow.componentPlacement?`Remove this partial staging confirmation and reopen the Vitrine ${undoRow.componentPlacement.origin.code} clearing. This does not record a physical return or move the separately housed sticks.`:"This corrects a mistaken check. It does not record a physical move back."}</p><p>Previous record: {currentLocationLabel(undoRow.undo.previous)}{undoRow.undo.previousBasis!=="confirmed"?" · not physically confirmed":""}</p><div className="review-actions"><button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>setUndoSource(null)}>{undoRow.componentPlacement?"Keep record":"Keep checked"}</button><button type="button" className="museum-admin-button" disabled={!editable} onClick={undoPlacement}>{undoRow.componentPlacement?"Correct staging record":"Undo check"}</button></div></>:<p>{undoRow.undo?.reason??"The previous state cannot be safely restored for this older confirmation. Its saved location has not changed."}</p>}</MuseumDetailDialog>:null}</div>;
}
