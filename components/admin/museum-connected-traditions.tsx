"use client";
import {useEffect,useId,useRef,useState,type CSSProperties} from "react";
import {Maximize2,X} from "lucide-react";
import graph from "@/data/museum/vrindavan-connected-traditions.json";
import {solveWebLayout,type WebNode} from "@/lib/museum-connected-layout";
import {MuseumDetailDialog} from "./museum-detail-dialog";

export function museumRegionIndex(name:string){return graph.regions.findIndex(region=>region.regionName===name);}
function hull(points:number[][]){
 const cross=(o:number[],a:number[],b:number[])=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
 const sorted=[...points].sort((a,b)=>a[0]-b[0]||a[1]-b[1]),lower:number[][]=[],upper:number[][]=[];
 for(const p of sorted){while(lower.length>1&&cross(lower.at(-2)!,lower.at(-1)!,p)<=0)lower.pop();lower.push(p);}
 for(const p of sorted.reverse()){while(upper.length>1&&cross(upper.at(-2)!,upper.at(-1)!,p)<=0)upper.pop();upper.push(p);}
 return lower.slice(0,-1).concat(upper.slice(0,-1)).map(p=>p.join(",")).join(" ");
}
function endpoint(a:WebNode,b:WebNode){const dx=b.x-a.x,dy=b.y-a.y,t=Math.min((a.w/2+3)/Math.max(.01,Math.abs(dx)),(a.h/2+3)/Math.max(.01,Math.abs(dy)));return {x:a.x+dx*t,y:a.y+dy*t};}
export function MuseumConnectedTraditions({section,onChoose,available}:{section:string;onChoose:(name:string)=>void;available:string[]}){
 const [expanded,setExpanded]=useState(false),title=useId();
 return <section className="museum-connections museum-admin-panel"><div className="section-heading"><div><p className="eyebrow">Regional connections</p><h3>Connected traditions</h3></div><button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>setExpanded(true)} aria-label="Expand connected traditions"><Maximize2 aria-hidden="true"/></button></div>
 <ConnectionGraph section={section} onChoose={onChoose} available={available}/>
 {expanded?<MuseumDetailDialog fullScreen titleId={title} kicker="Planning reference" closeLabel="Close connected traditions" onClose={()=>setExpanded(false)}><h2 id={title}>Connected traditions</h2><ConnectionGraph section={section} onChoose={name=>{onChoose(name);setExpanded(false);}} available={available}/></MuseumDetailDialog>:null}</section>;
}
function ConnectionGraph({section,onChoose,available}:{section:string;onChoose:(name:string)=>void;available:string[]}){
 const stage=useRef<HTMLDivElement>(null),popup=useRef<HTMLDivElement>(null),close=useRef<HTMLButtonElement>(null),lastLink=useRef<HTMLElement|SVGElement|null>(null);
 const [nodes,setNodes]=useState<WebNode[]>([]),[size,setSize]=useState({width:0,height:0});
 const [selected,setSelected]=useState(section),[focus,setFocus]=useState(false);
 const [edge,setEdge]=useState<{index:number;x:number;y:number}|null>(null);
 const drag=useRef<{id:string;x:number;y:number;nx:number;ny:number;moved:boolean}|null>(null),suppress=useRef(false);
 useEffect(()=>setSelected(section),[section]);
 useEffect(()=>{
  const el=stage.current;if(!el)return;let previous=0,frame=0;
  const layout=()=>{frame=0;const width=el.clientWidth;if(width<1||Math.abs(width-previous)<1)return;previous=width;
   // Geometry derives from the shared card-width token and actual label height.
   const desired=parseFloat(getComputedStyle(el).getPropertyValue("--width-museum-web-node"));
   const w=Math.min(desired,Math.max(120,width*.28));
   const next=graph.regions.flatMap((r,i)=>r.subsections.map(s=>({id:s.existingSlug,name:s.name,region:r.regionSlug,regionIndex:i,w,h:Math.max(96,(Math.ceil(s.name.length/(w/7))+Math.ceil(r.regionName.length/(w/7)))*18+24),x:0,y:0,vx:0,vy:0})));
   const height=Math.max(720,Math.ceil(next.reduce((sum,n)=>sum+n.w*n.h,0)/(width*.43)));
   solveWebLayout(next,graph.edges,width,height);setSize({width,height});setNodes(next);
  };
  const observer=new ResizeObserver(()=>{if(!frame)frame=requestAnimationFrame(layout);});observer.observe(el);layout();
  return()=>{observer.disconnect();cancelAnimationFrame(frame);};
 },[]);
 useEffect(()=>{
  if(!edge||!popup.current||!stage.current)return;
  const box=stage.current.getBoundingClientRect(),panel=popup.current.getBoundingClientRect();
  const x=Math.max(0,Math.min(edge.x,size.width-panel.width)),top=Math.max(0,-box.top),bottom=Math.min(size.height,window.innerHeight-box.top);
  const y=Math.max(top,Math.min(edge.y,Math.max(top,bottom-panel.height)));
  if(x!==edge.x||y!==edge.y)setEdge({...edge,x,y});
 },[edge,size.width,size.height]);
 const byName=new Map(nodes.map(n=>[n.name,n]));
 const neighbours=new Set(graph.edges.filter(e=>e.source===selected||e.target===selected).flatMap(e=>[e.source,e.target]));
 const dismiss=(restore=false)=>{setEdge(null);if(restore)lastLink.current?.focus({preventScroll:true});};
 return <div className="museum-connected-graph" onKeyDown={event=>{if(event.key==="Escape"&&edge){event.preventDefault();event.stopPropagation();dismiss(true);}}} onPointerDown={event=>{if(edge&&!popup.current?.contains(event.target as Node)&&!(event.target as Element).closest(".museum-web-edge"))dismiss();}}>
  <div className="museum-web-legend"><span>Solid: documented connection</span><span>Dotted: curatorial adjacency</span><span className="museum-web-priority-key">Heavy gold: recommended adjacency</span></div>
  <div className="museum-web-regions">{graph.regions.map((r,i)=><span key={r.regionSlug} data-region={i}>{r.regionName}</span>)}</div>
  <label className="museum-check-toggle"><input type="checkbox" checked={focus} onChange={e=>{setFocus(e.target.checked);dismiss();}}/> Focus on selected section</label>
  <div className="museum-web-stage" ref={stage} style={{height:size.height||undefined}}>
   <svg className="museum-web-lines" viewBox={`0 0 ${size.width||1} ${size.height||1}`} aria-label="Connections between museum sections">
    <g aria-hidden="true" className="museum-web-fields">{graph.regions.map((r,i)=><polygon key={r.regionSlug} data-region={i} points={hull(nodes.filter(n=>n.region===r.regionSlug).flatMap(n=>[[n.x-n.w/2-18,n.y-n.h/2-18],[n.x+n.w/2+18,n.y-n.h/2-18],[n.x+n.w/2+18,n.y+n.h/2+18],[n.x-n.w/2-18,n.y+n.h/2+18]]))}/>)}</g>
    {graph.edges.map((e,i)=>{const a=byName.get(e.source),b=byName.get(e.target);if(!a||!b||(focus&&!neighbours.has(e.source))||(focus&&e.source!==selected&&e.target!==selected))return null;const p=endpoint(a,b),q=endpoint(b,a),d=`M${p.x},${p.y} L${q.x},${q.y}`;
     return <a key={i} href="#connection" className="museum-web-edge" aria-label={`${e.priorityBoundary?"Priority adjacency: ":""}${e.source} to ${e.target}: ${e.kind}`} onClick={event=>{event.preventDefault();lastLink.current=event.currentTarget;const rect=stage.current!.getBoundingClientRect();setEdge({index:i,x:event.detail?event.clientX-rect.left:(p.x+q.x)/2,y:event.detail?event.clientY-rect.top:(p.y+q.y)/2});if(!event.detail)requestAnimationFrame(()=>close.current?.focus({preventScroll:true}));}}><path d={d} className={`museum-web-line ${e.kind}${e.priorityBoundary?" priority":""}${edge?.index===i?" selected":""}`}/><path d={d} className="museum-web-hit"/></a>;
    })}
   </svg>
   {nodes.map(n=><button type="button" key={n.id} className="museum-web-node" data-region={n.regionIndex} data-muted={focus&&!neighbours.has(n.name)} aria-pressed={n.name===selected} style={{left:n.x-n.w/2,top:n.y-n.h/2,width:n.w,minHeight:n.h} as CSSProperties} onClick={()=>{if(suppress.current){suppress.current=false;return;}setSelected(n.name);dismiss();}}
    onPointerDown={e=>{if(e.button!==0)return;drag.current={id:n.id,x:e.clientX,y:e.clientY,nx:n.x,ny:n.y,moved:false};}}
    onPointerMove={e=>{const current=drag.current;if(!current||current.id!==n.id)return;const dx=e.clientX-current.x,dy=e.clientY-current.y;if(!current.moved&&Math.hypot(dx,dy)>6){current.moved=true;e.currentTarget.setPointerCapture(e.pointerId);}if(!current.moved)return;setNodes(all=>all.map(node=>node.id===n.id?{...node,x:Math.max(n.w/2,Math.min(size.width-n.w/2,current.nx+dx)),y:Math.max(n.h/2,Math.min(size.height-n.h/2,current.ny+dy))}:node));}}
    onPointerUp={e=>{suppress.current=!!drag.current?.moved;drag.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}}
    onPointerCancel={()=>{drag.current=null;suppress.current=false;}}><small>{graph.regions[n.regionIndex].regionName}</small>{n.name}</button>)}
   {edge?<div ref={popup} className="museum-web-popup" role="dialog" aria-label="Connection details" style={{left:edge.x,top:edge.y}}><button ref={close} type="button" className="museum-web-close" onClick={()=>dismiss(true)} aria-label="Close connection details"><X aria-hidden="true"/></button><strong>{graph.edges[edge.index].source} ↔ {graph.edges[edge.index].target}</strong>{graph.edges[edge.index].priorityBoundary?<p className="eyebrow">Recommended physical adjacency</p>:null}<p>{graph.edges[edge.index].kind==="documented"?"Documented historical, biographical or traditional connection":"Proposed curatorial adjacency · not genealogy"}</p><p>{graph.edges[edge.index].rationale}</p><details onToggle={()=>setEdge(current=>current?{...current}:null)}><summary>Sources</summary>{graph.edges[edge.index].sourceKeys.map(key=>{const source=graph.sources.find(s=>s.key===key)!;return <p key={key}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></p>;})}{!graph.edges[edge.index].sourceKeys.length?<p>Curatorial proposal.</p>:null}</details></div>:null}
  </div>
  <div className="museum-web-selection" aria-live="polite"><strong>{selected}</strong>{available.includes(selected)?<button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>onChoose(selected)}>Arrange this section</button>:<span>No current planning entries</span>}</div>
  <details><summary>How to read this companion</summary><p>Colours and soft fields group the six regions. Dragging explores connections only; it does not change saved areas, family membership or saint assignments. Field size and distance do not measure holdings, capacity or evidence.</p><p>Solid lines describe named historical, biographical or traditional connections, not a shared initiating lineage for every saint. Dotted lines suggest curatorial adjacency. The two heavier gold links recommend physical adjacency, not stronger evidence.</p></details>
 </div>;
}

