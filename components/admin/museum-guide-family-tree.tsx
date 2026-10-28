"use client";
import type {GuideEntry, GuideGroup} from "@/lib/spn-move-guide";

/** Render the guide's recorded connections without inferring relationships from grouping. */
export function MuseumGuideFamilyTree({group,entries}:{group:GuideGroup;entries:Map<string,GuideEntry>}) {
 const edges=group.edges??[];
 if(!edges.length)return null;
 const ids=[...new Set(edges.flatMap(edge=>[edge.fromSourceId,edge.toSourceId]))];
 const children=new Set(edges.map(edge=>edge.toSourceId));
 const roots=ids.filter(id=>!children.has(id));
 const covered=new Set<string>();
 function node(id:string,path:Set<string>,relation?:string):React.ReactNode {
  covered.add(id);
  const cycle=path.has(id);
  const next=new Set(path).add(id);
  const entry=entries.get(id);
  const descendants=cycle?[]:edges.filter(edge=>edge.fromSourceId===id);
  return <li key={`${relation??"root"}:${id}`}>
   {relation?<small className="museum-guide-tree__relation">{relation}</small>:null}
   <a className="museum-guide-tree__person" href={`#move-${id}`}>{entry?.name??"Related display"}{entry?<small>{entry.tier}</small>:null}</a>
   {descendants.length?<ul>{descendants.map(edge=>node(edge.toSourceId,next,edge.label))}</ul>:null}
  </li>;
 }
 const branches=roots.map(id=>node(id,new Set()));
 for(const id of ids)if(!covered.has(id))branches.push(node(id,new Set()));
 return <div className="museum-guide-tree" aria-label={`${group.title} connections`}><ul>{branches}</ul></div>;
}
