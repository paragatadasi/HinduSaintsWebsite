"use client";
import Link from "next/link";
import type {Route} from "next";
import {usePathname,useSearchParams,useRouter} from "next/navigation";
import {ChevronDown} from "lucide-react";
import {useId,useState,useTransition} from "react";
import {MuseumNavigationDisclosure} from "./museum-navigation-disclosure";
import {museumSectionNavigation,museumNavIsActive,type MuseumNavSection,type MuseumNavLink} from "@/lib/museum-navigation";
const museums = [{id:"spn", label:"SPN", href:"/museumadmin/overview"}, {id:"vrindavan", label:"Vrindavan", href:"/vrindavanadmin"}] as const;
export function MuseumNavigation({museum,sections,canViewSections,sectionsUnavailable=false}:{museum:"spn"|"vrindavan";sections:MuseumNavSection[];canViewSections:boolean;sectionsUnavailable?:boolean}) {
 const router=useRouter(), selectorId=useId();
 const [isSwitching,startMuseumSwitch]=useTransition();
 const [requestedMuseum,setRequestedMuseum]=useState(museum);
 const pendingMuseum=museums.find(item=>item.id===requestedMuseum);
 const pathname=usePathname(),params=useSearchParams(),section=params.get("section");
 const groups=museumSectionNavigation(sections,museum);
 const overview=museum==="spn"?"/museumadmin":"/vrindavanadmin/sections";
 const workflows:MuseumNavLink[]=[...(museum==="spn"?[{label:"Museum Overview",href:"/museumadmin/overview"},...(canViewSections?[{label:"Plan the move",href:"/museumadmin/plan"}]:[])]:[...(canViewSections?[{label:"Plan the move",href:"/vrindavanadmin/plan"}]:[]),{label:"Relics and locations",href:"/vrindavanadmin"}])];
 const links=(items:MuseumNavLink[])=><div className="museum-admin-nav__group-links">{items.map(item=><Link key={item.href} href={item.href as Route} prefetch={false} aria-current={museumNavIsActive(item.href,pathname,section)?"page":undefined}><span>{item.label}</span>{item.count!==undefined?<small aria-label={`${item.count} saints`}>{item.count}</small>:null}</Link>)}</div>;
 return <nav aria-label="Museum workspace" className="museum-navigation" data-museum={museum}>
  <section className="museum-navigation__group"><label className="museum-navigation__heading" htmlFor={selectorId}>Museum</label><div className="museum-navigation__selector"><select id={selectorId} value={isSwitching?requestedMuseum:museum} disabled={isSwitching} aria-describedby={isSwitching?`${selectorId}-status`:undefined} onChange={event => {const selected=museums.find(item=>item.id===event.target.value); if(!selected || selected.id===museum) return; setRequestedMuseum(selected.id); startMuseumSwitch(()=>router.push(selected.href as Route));}}>{museums.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select><ChevronDown aria-hidden="true"/></div><div id={`${selectorId}-status`} role="status" aria-live="polite">{isSwitching?<p className="museum-filter-note">Opening {pendingMuseum?.label}…</p>:null}</div></section>
  <section className="museum-navigation__group"><h2 className="museum-navigation__heading">Workspace</h2>{links(workflows)}</section>
  {canViewSections?<section className="museum-navigation__group"><h2 className="museum-navigation__heading">Section proposals</h2>{links([{label:"Section overview",href:overview}])}<MuseumNavigationDisclosure museum={museum} defaultOpen={groups.some(group=>group.links.some(link=>museumNavIsActive(link.href,pathname,section)))}><div className="museum-navigation__regions">{groups.map(group=><MuseumNavigationDisclosure key={group.title} museum={museum} scope={"region:"+group.title} className="museum-navigation__region" tone={group.badge} defaultOpen={group.links.some(link=>museumNavIsActive(link.href,pathname,section))} title={<span className="museum-navigation__region-title"><small>{group.badge}</small><span>{group.title}</span></span>}>{links(group.links)}</MuseumNavigationDisclosure>)}{sectionsUnavailable?<p className="museum-filter-note">Section navigation is temporarily unavailable.</p>:null}</div></MuseumNavigationDisclosure></section>:null}
  <div className="museum-navigation__utilities">{links([{label:"Main admin",href:"/admin"},{label:"Public site",href:"/"}])}</div>
 </nav>;
}
