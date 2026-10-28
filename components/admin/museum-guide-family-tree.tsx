"use client";
import {useId,useState,type ReactNode} from "react";
import {MuseumDetailDialog} from "./museum-detail-dialog";
import type {GuideEntry, GuideGroup} from "@/lib/spn-move-guide";

/** Render the guide's recorded connections without inferring relationships from grouping. */
export function MuseumGuideFamilyTree({group,entries,renderControl}:{group:GuideGroup;entries:Map<string,GuideEntry>;renderControl?:(id:string)=>ReactNode}) {
 const [selected,setSelected]=useState<string|null>(null);
 const titleId=useId();
 const member=selected?entries.get(selected):undefined;
 const edges=group.edges??[];
 if(!edges.length)return null;
 const ids=[...new Set(edges.flatMap(edge=>[edge.fromSourceId,edge.toSourceId]))];
 const children=new Set(edges.map(edge=>edge.toSourceId));
 const rank=(id:string)=>{const index=["Primary","Secondary","Tertiary"].indexOf(entries.get(id)?.tier??"");return index<0?3:index;};
 const roots=ids.filter(id=>!children.has(id)).sort((a,b)=>rank(a)-rank(b));
 const covered=new Set<string>();
 function node(id:string,path:Set<string>,relation?:string):React.ReactNode {
  covered.add(id);
  const cycle=path.has(id);
  const next=new Set(path).add(id);
  const entry=entries.get(id);
  const descendants=cycle?[]:edges.filter(edge=>edge.fromSourceId===id).sort((a,b)=>rank(a.toSourceId)-rank(b.toSourceId));
  return <li key={`${relation??"root"}:${id}`}>
   {relation?<small className="museum-guide-tree__relation">{relation}</small>:null}
   <div className="museum-guide-tree__member">{renderControl?.(id)}<button type="button" className="museum-guide-tree__person" onClick={()=>setSelected(id)}>{entry?.name??"Related display"}{entry?<span className="museum-guide-tier">{entry.tier}</span>:null}</button></div>
   {descendants.length?<ul>{descendants.map(edge=>node(edge.toSourceId,next,edge.label))}</ul>:null}
  </li>;
 }
 const branches=roots.map(id=>node(id,new Set()));
 for(const id of ids)if(!covered.has(id))branches.push(node(id,new Set()));
 return <div className="museum-guide-tree" aria-label={`${group.title} connections`}><ul>{branches}</ul>{selected?<MuseumDetailDialog titleId={titleId} kicker="Guide details" closeLabel="Close saint details" onClose={()=>setSelected(null)}><h2 id={titleId}>{member?.name??"Related display"}</h2>{member?<><p>{member.tier}{member.city?` · ${member.city}`:""}</p><p>Proposed: Vitrine {member.destination}</p>{member.relicDescription?<p>{member.relicDescription}</p>:null}<p>{member.rationale}</p>{member.reviewNotes?.map(note=><p key={note}>{note}</p>)}</>:<p>Details are not available in this guide.</p>}</MuseumDetailDialog>:null}</div>;
}
