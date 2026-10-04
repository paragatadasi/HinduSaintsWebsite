"use client";
import Link from "next/link";
import type {Route} from "next";
import {usePathname,useSearchParams} from "next/navigation";
import {Landmark,ClipboardList,Layers,ArrowUpRight} from "lucide-react";
import type {ReactNode} from "react";
import {museumSectionNavigation,museumNavIsActive,type MuseumNavSection,type MuseumNavLink} from "@/lib/museum-navigation";
function Group({title,eyebrow,badge,children}:{title:string;eyebrow?:string;badge:ReactNode;children:ReactNode}) {
 return <section className="museum-admin-nav__group"><div className="museum-admin-nav__group-heading"><span aria-hidden="true">{badge}</span><div><strong>{title}</strong>{eyebrow?<small>{eyebrow}</small>:null}</div></div>{children}</section>;
}
export function MuseumNavigation({museum,sections,canViewSections,sectionsUnavailable=false}:{museum:"spn"|"vrindavan";sections:MuseumNavSection[];canViewSections:boolean;sectionsUnavailable?:boolean}) {
 const pathname=usePathname(),params=useSearchParams(),section=params.get("section");
 const groups=museumSectionNavigation(sections,museum);
 const overview=museum==="spn"?"/museumadmin":"/vrindavanadmin/sections";
 const workflows:MuseumNavLink[]=[...(canViewSections?[{label:"Section overview",href:overview}]:[]),...(museum==="spn"?[{label:"Placement review",href:"/museumadmin/review"},{label:"Vitrines and shelves",href:"/museumadmin/locations"},{label:"Moves and relics",href:"/museumadmin/collections"}]:[{label:"Relics and locations",href:"/vrindavanadmin"}])];
 const links=(items:MuseumNavLink[])=><div className="museum-admin-nav__group-links">{items.map(item=><Link key={item.href} href={item.href as Route} prefetch={false} aria-current={museumNavIsActive(item.href,pathname,section)?"page":undefined}><span>{item.label}</span>{item.count!==undefined?<small aria-label={`${item.count} saints`}>{item.count}</small>:null}</Link>)}</div>;
 return <nav aria-label="Museum workspace">
  <Group title="Museum" eyebrow="Choose your workspace" badge={<Landmark/>}><div className="museum-admin-nav__group-links museum-admin-nav__museum-switch"><Link href="/museumadmin" prefetch={false} aria-current={museum==="spn"?"true":undefined}><span>SPN</span></Link><Link href={"/vrindavanadmin" as Route} prefetch={false} aria-current={museum==="vrindavan"?"true":undefined}><span>Vrindavan</span></Link></div></Group>
  <Group title="Curator workspace" eyebrow="Review and arrange" badge={<ClipboardList/>}>{links(workflows)}</Group>
  {canViewSections?<Group title="Section proposals" eyebrow="Explore the museum" badge={<Layers/>}><div className="museum-admin-nav__sections">{groups.map(group=><Group key={group.title} title={group.title} eyebrow={group.eyebrow} badge={group.badge}>{links(group.links)}</Group>)}{sectionsUnavailable?<p className="museum-filter-note">Section navigation is temporarily unavailable.</p>:null}</div></Group>:null}
  <Group title="More" badge={<ArrowUpRight/>}>{links([{label:"Main admin",href:"/admin"},{label:"Public site",href:"/"}])}</Group>
 </nav>;
}
