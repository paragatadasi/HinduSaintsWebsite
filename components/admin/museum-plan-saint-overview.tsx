"use client";
import {useEffect,useId,useState} from "react";
import {loadPlanSaintOverviewAction} from "@/app/vrindavanadmin/plan/actions";
import {MuseumSaintDialog} from "./museum-saint-dialog";
import {MuseumDetailDialog} from "./museum-detail-dialog";

export function MuseumPlanSaintOverview({saintId,name,onClose}:{saintId:string;name:string;onClose:()=>void}){
 const titleId=useId();const [data,setData]=useState<Awaited<ReturnType<typeof loadPlanSaintOverviewAction>>|null>(null),[error,setError]=useState(false);
 useEffect(()=>{let active=true;loadPlanSaintOverviewAction(saintId).then(value=>{if(active)setData(value);}).catch(()=>{if(active)setError(true);});return()=>{active=false;};},[saintId]);
 if(data)return <MuseumSaintDialog row={data.row} profile={data.profile??undefined} sectionSlug={data.sectionSlug} sectionHref={`/vrindavanadmin/sections?section=${encodeURIComponent(data.sectionSlug)}`} readOnly onClose={onClose}/>;
 return <MuseumDetailDialog titleId={titleId} kicker="Saint overview" closeLabel="Close saint overview" onClose={onClose}><h2 id={titleId}>{name}</h2>{error?<p role="alert">Could not load this saint. Close and try again.</p>:<p role="status">Loading saint details…</p>}</MuseumDetailDialog>;
}
