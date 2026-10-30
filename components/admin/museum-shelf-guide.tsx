"use client";
import {useState,useRef,useLayoutEffect,type ReactNode} from "react";
import addon from "@/data/museum/spn-vitrine5-shelves-v1.json";
import packet from "@/data/museum/spn-northern-shelves-v1.json";
import {companionLocationLabel,isPlaced,type CompanionRow,type GuideEntry} from "@/lib/spn-move-guide";

type Allocation={sourceId:string;name:string;tier?:string;capturedTier?:string;groupId:string;suggestedShelfIndex:number|null;isContextOnly?:boolean;reviewAlerts:{message:string}[]};
type ShelfPlan={code:string;groups:{id:string;title:string;kind:string}[];allocations:Allocation[];relationships:{fromSourceId:string;toSourceId:string;label:string;direction:string;uncertain:boolean}[];contextNodes?:{id:string;label:string;physicalHolding:boolean}[]};
const plans:ShelfPlan[]=[...packet.vitrines,...addon.vitrines];
function TreeLines({children,wide,edges}:{children:ReactNode;wide:boolean;edges:{fromSourceId:string;toSourceId:string;uncertain:boolean}[]}){
 const root=useRef<HTMLDivElement>(null);
 const [paths,setPaths]=useState<{d:string;uncertain:boolean}[]>([]);
 useLayoutEffect(()=>{
  const host=root.current;if(!host)return;
  const draw=()=>{const bounds=host.getBoundingClientRect();const nodes=[...host.querySelectorAll<HTMLElement>("[data-tree-node]")];setPaths(edges.flatMap(edge=>{const from=nodes.find(n=>n.dataset.treeNode===edge.fromSourceId),to=nodes.find(n=>n.dataset.treeNode===edge.toSourceId);if(!from||!to)return [];const a=from.getBoundingClientRect(),b=to.getBoundingClientRect();const x=a.left+a.width/2-bounds.left,y=a.bottom-bounds.top,endX=b.left+b.width/2-bounds.left,endY=b.top-bounds.top,mid=(y+endY)/2;return [{d:`M ${x} ${y} V ${mid} H ${endX} V ${endY}`,uncertain:edge.uncertain}];}));};
  const observer=new ResizeObserver(draw);observer.observe(host);draw();return()=>observer.disconnect();
 },[edges,wide]);
 return <div ref={root} className={wide?"museum-shelf__tree museum-shelf__tree--wide":"museum-shelf__tree"}><svg aria-hidden="true" className="museum-shelf__lines">{paths.map((path,i)=><path key={i} d={path.d} data-uncertain={path.uncertain}/>)}</svg>{children}</div>;
}
export function MuseumShelfGuide({vitrine,entries,rows,sourceIds,renderControl,renderActions}:{vitrine:string;entries:Map<string,GuideEntry>;rows:CompanionRow[];sourceIds:string[];renderControl:(id:string)=>ReactNode;renderActions:(id:string)=>ReactNode}){
 const [expanded,setExpanded]=useState<string|null>(null);
 const plan=plans.find(v=>v.code===vitrine);
 if(!plan)return null;
 const allowed=new Set(sourceIds);
 const allocations=plan.allocations.filter(a=>allowed.has(a.sourceId)&&entries.get(a.sourceId)?.destination===vitrine);
 const ids=new Set(allocations.map(a=>a.sourceId));
 const groups=plan.groups.filter(g=>allocations.some(a=>a.groupId===g.id));
 const familyGroups=groups.filter(g=>g.kind==="family");
 const color=(a:Allocation)=>groups.findIndex(g=>g.id===a.groupId)%6;
 function member(a:Allocation,controls=true){
  const entry=entries.get(a.sourceId),row=rows.find(r=>r.sourceId===a.sourceId);
  const placed=row&&isPlaced(row,vitrine);
  return <div className="museum-shelf__member" data-group-color={color(a)} key={a.sourceId}>
   <div className="museum-shelf__card-header">{controls&&!a.isContextOnly?renderControl(a.sourceId):null}<span className="museum-guide-tier">{entry?.tier??a.tier??a.capturedTier}</span></div><div className="museum-shelf__card-content"><strong>{entry?.name??a.name}</strong>{a.isContextOnly?<small>Context only · no recorded relic</small>:null}
   <small>{placed?"Placed · ":""}{companionLocationLabel(row)}{row?.current&&row.currentBasis!=="confirmed"?" · source-reported":""}</small>
   {entry?.lifeStatus?.tag?<small>{entry.lifeStatus.tag}</small>:null}
   {a.reviewAlerts.length?<details className="museum-shelf__alert"><summary aria-label={`Review placement notes for ${a.name}`}>!</summary>{a.reviewAlerts.map((alert,i)=><p key={i}>{alert.message}</p>)}</details>:null}
   {controls&&!a.isContextOnly?renderActions(a.sourceId):null}</div>
  </div>;
 }
 function tree(groupId:string){
  const members=allocations.filter(a=>a.groupId===groupId),memberIds=new Set(members.map(a=>a.sourceId));
  const contextIds=new Set(plan?.contextNodes?.map(n=>n.id)??[]);
  const edges=(plan?.relationships??[]).filter(e=>(memberIds.has(e.fromSourceId)||contextIds.has(e.fromSourceId))&&(memberIds.has(e.toSourceId)||contextIds.has(e.toSourceId)));
  const directed=edges.filter(e=>e.direction!=="none");
  const depths=new Map(members.map(a=>[a.sourceId,0]));
  // A bounded traversal keeps a malformed cycle from hanging the operational view.
  for(let step=0;step<members.length;step++){
   let changed=false;
   for(const edge of directed){const depth=Math.min(members.length-1,(depths.get(edge.fromSourceId)??0)+1);if(depth>(depths.get(edge.toSourceId)??0)){depths.set(edge.toSourceId,depth);changed=true;}}
   if(!changed)break;
  }
  const wide=expanded===groupId;
  const levels=[...new Set(depths.values())].sort((a,b)=>a-b);
  return <TreeLines wide={wide} edges={directed}>{levels.map(depth=><div className="museum-shelf__generation" key={depth}>{members.filter(a=>depths.get(a.sourceId)===depth).map(a=><div key={a.sourceId} className="museum-shelf__branch">
   {directed.filter(e=>e.toSourceId===a.sourceId).map(e=><small className="museum-shelf__relation" data-uncertain={e.uncertain} key={e.fromSourceId+e.label}>{entries.get(e.fromSourceId)?.name} · {e.label}</small>)}<div data-tree-node={a.sourceId}>{member(a,false)}</div>
  </div>)}</div>)}{edges.filter(e=>e.direction==="none").map(e=><p className="museum-shelf__relation" data-uncertain={e.uncertain} key={e.fromSourceId+e.toSourceId}>{entries.get(e.fromSourceId)?.name??plan?.contextNodes?.find(n=>n.id===e.fromSourceId)?.label} — {entries.get(e.toSourceId)?.name??plan?.contextNodes?.find(n=>n.id===e.toSourceId)?.label}: {e.label}</p>)}</TreeLines>;
 }
 return <section className="museum-shelf" aria-label="Suggested shelf arrangement"><h3>Shelf arrangement</h3><p className="muted">Suggested positions · confirm shelf spacing on site</p>
 <div className="museum-shelf__legend">{groups.map((g,i)=><span data-group-color={i%6} key={g.id}>{g.title} · {g.kind}</span>)}</div>
 <div className="museum-shelf__workspace" data-expanded={expanded!==null}><div className="museum-shelf__bands">{[1,2,3,4,5].map(index=><section className="museum-shelf__band" key={index}><small>{index===1?"Top":index===5?"Bottom":`Row ${index}`}</small><div>{familyGroups.map(g=><div className="museum-shelf__column" key={g.id}>{allocations.filter(a=>a.suggestedShelfIndex===index&&a.groupId===g.id).map(a=>member(a))}</div>)}<div className="museum-shelf__locality">{allocations.filter(a=>a.suggestedShelfIndex===index&&!familyGroups.some(g=>g.id===a.groupId)).map(a=>member(a))}</div></div></section>)}
 {allocations.some(a=>a.suggestedShelfIndex===null)?<section><h4>Position to confirm</h4>{allocations.filter(a=>a.suggestedShelfIndex===null).map(a=>member(a))}</section>:null}
 {sourceIds.some(id=>!ids.has(id))?<p className="muted">Other current assignments are in the complete checklist below.</p>:null}</div>
 <aside aria-label="Connections">{familyGroups.map(g=><section key={g.id}><button type="button" className="museum-shelf__disclosure" aria-expanded={expanded===g.id} onClick={()=>setExpanded(expanded===g.id?null:g.id)}><span aria-hidden="true">{expanded===g.id?"▸":"◂"}</span>{g.title}</button>{tree(g.id)}</section>)}</aside></div></section>;
}
