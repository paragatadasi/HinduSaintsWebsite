"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {loadMoveProposalAction,saveMoveProposalAction} from "@/app/vrindavanadmin/plan/actions";
import {requestVrindavanRelationshipCorrectionAction} from "@/app/vrindavanadmin/actions";
import {MuseumDetailDialog} from "./museum-detail-dialog";
import {VrindavanProposalEditor} from "./vrindavan-proposal-controls";
import {MuseumDisplayMembershipEditor} from "./museum-display-membership-editor";

export function MuseumPlannerProposalEditor({saintId,name,onClose}:{saintId:string;name:string;onClose:()=>void}){
 const router=useRouter();const [data,setData]=useState<Awaited<ReturnType<typeof loadMoveProposalAction>>|null>(null),[error,setError]=useState("");
 useEffect(()=>{let active=true;loadMoveProposalAction(saintId).then(value=>{if(active)setData(value);}).catch(()=>{if(active)setError("Could not load the latest proposal. Close and try again.");});return()=>{active=false;};},[saintId]);
 async function save(form:FormData){try{const result=await saveMoveProposalAction(form);if(!result.error){router.refresh();onClose();}return result;}catch{return {error:"The save could not be confirmed. Reload the plan before trying again."};}}
 return <MuseumDetailDialog titleId="museum-quick-proposal" kicker="Tier and display family" closeLabel="Close proposal editor" onClose={onClose}>
  <h2 id="museum-quick-proposal">{name}</h2>
  {error?<p role="alert">{error}</p>:!data?<p role="status">Loading current proposal…</p>:<>
   <VrindavanProposalEditor row={data.row} options={data.options} action={save}/>
   <MuseumDisplayMembershipEditor row={data.row} canEditRelationships={data.canEditRelationships} correctionAction={requestVrindavanRelationshipCorrectionAction}/>
  </>}
 </MuseumDetailDialog>;
}
