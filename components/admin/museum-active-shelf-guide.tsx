"use client";
import type {ComponentProps} from "react";
import {MuseumShelfGuide} from "./museum-shelf-guide";
import {useMuseumShelfPlans} from "./use-museum-shelf-plans";

const reviewedCases=new Set(["46","2","28","78","36","29","76","37","26","24","23","75","79","32","33","77","34","35","38"]);

export function MuseumActiveShelfGuide(props:ComponentProps<typeof MuseumShelfGuide>){
 const reviewed=reviewedCases.has(props.vitrine);
 const {context,error,refresh}=useMuseumShelfPlans(reviewed);
 if(!reviewed)return <MuseumShelfGuide key={props.vitrine} {...props}/>;
 const plan=context?.cases.find(item=>item.code===props.vitrine);
 const allocations=plan?.allocations.filter(allocation=>{
  const row=props.rows.find(item=>item.sourceId===allocation.sourceId);
  return row&&!row.identityChanged&&(row.saintId??null)===(allocation.saintId??null)&&row.sourceRevision===allocation.sourceRevision;
 });
 return <>
  {error?<p role="alert">{error} <button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={refresh}>Retry</button></p>:null}
  {!context&&!error?<p role="status">Loading shelf arrangement…</p>:null}
  {plan?<MuseumShelfGuide key={props.vitrine} {...props} plan={{...plan,allocations:allocations??[],refinedBandExceptions:plan.bandExceptions.map(item=>({shelfIndex:item.band,knownLoad:item.knownLoad}))}}/>:null}
  {plan?.reviewedChanges.some(change=>change.visibility==="pending")?<details><summary>Shelf positions to review</summary>{plan.reviewedChanges.filter(change=>change.visibility==="pending").map(change=><p key={change.sourceId}><strong>{change.name}</strong> · {change.reason}</p>)}</details>:null}
 </>;
}
