"use client";

import Link from "next/link";

export function MuseumPlanTabs({active,disabled=false}:{active:"reviewer"|"companion";disabled?:boolean}){
 return <nav className="admin-tab-strip" aria-label="Move plan">
  {([{id:"reviewer",label:"Proposal reviewer",href:"/museumadmin/plan"},{id:"companion",label:"Move companion",href:"/museumadmin/move"}] as const).map(tab=><Link key={tab.id} className="admin-tab-strip__tab" href={tab.href} prefetch={false} aria-current={active===tab.id?"page":undefined} aria-disabled={disabled||undefined} tabIndex={disabled?-1:undefined} onClick={event=>{if(disabled)event.preventDefault();}}>{tab.label}</Link>)}
 </nav>;
}
