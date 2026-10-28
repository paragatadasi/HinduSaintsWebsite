"use client";
import {type ReactNode} from "react";
import {currentLocationLabel,isPlaced,type CompanionRow,type GuideEntry,type GuideGroup} from "@/lib/spn-move-guide";

/** Render the guide's recorded connections without inferring relationships from grouping. */
export function MuseumGuideFamilyTree({group,entries,physicalRows,renderControl,renderActions,showLocations=true}:{group:GuideGroup;entries:Map<string,GuideEntry>;physicalRows?:CompanionRow[];renderControl?:(id:string)=>ReactNode;renderActions?:(id:string)=>ReactNode;showLocations?:boolean}) {
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
  const location=physicalRows?.find(row=>row.sourceId===id);
  const descendants=cycle?[]:edges.filter(edge=>edge.fromSourceId===id).sort((a,b)=>rank(a.toSourceId)-rank(b.toSourceId));
  return <li key={`${relation??"root"}:${id}`}>
   <div className="museum-guide-tree__member">{renderControl?.(id)}<div className="museum-guide-tree__body">{relation?<small className="museum-guide-tree__relation">{relation}</small>:null}<div className="museum-guide-tree__person">{entry?.name??"Related display"}{entry?<span className="museum-guide-tier">{entry.tier}</span>:null}{showLocations?<small className="museum-guide-tree__location">{location&&entry&&isPlaced(location,entry.destination)?"Placed":"Bring from"}: {currentLocationLabel(location?.current??null)}{location?.currentBasis!=="confirmed"&&location?.current?" · source-reported":""}</small>:null}{showLocations&&entry?.reportedOrigin&&location?.currentBasis!=="confirmed"?<small>{entry.reportedOrigin}</small>:null}{entry?.lifeStatus?.tag?<small>{entry.lifeStatus.tag}</small>:null}</div>{renderActions?.(id)}</div></div>
   {descendants.length?<ul>{descendants.map(edge=>node(edge.toSourceId,next,edge.label))}</ul>:null}
  </li>;
 }
 const branches=roots.map(id=>node(id,new Set()));
 for(const id of ids)if(!covered.has(id))branches.push(node(id,new Set()));
 return <div className="museum-guide-tree" aria-label={`${group.title} connections`}><ul>{branches}</ul></div>;
}
