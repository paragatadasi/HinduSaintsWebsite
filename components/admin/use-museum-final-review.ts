"use client";

import {useCallback,useEffect,useRef,useState} from "react";
import type {FinalReviewRecord as ReviewRecord,FinalReviewSnapshot} from "@/lib/museum-final-review-domain";
import {isPlaced,type CompanionRow} from "@/lib/spn-move-guide";
import {mergeFinalReviewRecords,mergeFinalReviewSnapshot} from "@/lib/museum-final-review-client";
import type {FinalReviewRecord} from "@/lib/museum-final-review-view";
import type {FinalReviewAction} from "./museum-final-review";

const endpoint="/api/admin/museum-final-review";
type PendingSave={record:FinalReviewRecord;action:FinalReviewAction;requestId:string;proposalSaved?:Pick<ReviewRecord,"reviewVersion">;physicalBody?:Record<string,unknown>;reviewBody?:Record<string,unknown>};
class SaveError extends Error{constructor(message:string,readonly status:number){super(message);}}

export function useMuseumFinalReview(active:boolean,onPhysicalSaved:(rows:CompanionRow[])=>void,onChanged:()=>void){
  const [snapshot,setSnapshot]=useState<FinalReviewSnapshot|null>(null);
  const [error,setError]=useState("");
  const [errors,setErrors]=useState<Record<string,string>>({});
  const [savingSources,setSavingSources]=useState<ReadonlySet<string>>(new Set());
  const [pendingSources,setPendingSources]=useState<ReadonlySet<string>>(new Set());
  const pending=useRef(new Map<string,PendingSave>()),saving=useRef(new Set<string>());
  const epoch=useRef(0),etag=useRef(""),revision=useRef(""),reading=useRef(false);
  const callbacks=useRef({onPhysicalSaved,onChanged});callbacks.current={onPhysicalSaved,onChanged};
  const physicalHeads=useRef(new Map<string,string>());
  const publishPhysical=useCallback((rows:CompanionRow[])=>{
    const changed=rows.filter(row=>{
      const head=[row.sourceRevision,row.currentRevision,row.currentVersion,row.identityChanged].join(":");
      if(physicalHeads.current.get(row.sourceId)===head)return false;
      physicalHeads.current.set(row.sourceId,head);return true;
    });
    if(changed.length)callbacks.current.onPhysicalSaved(changed);
  },[]);
  const applyRecord=useCallback((record:ReviewRecord)=>setSnapshot(previous=>previous?{...previous,records:mergeFinalReviewRecords(previous.records,[record])}:previous),[]);
  const reload=useCallback(async(sourceId?:string)=>{
    if(!sourceId&&reading.current)return;
    if(!sourceId)reading.current=true;
    const started=epoch.current,controller=new AbortController(),timeout=window.setTimeout(()=>controller.abort(),20000);
    try{
      const query=sourceId?"?sourceId="+encodeURIComponent(sourceId):revision.current?"?since="+encodeURIComponent(revision.current):"";
      const response=await fetch(endpoint+query,{cache:"no-store",signal:controller.signal,headers:!sourceId&&etag.current?{"If-None-Match":etag.current}:{}});
      if(response.status===304){setError("");return;}
      const result=await response.json();
      if(!response.ok||!Array.isArray(result.records))throw new Error(result.error||"Could not load final review.");
      if(started!==epoch.current)return;
      if(sourceId){const record=result.records.find((item:ReviewRecord)=>item.sourceId===sourceId);if(record){applyRecord(record);publishPhysical([record.physical]);}}
      else if(!saving.current.size){setSnapshot(previous=>mergeFinalReviewSnapshot(previous,result));etag.current=response.headers.get("ETag")??"";revision.current=result.revision;publishPhysical(result.records.map((record:ReviewRecord)=>record.physical));}
      setError("");
    }catch(error){setError(error instanceof Error&&error.name!=="AbortError"?error.message:"Review updates took too long. Retry to reconnect.");}
    finally{window.clearTimeout(timeout);if(!sourceId)reading.current=false;}
  },[applyRecord,publishPhysical]);
  useEffect(()=>{
    if(!active)return;
    void reload();
    const refresh=()=>{if(document.visibilityState==="visible"&&!saving.current.size)void reload();};
    const timer=window.setInterval(refresh,10000);
    window.addEventListener("focus",refresh);document.addEventListener("visibilitychange",refresh);
    return()=>{window.clearInterval(timer);window.removeEventListener("focus",refresh);document.removeEventListener("visibilitychange",refresh);};
  },[active,reload]);
  useEffect(()=>{
    const warn=(event:BeforeUnloadEvent)=>{if(pending.current.size){event.preventDefault();event.returnValue="";}};
    window.addEventListener("beforeunload",warn);return()=>window.removeEventListener("beforeunload",warn);
  },[]);
  async function post(url:string,body:Record<string,unknown>){
    const controller=new AbortController(),timeout=window.setTimeout(()=>controller.abort(),30000);
    try{
      const response=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),signal:controller.signal});
      const result=await response.json();
      if(!response.ok)throw new SaveError(result.error||"Could not save this change.",response.status);
      return result;
    }finally{window.clearTimeout(timeout);}
  }
  async function execute(save:PendingSave){
    const {record,action}=save,sourceId=record.sourceId;
    if(saving.current.has(sourceId))throw new Error("This record is still saving.");
    saving.current.add(sourceId);epoch.current++;setSavingSources(new Set(saving.current));setErrors(previous=>({...previous,[sourceId]:""}));
    try{
      const common={museumId:"museum-spn",sourceId,saintId:record.row.saintId,expectedSourceRevision:record.row.sourceRevision,expectedReviewVersion:record.version,clientRequestId:save.requestId};
      if(action.action==="review"||action.action==="unreview"){
        const result=await post(endpoint,{...common,action:action.action==="review"?"review.confirm":"review.clear",expectedCurrentRevision:record.row.currentRevision,expectedLocationVersion:record.row.currentVersion,...(action.action==="review"?{vitrine:record.destination}:{})});
        if(!result.record)throw new Error("The review has not been confirmed. Retry the same save.");
        applyRecord(result.record);publishPhysical([result.record.physical]);callbacks.current.onChanged();
        pending.current.delete(sourceId);etag.current="";return;
      }
      let proposal=save.proposalSaved;
      if(!proposal&&action.action!=="undo"){
        const fields=action.action==="flag"?{action:"flag.set",kind:action.type,note:action.note}:action.action==="resolve"?{action:"flag.resolve"}:action.action==="destination"&&action.notOnDisplay?{action:"decision.set",decision:"not_on_display",note:action.note}:{action:"proposal.set",vitrine:action.action==="destination"?action.vitrine:record.destination,shelf:action.action==="destination"?action.shelf:record.destinationShelf??undefined,expectedCurrentRevision:record.row.currentRevision,expectedLocationVersion:record.row.currentVersion};
        const result=await post(endpoint,{...common,...fields});
        if(!result.record)throw new Error("The save has not been confirmed. Retry the same save.");
        proposal=result.record;save.proposalSaved=proposal;applyRecord(result.record);etag.current="";callbacks.current.onChanged();
      }
      if(action.action==="destination"&&action.moved&&!action.notOnDisplay&&!action.shelf.trim()&&proposal){
        save.reviewBody??={...common,action:"review.confirm",clientRequestId:crypto.randomUUID(),expectedReviewVersion:proposal.reviewVersion,expectedCurrentRevision:record.row.currentRevision,expectedLocationVersion:record.row.currentVersion,vitrine:action.vitrine};
        const result=await post(endpoint,save.reviewBody);
        if(!result.record)throw new Error("The final review has not been confirmed. Retry the same save.");
        applyRecord(result.record);publishPhysical([result.record.physical]);callbacks.current.onChanged();
        pending.current.delete(sourceId);etag.current="";return;
      }
      if(action.action==="place"||(action.action==="destination"&&action.moved&&!action.notOnDisplay)||action.action==="undo"){
        if(!save.physicalBody){
          if(action.action==="undo"){
            if(!record.row.undo?.available||!record.row.undo.receiptId)throw new SaveError(record.row.undo?.reason||"This placement cannot be undone. Change its destination instead.",422);
            save.physicalBody={museumId:"museum-spn",sourceId,saintId:record.row.saintId,expectedSourceRevision:record.row.sourceRevision,expectedCurrentRevision:record.row.currentRevision,expectedLocationVersion:record.row.currentVersion,action:"undo",clientRequestId:crypto.randomUUID(),receiptId:record.row.undo.receiptId,mistakenCheckAcknowledged:true};
          }else{
            if(!proposal)throw new Error("The proposed destination has not been saved.");
            const vitrine=action.action==="destination"?action.vitrine:record.destination;
            const now=new Date(),confirmedDate=[now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
            save.physicalBody={museumId:"museum-spn",clientRequestId:crypto.randomUUID(),confirmedDate,datePrecision:"date",physicalConfirmation:true,inventoryAcknowledged:true,evidence:"Reviewer confirmed placement during final museum review.",finalReview:{sourceId,version:proposal.reviewVersion},records:[{sourceId,saintId:record.row.saintId,expectedSourceRevision:record.row.sourceRevision,expectedCurrentRevision:record.row.currentRevision,expectedLocationVersion:record.row.currentVersion,to:{kind:"vitrine",code:vitrine,label:`Vitrine ${vitrine}`,...(action.action==="destination"&&action.shelf.trim()?{shelf:action.shelf.trim()}:{})}}]};
          }
        }
        const result=await post("/api/admin/museum-physical-locations",save.physicalBody);
        if(!Array.isArray(result.rows))throw new Error("The move has not been confirmed. Retry the same save.");
        publishPhysical(result.rows);callbacks.current.onChanged();
        const physical=result.rows.find((row:CompanionRow)=>row.sourceId===sourceId);
        if(physical)setSnapshot(previous=>previous?{...previous,records:previous.records.map(item=>item.sourceId===sourceId&&physical.currentVersion>=item.physical.currentVersion?{...item,physical,addressed:!!item.effectiveDestination&&isPlaced(physical,item.effectiveDestination.vitrine)}:item)}:previous);
        if(physical&&action.action==="destination"&&action.moved&&proposal){
          save.reviewBody??={...common,action:"review.confirm",clientRequestId:crypto.randomUUID(),expectedReviewVersion:proposal.reviewVersion,expectedCurrentRevision:physical.currentRevision,expectedLocationVersion:physical.currentVersion,vitrine:action.vitrine};
          const reviewed=await post(endpoint,save.reviewBody);
          if(!reviewed.record)throw new Error("The final review has not been confirmed. Retry the same save.");
          applyRecord(reviewed.record);
        }
      }
      pending.current.delete(sourceId);etag.current="";
    }catch(error){
      if(error instanceof SaveError&&error.status<500)pending.current.delete(sourceId);
      const prefix=save.reviewBody&&save.physicalBody?"Placement saved; final review not confirmed. ":save.proposalSaved&&(action.action==="place"||action.action==="destination"&&action.moved)?"Proposal saved; move not confirmed. ":"";
      const message=prefix+(error instanceof Error&&error.name!=="AbortError"?error.message:"Save not yet confirmed. Retry the same save.")+(error instanceof SaveError&&error.status===409?" Close this form and review the updated record before trying again.":"");
      setErrors(previous=>({...previous,[sourceId]:message}));throw new Error(message);
    }finally{
      saving.current.delete(sourceId);epoch.current++;setSavingSources(new Set(saving.current));setPendingSources(new Set(pending.current.keys()));
      void reload(sourceId);
    }
  }
  async function act(record:FinalReviewRecord,action:FinalReviewAction){
    if(pending.current.has(record.sourceId))throw new Error("A previous save is unconfirmed. Retry that save first.");
    const save:PendingSave={record,action,requestId:crypto.randomUUID(),...(action.action==="place"&&record.hasFinalProposal?{proposalSaved:{reviewVersion:record.version}}:{})};pending.current.set(record.sourceId,save);setPendingSources(new Set(pending.current.keys()));await execute(save);
  }
  async function retry(sourceId:string){const save=pending.current.get(sourceId);if(save)await execute(save);}
  return {snapshot,error,errors,reload,act,retry,savingSources,pendingSources};
}
